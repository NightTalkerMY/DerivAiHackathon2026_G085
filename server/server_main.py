import os
import logging
import uvicorn
import uuid
import time
import json
import asyncio

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# =========================
# ENV & LOGGING
# =========================

os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

for lib in [
    "urllib3",
    "httpx",
    "transformers",
    "sentence_transformers",
    "huggingface_hub",
    "chromadb"
]:
    logging.getLogger(lib).setLevel(logging.ERROR)

logger = logging.getLogger(__name__)

# =========================
# INTERNAL MODULES
# =========================

from synthesizer import QuerySynthesizer
from rag import RAGPipeline
from brain import SenseiBrain
import config
from db import db, CURRICULUM
from analytics import analyze_batch, analyze_single_trade

# =========================
# DATA MODELS
# =========================
class DashboardInsightRequest(BaseModel):
    user_id: str

class UserState(BaseModel):
    current_chapter: str
    finished_chapters: List[str] = []

class ChatRequest(BaseModel):
    user_id: str
    query: str
    user_state: UserState

class TradePayload(BaseModel):
    user_id: str
    asset: str
    side: str
    entry_price: float
    exit_price: float
    volume: float
    open_time: float
    close_time: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class ChapterUpdate(BaseModel):
    user_id: str
    chapter_id: str

class CurriculumAskRequest(BaseModel):
    user_id: str
    current_chapter: str
    highlighted_text: str

class TradeOpenPayload(BaseModel):
    user_id: str
    asset: str
    side: str
    volume: float

# =========================
# GLOBAL MODELS
# =========================

ml_models: Dict[str, Any] = {}

# =========================
# LIFESPAN
# =========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing application services...")

    ml_models["synthesizer"] = QuerySynthesizer()
    ml_models["rag"] = RAGPipeline()
    ml_models["brain"] = SenseiBrain()

    logger.info("All models loaded successfully.")
    yield

    ml_models.clear()
    logger.info("Application shutdown complete.")

# =========================
# APP INIT
# =========================

