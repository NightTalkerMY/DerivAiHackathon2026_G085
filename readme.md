# The Adaptive Trading Dojo - AI Trading Mentor Backend

![Python](https://img.shields.io/badge/Python-3.10.11-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?style=flat&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/AI_Brain-Gemini_2.5_Flash_Lite-4285F4?style=flat&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/AI_Router-Groq_OSS_120B-f55036?style=flat)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-cc2b5e?style=flat)
![RAG](https://img.shields.io/badge/Architecture-Hybrid_RAG-orange?style=flat)

**The Adaptive Trading Dojo** is an intelligent, persona-driven backend for an AI trading mentor. Unlike standard chatbots, this system features a **Semantic Routing architecture** that differentiates between casual chitchat, off-topic queries, and deep technical questions requiring **Retrieval-Augmented Generation (RAG)**.

It is built with **FastAPI** and uses a **Hybrid Brain** approach:
* **The Router:** Groq (Llama 3 70B) for high-speed intent classification.
* **The Brain:** Google Gemini 2.0 Flash Lite for persona-driven response generation.
* **The Memory:** ChromaDB + Cross-Encoders for high-precision RAG.

---

## Key Features

* **Resilient API Client:** Automatically rotates between multiple Gemini API keys (`DEFAULT`, `HACK1`, `HACK2`, `HACK3`) to ensure 100% uptime during demos and bypass rate limits.
* **Semantic Routing:** Intelligent intent detection using Groq. Queries like "How to make pizza" are instantly rejected, saving RAG resources for valid trading questions.
* **Hybrid RAG Engine:** Fetches documents via Vector Search (ChromaDB) and re-ranks them using a Cross-Encoder for maximum accuracy.
* **Dynamic Persona:** The "Sensei" adapts his tone based on the user's **Win Rate** and **Chapter Progress** (Strict for struggling students, encouraging for winners).
* **Persistent State:** User progress is synced to a local JSON database (`users_db.json`), preventing frontend spoofing and maintaining context across restarts.

---

## Project Structure

```bash
root/
├── client_test.py         # Script to simulate frontend requests (Run this from root)
├── requirements.txt       # Python dependencies
├── venv/                  # Virtual Environment
└── server/                # Main Backend Source Code
    ├── server_main.py     # FastAPI Entry Point (Run this file)
    ├── brain.py           # The Sensei Persona & Logic Orchestrator
    ├── rag.py             # RAG Engine (ChromaDB + Cross-Encoder)
    ├── router.py          # Semantic Router (Groq)
    ├── gemini_client.py   # Resilient Client with Key Rotation
    ├── config.py          # Configuration Loader
    ├── chat_sessions.json # Conversation History
    ├── .env               # API Keys (Located inside server folder)
    ├── datasets/          # Raw knowledge base and tags
    │   ├── glossary_tags.json
    │   ├── knowledge_base_clean.json
    │   └── knowledge_base_tagged.json
    ├── rag_db/            # ChromaDB Vector Store
    └── document_db/       #
        └── users_db.json  # "Source of Truth" for User State

```

---

## Installation & Setup

### 1. Prerequisites

* **Python 3.10.11** is strictly recommended to avoid dependency conflicts with `chromadb` or `onnx`.

### 2. Environment Setup

Clone the repository and navigate to the project folder.

```bash
# 1. Create a virtual environment
python -m venv venv

# 2. Activate the environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Upgrade pip (CRITICAL STEP for ChromaDB)
python.exe -m pip install --upgrade pip

# 4. Install Dependencies
pip install -r requirements.txt

```

### 3. Configure API Keys

Create a `.env` file inside the **`server/`** folder. You will need keys for **Google AI Studio** (Gemini) and **Groq** (Llama 3).

**File Location:** `server/.env`

```ini
# --- THE BRAIN (Google Gemini 2.0 Flash Lite) ---
# Main key for the chatbot
DEFAULT=your_google_api_key_here

# Backup keys for rotation (can use different accounts to extend rate limits)
HACK1=your_backup_key_1
HACK2=your_backup_key_2
HACK3=your_backup_key_3

# --- THE ROUTER (Groq / Llama 3 70B) ---
# Used for fast semantic classification
ROUTER=your_groq_api_key_here

```

---

## Usage

### 1. Start the Server

You must navigate into the `server` folder before running the app because `server_main.py` and `.env` are located there.

```bash
# 1. Enter the server directory
cd server

# 2. Run the application (Note the filename is server_main)
uvicorn server_main:app --reload

```

*You will see the "System Startup" logs initializing the Semantic Router and RAG Engine.*

### 2. Test the API

Open a **new terminal**, keep it in the **root** folder (don't `cd server`), and run the test script.

```bash
# Run from the root directory
python client_test.py

```

---

## API Contract (For Frontend Integration)

**Endpoint:** `POST /chat`
**Headers:** `Content-Type: application/json`

### Request Payload

The frontend **must** send the current user state with every request.

```json
{
  "user_id": "william",
  "query": "I keep losing money on gold. What should I do?",
  "user_state": {
    "current_chapter": "1. Psychology",
    "finished_chapters": ["Introduction"],
    "unfinished_chapters": ["Risk Management"],
    "win_rate": "40%"
  }
}

```

### Response Payload

```json
{
  "answer": "Stop trading immediately! Your win rate is 40%...", 
  "sources": ["risk management", "psychology"],
  "context": {
      "text": "The 2% rule states...",
      "metadata": { "chapter": "1" },
      "score": 0.85
  },
  "latency_ms": 1250
}

```

---

## Troubleshooting

* **`ImportError: DLL load failed`**: This usually happens if you didn't upgrade pip before installing requirements. Run `python -m pip install --upgrade pip` and try re-installing.
* **Server crashes on reload:** Heavy AI models (Chroma/Transformers) take time to load. If you edit a file, the auto-reload might hiccup. Just `Ctrl+C` and restart `uvicorn`.
* **"User not found" Error:** The backend enforces security. Ensure the `user_id` you are sending exists in `server/document_db/users_db.json`.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

```

```
