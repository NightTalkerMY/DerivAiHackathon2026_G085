# Dojo Backend (The Brain)

The backend is an **Event-Driven Intelligence System** built with **FastAPI**. It moves beyond standard CRUD operations by using a "Synthesizer" pattern to translate raw user data (JSON) into semantic narratives for the AI to analyze.

## 📂 Project Structure

```bash
server/
├── database/           # JSON Persistence Layer
│   ├── users.json      # User state (Curriculum progress, XP)
│   ├── trades.json     # Trade history log
│   └── null_users.json # Template for new user initialization
├── rag_db/             # ChromaDB Vector Store (Knowledge Base)
├── analytics.py        # Math Engine (Win Rate, PnL, Risk Calculation)
├── brain.py            # "The Sensei" Logic (Gemini 2.5)
├── chat_sessions.json  # Persistence for chat history context
├── config.py           # Environment & Configuration Loader
├── db.py               # Database Accessor Utility (CRUD)
├── gemini_client.py    # Google AI Studio Client
├── rag.py              # Retrieval Augmented Generation Engine
├── server_main.py      # FastAPI Entry Point & Event Loop
└── synthesizer.py      # Event Translator (GPT OSS 120B)

```

## 🧠 The "Sensei" Intelligence Loops

The backend orchestrates **three distinct AI loops** based on user activity:

### 1. The Audit Loop (Reactive)

*Triggered via `/trade/close*`
When a user closes a trade, the system doesn't just save it.

1. **Synthesis:** Converts math (`PnL: -$50`, `No Stop Loss`) into a story: *"User is revenge trading after a loss."*
2. **Gap Analysis:** The AI checks:
* *Did the user finish the Risk Management module?*
* **Yes?** -> It's a **Discipline Gap** (They know better).
* **No?** -> It's a **Knowledge Gap** (They need education).


3. **Intervention:** Updates the dashboard insight and recommends a specific module.

### 2. The Pre-Flight Loop (Proactive)

*Triggered via `/trade/open*`
Before a trade is executed, the AI performs a risk check.

1. **Context:** Checks time since last trade (to detect over-trading).
2. **Retrieval:** Fetches specific risks for the requested asset (e.g., "Gold volatility during NY Open").
3. **Warning:** Returns an immediate overlay message if risks are high.

### 3. The Onboarding Loop (Analytical)

*Triggered via `/dashboard/insight*`
Detects if a user is **Brand New** (0 trades, 0 lessons) vs. **Active**.

* **New Users:** Receives an onboarding roadmap focusing on "Goals and Objectives."
* **Active Users:** Receives a dynamic "Gap Analysis" summarizing their recent performance vs. education level.

## 🔑 API Reference

### Core & Streaming

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/chat` | **Streaming Response.** Context-aware chat that syncs with user's current learning chapter. |
| `GET` | `/dashboard/{id}` | Fetches full state: Radar Chart, Balance, and Daily Briefing. |
| `POST` | `/dashboard/insight` | **On-Demand Analysis.** Forces a re-evaluation of the user's "Knowledge vs. Discipline" gaps. |

### Trading Events

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/trade/open` | **Pre-Flight Check:** Analyzes risk before the order hits the book. |
| `POST` | `/trade/close` | **Post-Trade Audit:** Triggers the Synthesizer -> RAG -> Brain feedback loop. |

### Curriculum Interaction

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/curriculum/ask` | **AI Overlay:** Explains highlighted text using RAG context from the specific chapter. |
| `POST` | `/curriculum/complete` | Marks progress and updates the "Competency Radar" data. |

---

*Powered by Google Gemini 2.5 (Logic) and GPT OSS 120B (Synthesis).*