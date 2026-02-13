import os
import logging

# SILENCE THE NOISE
# Disable HuggingFace token warnings
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3" # Silence TensorFlow/Keras

# Configure global logging first
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)

# Mute specific noisy libraries
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
logging.getLogger("chromadb").setLevel(logging.ERROR)

import uvicorn
import uuid
import time
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Internal modules
from synthesizer import QuerySynthesizer
from rag import RAGPipeline
from brain import SenseiBrain
import config
from db import db
from analytics import analyze_batch, analyze_single_trade

#  LOGGING SETUP 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

#  DATA MODELS 
class UserState(BaseModel):
    current_chapter: str = Field(..., json_schema_extra={"example": "2. Risk Management"})
    finished_chapters: List[str] = Field(default=[], json_schema_extra={"example": ["1. Psychology"]})

class ChatRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "user_123"})
    query: str = Field(..., json_schema_extra={"example": "I keep losing money on gold trades."})
    user_state: UserState

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    context: Optional[Dict[str, Any]] = None 
    latency_ms: float = 0.0

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
    chapter_id: str = Field(..., example="Chapter 4: Goals and objectives")

class CurriculumAskRequest(BaseModel):
    user_id: str
    current_chapter: str
    highlighted_text: str = Field(..., example="What is a trailing stop?")

class TradeOpenPayload(BaseModel):
    user_id: str
    asset: str
    side: str # "buy" or "sell"

#  GLOBAL STATE 
ml_models = {}

