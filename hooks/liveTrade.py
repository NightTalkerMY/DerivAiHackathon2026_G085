# app.py
import os
import json
import asyncio
from typing import Set, Dict, Any
from collections import deque
from contextlib import asynccontextmanager

import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

load_dotenv()

FINNHUB_KEY = os.environ.get("FINNHUB_API_KEY")
FINNHUB_WS = f"wss://ws.finnhub.io?token={FINNHUB_KEY}"

SYMBOLS = ["AAPL", "AMZN", "BINANCE:BTCUSDT", "MSFT"]
WINDOW = 100  # change this later anytime

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

                    # Finnhub can bundle multiple trades per message
                    for t in data["data"]:
                        sym = t.get("s")
                        if sym not in windows:
                            continue
                        tick = {"s": sym, "p": t.get("p"), "v": t.get("v"), "t": t.get("t")}
                        windows[sym].append(tick)

                        await broadcast(json.dumps({"type": "tick", "tick": tick}))

        except Exception as e:
            print("Finnhub WS error:", e)
            await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not FINNHUB_KEY:
        raise RuntimeError("Missing FINNHUB_API_KEY")
    task = asyncio.create_task(finnhub_stream())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)

    # send snapshot immediately (history so UI fills without waiting)
    await ws.send_text(json.dumps(make_snapshot()))

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.discard(ws)
