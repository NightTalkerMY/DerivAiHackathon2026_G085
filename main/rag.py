import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import CrossEncoder
import config
import os

# --- SILENCE WARNINGS ---
# Hide the "Not Authenticated" warning
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"

# Hide the "UNEXPECTED: position_ids" warnings (Transformers specific logging)
from transformers import logging as hf_logging
hf_logging.set_verbosity_error()  # Only show actual errors, not warnings

# Suppress standard Python warnings if they persist
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
# ------------------------

class RAGPipeline:
    def __init__(self):
        # 1. Setup Chroma
        self.chroma_client = chromadb.PersistentClient(path=config.DB_PATH)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=config.EMBEDDING_MODEL
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name=config.COLLECTION_NAME,
            embedding_function=self.embedding_fn
        )

        # 2. Setup Reranker (Cross-Encoder)
        # We load this once on startup because it's heavy
        print(f"Loading Reranker: {config.RERANKER_MODEL}...")
        self.reranker = CrossEncoder(config.RERANKER_MODEL)
        print("Reranker Ready.")

    def search(self, query: str, tags: list = None, top_k_retrieval=5) -> dict:
        """
        Orchestrates the Retrieval -> Reranking pipeline.
        Returns: Best document dict or None.
        """
        
        # --- A. RETRIEVAL (Vector Search) ---
        where_filter = None
        if tags:
            # If 1 tag, strict match. If multiple, match ANY in list ($in)
            if len(tags) == 1:
                where_filter = {"tags": tags[0]}
            else:
                where_filter = {"tags": {"$in": tags}}

        results = self.collection.query(
            query_texts=[query],
            n_results=top_k_retrieval,
            where=where_filter
        )

        raw_docs = results['documents'][0]
        raw_metas = results['metadatas'][0]

        if not raw_docs:
            return None

        # --- B. RERANKING (Cross-Encoder) ---
        # Pair up [Query, Document]
        pairs = [[query, doc] for doc in raw_docs]
        
        # Predict scores
        scores = self.reranker.predict(pairs)

        # Zip everything together
        candidates = []
        for i in range(len(scores)):
            candidates.append({
                "score": float(scores[i]),
                "text": raw_docs[i],
                "metadata": raw_metas[i]
            })

        # Sort descending
        candidates.sort(key=lambda x: x['score'], reverse=True)
        best_match = candidates[0]

        # --- C. THRESHOLD CHECK ---
        if best_match['score'] > config.LOGIT_THRESHOLD:
            return best_match
        
        return None