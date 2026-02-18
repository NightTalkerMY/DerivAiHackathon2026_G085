
### File 2: The Backend README
**Location:** Create a new file at `backend_Hackathon/server/README.md`
*(This explains your Python code)*

```markdown
# Dojo Backend (The Brain)

The backend is not just a CRUD API; it is an **Event-Driven Intelligence System**. It uses a "Synthesizer" pattern to translate raw user actions (like losing a trade) into semantic search queries for the RAG engine.

## 📂 Project Structure

```bash
server/
├── database/           # JSON Persistence Layer
│   ├── users.json      # User state (Curriculum progress, XP)
│   └── trades.json     # Trade history log
├── rag_db/             # ChromaDB Vector Store (Knowledge Base)
├── analytics.py        # Math Engine (Win Rate, PnL, Risk Calculation)
├── brain.py            # "The Sensei" Logic (Gemini 2.5)
├── synthesizer.py      # Event Translator (GPT OSS 120B)
├── rag.py              # Retrieval Augmented Generation Engine
├── gemini_client.py    # Google AI Studio Client
└── server_main.py      # FastAPI Entry Point

```

## 🧠 The "Sensei" Loop

1. **Event Trigger:** Frontend sends a trade closure event (`/trade/close`).
2. **Synthesis:** `synthesizer.py` uses **GPT OSS 120B** (via Groq) to convert the JSON data (e.g., `-5% PnL`) into a natural language query: *"User is revenge trading after a loss."*
3. **Retrieval:** `rag.py` searches `chroma.sqlite3` for relevant psychology advice.
4. **Generation:** `brain.py` (Gemini) crafts a personalized response using the retrieved advice and the user's history.

## 🔑 Key Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/chat` | Direct conversation with the Sensei. |
| `POST` | `/trade/open` | **Pre-Flight Check:** AI warns of risks before execution. |
| `POST` | `/trade/close` | **Post-Trade Audit:** Triggers the analysis loop. |
| `GET` | `/dashboard/{id}` | Fetches calculated metrics and daily briefing. |

```

---