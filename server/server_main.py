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
import time
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Internal modules
from router import SemanticRouter
from rag import RAGPipeline
from brain import SenseiBrain
import config

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
    unfinished_chapters: List[str] = Field(default=[], json_schema_extra={"example": ["3. Technical Analysis"]})
    win_rate: str = Field(..., json_schema_extra={"example": "42%"})

class ChatRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "user_123"})
    query: str = Field(..., json_schema_extra={"example": "I keep losing money on gold trades."})
    user_state: UserState

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    context: Optional[Dict[str, Any]] = None 
    latency_ms: float = 0.0

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

        # 1. Load User Database
        print("   1. Loading User Database...", end=" ", flush=True)
        if os.path.exists(config.USERS_DB_PATH):
            with open(config.USERS_DB_PATH, "r", encoding="utf-8") as f:
                global users_db
                users_db = json.load(f)
            print(f"Done ({len(users_db)} users loaded)")
        else:
            print(f"Warning: {config.USERS_DB_PATH} not found. No users can log in.")
            users_db = {}

        # 2. Initialize Router
        ml_models["router"] = SemanticRouter()
        logger.info("Semantic Router initialized successfully.")
        
        # 3. Initialize RAG Engine
        ml_models["rag"] = RAGPipeline()
        logger.info("RAG Engine (ChromaDB + Cross-Encoder) initialized successfully.")
        
        # 4. Initialize Brain
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

#  ENDPOINTS 
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()
    
    # 1. VALIDATION: Check if user exists
    if request.user_id not in users_db:
        logger.warning(f"Unauthorized access attempt: {request.user_id}")
        raise HTTPException(
            status_code=403, 
            detail=f"User '{request.user_id}' not registered in Sensei DB."
        )

    print(f"📩 [{request.user_id}] Query: {request.query}")
    
    try:
        # 2. STATE UPDATE (New Feature!)
        # We compare the incoming payload with our DB. If it's newer/different, we update our DB.
        # This allows the Frontend to say "I finished a chapter!" and the Backend remembers it.
        
        current_db_profile = users_db[request.user_id]
        incoming_state = request.user_state
        
        # Check if we need to update the DB (Basic check)
        # In a real app, you'd have more complex logic here, but for Hackathon, trust the frontend.
        users_db[request.user_id] = {
            "current_chapter": incoming_state.current_chapter,
            "finished_chapters": incoming_state.finished_chapters,
            "unfinished_chapters": incoming_state.unfinished_chapters,
            "win_rate": incoming_state.win_rate
        }
        
        # Save to JSON file immediately so it persists
        with open(config.USERS_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(users_db, f, indent=2)
            
        # Use this NEW updated profile for the Brain
        real_profile = users_db[request.user_id]

        # 3. ROUTING & RAG
        router = ml_models["router"]
        rag = ml_models["rag"]
        brain = ml_models["brain"]

        tags = router.get_relevant_tags(request.query)
        context_data = rag.search(request.query, tags=tags)
        
        # 4. GENERATION
        state_dict = {
            "learning_progress": {
                "current_chapter": real_profile["current_chapter"],
                "finished_chapters": real_profile["finished_chapters"],
                "unfinished_chapters": real_profile["unfinished_chapters"]
            },
            "trade_metrics": {
                "win_rate": real_profile["win_rate"]
            }
        }
        
        response_text = brain.generate_response(
            user_id=request.user_id,
            user_query=request.query,
            rag_context=context_data,
            user_state=state_dict
        )
        
        latency = (time.time() - start_time) * 1000
        
        return ChatResponse(
            answer=response_text,
            sources=tags if tags else ["General Logic"],
            latency_ms=round(latency, 2),
            context=context_data
        )

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health")
async def health_check():
    return {"status": "operational", "timestamp": time.time()}

#  ENTRY POINT 
if __name__ == "__main__":
    uvicorn.run("server_main:app", host="0.0.0.0", port=8000, reload=True)