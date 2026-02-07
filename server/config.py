import os
from dotenv import load_dotenv

load_dotenv()

#  API KEYS 
GROQ_API_KEY = os.getenv("ROUTER") # Used for Router only

# Google Gemini Keys (Rotation List)
GOOGLE_KEYS = [
    os.getenv("DEFAULT"),
    os.getenv("HACK1"),
    os.getenv("HACK2"),
    os.getenv("HACK3")
]

#  PATHS 
DB_PATH = "rag_db"
GLOSSARY_PATH = "datasets/glossary_tags.json"
COLLECTION_NAME = "trading_knowledge"
USERS_DB_PATH = "document_db/users_db.json"

#  MODELS 
ROUTER_LLM_MODEL_NAME = "openai/gpt-oss-120b" # Groq
GEMINI_MODEL_NAME = "gemini-2.5-flash-lite" # The Brain

# Embedding / Rerank
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

#  THRESHOLDS 
LOGIT_THRESHOLD = 0.0