app = FastAPI(title="Trading Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# STREAMING CHAT
# =========================

async def stream_chat_response(
    response_text: str,
    context_data: Optional[Any], # Changed type hint to Any to cover List/Dict
    sources: List[str],
    latency_ms: float
):
    words = response_text.split(" ")

    for i, word in enumerate(words):
        chunk = {"text": word + (" " if i < len(words) - 1 else "")}
        yield f"data: {json.dumps(chunk)}\n\n"
        await asyncio.sleep(0.02)

    # --- FIX START: ROBUST VERIFICATION LOGIC ---
    is_rag_verified = False
    
    # Check if context_data exists
    if context_data:
        # Case 1: It's a list (Standard RAG return)
        if isinstance(context_data, list) and len(context_data) > 0:
            first_hit = context_data[0]
            # Check for 'text' or 'content' keys and length
            content = first_hit.get('text') or first_hit.get('content') or ""
            if len(str(content)) > 50:
                is_rag_verified = True
                
        # Case 2: It's a dictionary (Single doc return)
        elif isinstance(context_data, dict):
            content = context_data.get('text') or context_data.get('content') or ""
            if len(str(content)) > 50:
                is_rag_verified = True

    final_payload = {
        "context": context_data,
        "is_rag_verified": is_rag_verified,
        "sources": sources,
        "latency_ms": round(latency_ms, 2),
        "done": True
    }

    yield f"data: {json.dumps(final_payload)}\n\n"
    yield "data: [DONE]\n\n"


# =========================
# ENDPOINTS
# =========================

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()

    db.sync_learning_state(request.user_id, {
        "current_chapter": request.user_state.current_chapter
    })

    raw_trades = db.get_user_trades(request.user_id)
    real_metrics = analyze_batch(raw_trades)

    context_data = ml_models["rag"].search(request.query, tags=None)
    
    # --- PRINT CONTEXT ---
    print("\n" + "="*20 + " RAG CONTEXT " + "="*20)
    print(json.dumps(context_data, indent=2, default=str))

    user_profile = db.get_user_profile(request.user_id)

    brain_state = {
        "learning_progress": user_profile.get("learning", {}),
        "trade_metrics": real_metrics
    }

    # --- PRINT BRAIN STATE ---
    print("\n" + "="*20 + " BRAIN STATE " + "="*20)
    print(json.dumps(brain_state, indent=2, default=str))

    response_text = ml_models["brain"].generate_response(
        user_id=request.user_id,
        user_query=request.query,
        rag_context=context_data,
        user_state=brain_state
    )

    clean_query = request.query.lower().strip()
    is_highlight = "explain this" in clean_query or "explain:" in clean_query

    print(f"\n[DEBUG] Query: {request.query}")
    print(f"[DEBUG] Detected Highlight Mode: {is_highlight}\n")

    # --- PRINT RESPONSE TEXT ---
    # Note: If this prints "<generator object ...>", see the "Streaming" note below.
    print("\n" + "="*20 + " RESPONSE " + "="*20)
    print(response_text)
    print("="*60 + "\n")

    latency = (time.time() - start_time) * 1000

    return StreamingResponse(
        stream_chat_response(response_text, context_data, ["Direct Search"], latency),
        media_type="text/event-stream"
    )

# -------------------------

@app.get("/dashboard/{user_id}")
async def get_dashboard_data(user_id: str):
    user_profile = db.get_user_profile(user_id)
    raw_trades = db.get_user_trades(user_id)
    performance_metrics = analyze_batch(raw_trades)

    return {
        "user_info": {
            "username": user_profile.get("username", "Trader"),
            "balance": user_profile.get("balance", 0),
        },
        "ai_insight": user_profile.get(
            "dashboard_insight",
            "Complete a lesson or close a trade to receive your briefing."
        ),
        "competency_radar": user_profile.get("competency", {}),
        "performance_summary": performance_metrics,
        "recent_history": raw_trades,
        "recommended_study": user_profile.get("recommended_study", {})
    }

# -------------------------

@app.post("/trade/close")
async def record_closed_trade(trade: TradePayload):

    trade_dict = trade.model_dump()
    user_id = trade_dict.pop("user_id")
    trade_dict["trade_id"] = str(uuid.uuid4())[:8]

    # Calculate PnL
    delta = trade_dict["exit_price"] - trade_dict["entry_price"]
    if trade_dict["side"].lower() == "sell":
        delta = -delta
    trade_dict["profit_and_loss"] = delta * trade_dict["volume"]

    # Save to DB
    db.add_trade(user_id, trade_dict)
    
    # Update Analytics
    all_trades = db.get_user_trades(user_id)
    fresh_metrics = analyze_batch(all_trades)
    db.update_performance(user_id, fresh_metrics)
    
    # Analyze THIS specific trade
    single_analysis = analyze_single_trade(trade_dict)

    # 1. Generate Synthetic Query & Search RAG (Keep this)
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="trade_close",
        data=single_analysis
    )
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)

    # 2. Get Recommendations FIRST (Move this up)
    valid_chapters = db.get_curriculum_list()
    recommendation = ml_models["brain"].recommend_next_module(
        trade_analysis=single_analysis,
        curriculum_list=valid_chapters
    )
    
    # 3. NEW: Generate the Insight using the Recommendations + RAG
    summary = ml_models["brain"].generate_post_trade_insight(
        trade_analysis=single_analysis,
        recommendations=recommendation,
        rag_context=rag_context
    )

    # 4. Save Updates
    db.update_recommendation(user_id, recommendation)
    db.update_dashboard_insight(user_id, summary)

    return {
        "status": "success",
        "trade_id": trade_dict["trade_id"],
        "analysis": single_analysis,
        "insight": summary,          # Now returning the fresh insight
        "recommendation": recommendation
    }

# -------------------------

@app.post("/trade/open")
async def open_trade_feedback(payload: TradeOpenPayload):

    history = db.get_user_trades(payload.user_id)
    last_trade_time = history[-1]["close_time"] if history else 0
    time_diff = int(time.time() - last_trade_time)

    proposed_trade = {
        "asset": payload.asset,
        "side": payload.side,
        "volume": payload.volume,
        "time_since_last": time_diff
    }

    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="trade_open",
        data={"asset": payload.asset, "side": payload.side}
    )

    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)

    feedback = ml_models["brain"].analyze_pre_trade_risk(
        user_history=history,
        proposed_trade=proposed_trade,
        rag_context=rag_context
    )

    return {
        "status": "success",
        "ai_overlay_message": feedback
    }

# -------------------------

@app.post("/curriculum/complete")
async def complete_chapter(payload: ChapterUpdate):

    db.mark_chapter_complete(payload.user_id, payload.chapter_id)

    raw_trades = db.get_user_trades(payload.user_id)
    metrics = analyze_batch(raw_trades)

    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="module_complete",
        data={"chapter": payload.chapter_id}
    )

    user_profile = db.get_user_profile(payload.user_id)

    return {
        "status": "success",
        "new_competency": user_profile.get("competency", {}),
        "finished_chapters": user_profile["learning"].get("finished_chapters", [])
    }