#  LIFESPAN MANAGER 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the startup and shutdown logic for the application.
    Initializes heavy ML models once to ensure performance.
    """
    logger.info("Initializing application services...")
    
    try:

        # Load User Database
        print("   1. Loading User Database...", end=" ", flush=True)
        if os.path.exists(config.USER_DB):
            with open(config.USER_DB, "r", encoding="utf-8") as f:
                global users_db
                users_db = json.load(f)
            print(f"Done ({len(users_db)} users loaded)")
        else:
            print(f"Warning: {config.USER_DB} not found. No users can log in.")
            users_db = {}

        # Initialize Synthesizer
        ml_models["synthesizer"] = QuerySynthesizer() 
        logger.info("Query Synthesizer initialized successfully.")
        
        # Initialize RAG Engine
        ml_models["rag"] = RAGPipeline()
        logger.info("RAG Engine (ChromaDB + Cross-Encoder) initialized successfully.")
        
        # Initialize Brain
        ml_models["brain"] = SenseiBrain()
        logger.info("LLM Brain initialized successfully.")
        
        logger.info("System is ready to accept requests.")
        yield
        
    except Exception as e:
        logger.critical(f"Critical failure during startup: {e}")
        raise e
    finally:
        # Shutdown logic
        ml_models.clear()
        logger.info("Application shutdown complete.")

#  APP INITIALIZATION 
app = FastAPI(title="Trading Assistant API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"  # Allows all origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  ENDPOINTS 
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()
    
    # 1. SYNC LEARNING
    db.sync_learning_state(request.user_id, {
        "current_chapter": request.user_state.current_chapter,
    })

    # 2. GET REAL STATS
    raw_trades = db.get_user_trades(request.user_id)
    real_metrics = analyze_batch(raw_trades) 
    
    # 3. RETRIEVE CONTEXT (RAG)
    # CHANGED: No more router/tags. Direct search.
    # We pass tags=None to rag.search (assuming your RAG code handles None)
    context_data = ml_models["rag"].search(request.query, tags=None)
    
    # 4. GENERATE RESPONSE
    user_profile = db.get_user_profile(request.user_id)
    
    brain_state = {
        "learning_progress": user_profile.get("learning", {}),
        "trade_metrics": real_metrics 
    }

    response_text = ml_models["brain"].generate_response(
        user_id=request.user_id,
        user_query=request.query,
        rag_context=context_data,
        user_state=brain_state
    )
    
    latency = (time.time() - start_time) * 1000
    
    return ChatResponse(
        answer=response_text,
        sources=["Direct Search"], # Generic source label
        latency_ms=round(latency, 2),
        context=context_data
    )

@app.get("/health")
async def health_check():
    return {"status": "operational", "timestamp": time.time()}

@app.get("/dashboard/{user_id}")
async def get_dashboard_data(user_id: str):
    # Get Theory Data (Radar Chart)
    # This comes from db.py looking at "finished_chapters"
    user_profile = db.get_user_profile(user_id)
    
    # Get Practice Data (Performance Card)
    # This comes from trades.json -> analytics.py
    raw_trades = db.get_user_trades(user_id)
    performance_metrics = analyze_batch(raw_trades)
    
    # Combine for Frontend
    return {
        "user_info": {
            "username": user_profile.get("username", "Trader"),
            "balance": user_profile.get("balance", 0),
        },
        "ai_insight": user_profile.get("dashboard_insight", "Welcome back. When you complete a lesson or close a trade, I will prepare your Daily Briefing."),
        "competency_radar": user_profile.get("competency", {}), # Foundations, Risk, etc.
        "performance_summary": performance_metrics,             # Win Rate, PnL, etc.
        "recent_history": raw_trades,                            # For the list view
        "recommended_study": user_profile.get("recommended_study", {})
    }

@app.post("/trade/close")
async def record_closed_trade(trade: TradePayload):
    """
    1. Generates ID.
    2. Saves to DB.
    3. Returns Single Analysis for immediate "Sensei" feedback.
    """
    
    # Convert to Dict
    trade_dict = trade.model_dump()
    user_id = trade_dict.pop("user_id")
    
    # Generate Unique Trade ID (Critical for Single Analysis)
    trade_dict["trade_id"] = str(uuid.uuid4())[:8] # Short 8-char ID
    
    # Save to DB
    db.add_trade(user_id, trade_dict)

    # Fetch all trades (including the new one)
    all_trades = db.get_user_trades(user_id)
    
    # Calculate fresh stats
    fresh_metrics = analyze_batch(all_trades)
    
    # Save to DB (This fixes your issue!)
    db.update_performance(user_id, fresh_metrics)
    
    # Run Single Analysis IMMEDIATELY
    # This prepares the data for the frontend to show the "After-Action Review"
    single_analysis = analyze_single_trade(trade_dict)


    # Generate Synthetic Query (Small LLM)
    # We pass the single trade outcome so the query is specific
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="trade_close",
        data=single_analysis
    )
    
    # Retrieve Education (RAG)
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)
    
    # Generate Dashboard Summary (Brain)
    # Describe the event for the Brain
    event_desc = f"User closed a trade. Outcome: {single_analysis['trade outcome']}. PnL: {single_analysis['profit and loss']}."
    
    summary = ml_models["brain"].generate_dashboard_summary(
        user_stats=fresh_metrics,
        rag_context=rag_context,
        recent_event_desc=event_desc
    )
    
    # Save to DB
    db.update_dashboard_insight(user_id, summary)

    # Get valid chapters to force the Brain to pick a real one
    valid_chapters = db.get_curriculum_list()
    
    # Ask Brain to pick one
    recommendation = ml_models["brain"].recommend_next_module(
        trade_analysis=single_analysis,
        curriculum_list=valid_chapters
    )
    
    # Save to DB
    db.update_recommendation(user_id, recommendation)    

    return {
        "status": "success", 
        "trade_id": trade_dict["trade_id"],
        "analysis": single_analysis,
        "dashboard_updated": True,
        "insight": summary,
        "recommendation": recommendation 
        }

@app.post("/trade/open")
async def open_trade_feedback(payload: TradeOpenPayload):
    """
    LiveTrade: Open Position Event.
    Triggers 'Pre-Flight Check' overlay.
    """
    # Synthesize Query (e.g. "Trading rules for XAUUSD")
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="trade_open",
        data={"asset": payload.asset, "side": payload.side}
    )
    
    # RAG Search
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)
    
    # Brain Analysis (Co-Pilot)
    feedback = ml_models["brain"].analyze_trade_entry(
        asset=payload.asset,
        side=payload.side,
        rag_context=rag_context
    )
    
    return {
        "status": "success",
        "query": synthetic_query,
        "ai_overlay_message": feedback 
    }


@app.post("/curriculum/complete")
async def complete_chapter(payload: ChapterUpdate):
    """
    The 'Level Up' Endpoint.
    1. Marks a chapter as finished.
    2. Recalculates the specific Competency Axis (e.g. Foundations).
    3. Returns the new Radar Chart data for the frontend to animate.
    """
    # Update DB (This marks it done AND recalculates the score in db.py)
    success = db.mark_chapter_complete(payload.user_id, payload.chapter_id)
    
    if not success:
        # This usually means user doesn't exist or chapter already done
        pass

    # Synthetic Query
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="module_complete",
        data={"chapter": payload.chapter_id}
    )
    
    # RAG
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)
    
    # Brain
    # Get current stats for context
    raw_trades = db.get_user_trades(payload.user_id)
    metrics = analyze_batch(raw_trades)
    
    summary = ml_models["brain"].generate_dashboard_summary(
        user_stats=metrics,
        rag_context=rag_context,
        recent_event_desc=f"User completed chapter: {payload.chapter_id}"
    )
    
    # Save
    db.update_dashboard_insight(payload.user_id, summary)

    # Fetch the fresh profile with the new scores
    user_profile = db.get_user_profile(payload.user_id)
    
    return {
        "status": "success",
        "message": f"Chapter '{payload.chapter_id}' marked as complete.",
        "new_competency": user_profile.get("competency", {}),
        "finished_chapters": user_profile["learning"].get("finished_chapters", [])
    }

@app.post("/curriculum/ask")
async def ask_curriculum_concept(request: CurriculumAskRequest):
    """
    "Ask AI" Feature.
    Triggered when user highlights text in the curriculum.
    Returns a specific explanation for that concept.
    """
    # Synthesize Query (Clean up the highlight)
    synthetic_query = ml_models["synthesizer"].generate_synthetic_query(
        event_type="concept_highlight",
        data={
            "highlighted_text": request.highlighted_text,
            "current_chapter": request.current_chapter
        }
    )
    
    # RAG Search
    rag_context = ml_models["rag"].search(synthetic_query, top_k_retrieval=1)
    
    # Brain Explanation
    explanation = ml_models["brain"].explain_learning_concept(
        text_highlight=request.highlighted_text,
        rag_context=rag_context,
        current_chapter=request.current_chapter
    )
    
    return {
        "status": "success",
        "query_generated": synthetic_query,
        "explanation": explanation,
        "related_context": rag_context
    }




#  ENTRY POINT 
if __name__ == "__main__":
    uvicorn.run("server_main:app", host="0.0.0.0", port=8000, reload=True)