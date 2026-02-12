# app.py
import os
import json
from json import JSONDecodeError
import asyncio
import time
from typing import Set, Dict, List, Optional
from collections import deque
from contextlib import asynccontextmanager

import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY")
FINNHUB_WS = f"wss://ws.finnhub.io?token={FINNHUB_KEY}"
SYMBOLS = [
    "BINANCE:BTCUSDT",
    "BINANCE:ETHUSDT",
    "BINANCE:SOLUSDT",
    "BINANCE:BNBUSDT"
]
WINDOW = 100
TRADES_DB = "trades_history.json"

# --- DATA MODELS ---
class TradeRecord(BaseModel):
    user_id: str
    asset: str = Field(..., example="BINANCE:BTCUSDT")
    side: str = Field(..., example="Buy")  # "Buy" or "Sell"
    entry_price: float
    exit_price: float
    volume: float
    open_time: float = Field(default_factory=time.time)
    close_time: float = Field(default_factory=time.time)
    # Optional but recommended for analysis
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

# --- STATE MANAGEMENT ---
clients: Set[WebSocket] = set()
windows: Dict[str, deque] = {s: deque(maxlen=WINDOW) for s in SYMBOLS}

async def broadcast(message: str):
    dead = []
    for ws in clients:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)

def make_snapshot() -> dict:
    return {
        "type": "snapshot",
        "window": WINDOW,
        "symbols": SYMBOLS,
        "windows": {s: list(windows[s]) for s in SYMBOLS},
    }

# --- BACKGROUND STREAMER ---
async def finnhub_stream():
    while True:
        try:
            async with websockets.connect(FINNHUB_WS) as ws:
                for s in SYMBOLS:
                    await ws.send(json.dumps({"type": "subscribe", "symbol": s}))

                async for raw in ws:
                    data = json.loads(raw)
                    if data.get("type") != "trade" or not data.get("data"):
                        continue

                    for t in data["data"]:
                        sym = t.get("s")
                        if sym not in windows:
                            continue
                        tick = {"s": sym, "p": t.get("p"), "v": t.get("v"), "t": t.get("t")}
                        windows[sym].append(tick)
                        await broadcast(json.dumps({"type": "tick", "tick": tick}))

        except Exception as e:
            print(f"Finnhub WS error: {e}")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not FINNHUB_KEY:
        raise RuntimeError("Missing FINNHUB_API_KEY")
    # Ensure DB exists
    if not os.path.exists(TRADES_DB):
        with open(TRADES_DB, "w") as f:
            json.dump({}, f)
            
    task = asyncio.create_task(finnhub_stream())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

# Add CORS for Frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    await ws.send_text(json.dumps(make_snapshot()))
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.discard(ws)

@app.post("/record-trade")
async def record_trade(trade: TradeRecord):
    """
    Receives completed trade data from the frontend and saves it to the database.
    Compatible with both Pydantic v1 and v2.
    """
    try:
        # 1) Load existing trades (be resilient to empty/corrupted file)
        try:
            with open(TRADES_DB, "r", encoding="utf-8") as f:
                all_trades = json.load(f)
                if not isinstance(all_trades, dict):
                    all_trades = {}
        except (FileNotFoundError, JSONDecodeError):
            all_trades = {}

        # 2) Append the new trade
        if trade.user_id not in all_trades:
            all_trades[trade.user_id] = []

        # Pydantic v2: model_dump(); v1: dict()
        payload = trade.model_dump() if hasattr(trade, "model_dump") else trade.dict()
        all_trades[trade.user_id].append(payload)

        # 3) Save back to disk
        with open(TRADES_DB, "w", encoding="utf-8") as f:
            json.dump(all_trades, f, indent=2)

        return {"status": "success", "message": f"Trade for {trade.asset} recorded."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)