# -------------------------

@app.post("/curriculum/ask")
async def ask_curriculum_concept(request: CurriculumAskRequest):

    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="concept_highlight",
        data={
            "highlighted_text": request.highlighted_text,
            "current_chapter": request.current_chapter
        }
    )

    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)

    explanation = ml_models["brain"].explain_learning_concept(
        text_highlight=request.highlighted_text,
        rag_context=rag_context,
        current_chapter=request.current_chapter
    )

    return {
        "status": "success",
        "explanation": explanation,
        "related_context": rag_context
    }

@app.get("/curriculum/status/{user_id}")
async def get_curriculum_status(user_id: str):
    """
    Called by Frontend on load. 
    Returns the list of finished chapters so the UI can verify progress.
    """
    # 1. Get the list from DB
    finished_list = db.get_finished_chapters(user_id)
    
    # 2. Return clear JSON
    return {
        "status": "success",
        "user_id": user_id,
        "finished_count": len(finished_list),
        "finished_chapters": finished_list
    }

@app.post("/dashboard/insight")
async def generate_dashboard_insight(request: DashboardInsightRequest):
    """
    On-Demand Dashboard Analysis.
    Now handles the 'Brand New User' state gracefully.
    """
    user_id = request.user_id
    
    # 1. Gather Data
    user_profile = db.get_user_profile(user_id)
    raw_trades = db.get_user_trades(user_id)
    metrics = analyze_batch(raw_trades) 

    # Key Lists
    raw_recs = user_profile.get("recommended_study", [])
    # Safe List Extraction
    if isinstance(raw_recs, dict): recommended_list = [raw_recs] if raw_recs else []
    elif isinstance(raw_recs, list): recommended_list = raw_recs
    else: recommended_list = []

    finished_chapters = user_profile.get("learning", {}).get("finished_chapters", [])
    
    # --- NEW: ZERO STATE DETECTION -----------------------------------------
    # If user has 0 trades AND has finished 0 chapters, they are NEW.
    # We shouldn't analyze their "gaps" yet.
    
    gap_summary = ""
    primary_focus_module = None
    
    is_brand_new = (len(raw_trades) == 0) and (len(finished_chapters) == 0)

    if is_brand_new:
        gap_summary = "User is brand new. Status: ONBOARDING. No trades or lessons yet."
        primary_focus_module = "Goals and objectives" # The starting point
        
        # Override the "Recent Event" to force a Welcome message
        recent_event_desc = "User has just joined and opened the dashboard for the first time."
        
    else:
        # --- STANDARD ANALYSIS (For active users) ---
        gap_analysis_notes = []
        
        if recommended_list:
            top_rec = recommended_list[0] 
            module_name = top_rec.get("module") 
            reason = top_rec.get("reason")
            
            if module_name in finished_chapters:
                gap_type = "DISCIPLINE GAP"
                insight_msg = f"User has completed '{module_name}' but is failing to apply it ({reason})."
            else:
                gap_type = "KNOWLEDGE GAP"
                insight_msg = f"User needs to study '{module_name}' to fix recent errors ({reason})."
            
            gap_analysis_notes.append(f"[{gap_type}] {insight_msg}")
            primary_focus_module = module_name
        else:
            gap_analysis_notes.append("Execution matches knowledge level. No critical warnings.")

        gap_summary = " ".join(gap_analysis_notes)
        recent_event_desc = f"User dashboard refresh. {gap_summary}"
    
    # -----------------------------------------------------------------------

    # 3. Generate "Holistic" Synthetic Query
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="dashboard_refresh", 
        data={
            "focus_topic": primary_focus_module if primary_focus_module else "trading psychology",
            "gap_analysis": gap_summary,
            "metrics": metrics
        }
    )

    # 4. RAG Search
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=2)

    # 5. Generate The Summary
    summary = ml_models["brain"].generate_dashboard_summary(
        user_stats=metrics,
        rag_context=rag_context,
        recent_event_desc=recent_event_desc, # Uses the "Welcome" context if new
        competency_snapshot=user_profile.get("competency", {}),
        gap_analysis=gap_summary
    )

    # 6. Save and Return
    db.update_dashboard_insight(user_id, summary)
    
    return {
        "status": "success",
        "insight": summary,
        "gap_analysis": gap_summary,
        "focused_module": primary_focus_module
    }

# =========================
# ENTRY
# =========================

if __name__ == "__main__":
    uvicorn.run("server_main:app", host="0.0.0.0", port=8000, reload=True)
