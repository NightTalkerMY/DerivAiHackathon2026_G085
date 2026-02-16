# The Adaptive Trading Dojo - AI Backend V2

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Event_Driven-009688?style=flat&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/AI_Brain-Gemini_2.5_Flash_Lite-4285F4?style=flat&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Synthesizer-GPT_OSS_120B-f55036?style=flat)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-cc2b5e?style=flat)

**The Adaptive Trading Dojo V2** is a proactive, event-driven backend for personalized trading education. It moves beyond standard chatbots by using a **Query Synthesizer** to automatically translate user actions (like losing a trade or highlighting text) into targeted educational retrieval.

The system features a **"Sensei" Persona** that adapts its coaching style based on real-time performance metrics (Win Rate, PnL, Discipline), creating a closed feedback loop between **Theory (Curriculum)** and **Practice (Live Trading)**.

---

## System Architecture

The backend operates on a **Proactive Event Loop**:

1.  **Event Trigger:** User performs an action (e.g., Closes a losing trade).
2.  **Synthesizer (Groq):** Translates raw event data (PnL -$50, No Stop Loss) into a specific search query (e.g., *"psychology of revenge trading"*).
3.  **RAG Engine:** Retrieves precise advice from the Vector Database.
4.  **The Brain (Gemini):** Analyzes the context and generates a personalized insight or "Scolding."
5.  **Persistence:** Updates the User Database to drive the Dashboard UI.

---

## Key Features

### 1. Intelligent Dashboard
* **Daily Briefing:** Instead of static charts, the AI writes a daily summary analyzing your recent performance and learning progress.
* **Competency Radar:** Tracks your "Book Smarts" based on completed modules.

### 2. LiveTrade Co-Pilot
* **Pre-Flight Check:** Before you enter a trade (`/trade/open`), the AI warns you about specific risks for that asset (e.g., "Gold is volatile during NY Open").
* **Post-Trade Audit:** When you close a trade (`/trade/close`), the AI immediately analyzes your discipline.
    * *Did you use a Stop Loss?*
    * *Did you stick to your plan?*
* **Instant Feedback:** Returns an immediate overlay message scolding or congratulating the user.

### 3. Adaptive Curriculum
* **Ask AI (Overlay):** Highlight any text in a module (`/curriculum/ask`) to get an instant, simplified explanation from the AI Tutor.
* **Smart Recommendations:** If you lose a trade due to poor risk management, the system **automatically recommends** the "Risk Management" chapter in the Curricular tab.

---

## Project Structure

```bash
root/
├── hooks/                  # Auxiliary scripts & metric tests
├── server/                 # Main Backend Source Code
│   ├── database/           # JSON storage (Auto-generated)
│   │   ├── users.json      # Source of Truth for User State
│   │   └── trades.json     # FIFO Trade History
│   ├── rag_db/             # ChromaDB Vector Store
│   ├── analytics.py        # Math engine (Win Rate, PnL, Risk Calc)
│   ├── brain.py            # "The Sensei" Persona & Logic Orchestrator
│   ├── config.py           # Configuration Loader
│   ├── db.py               # Database Manager (JSON Read/Write)
│   ├── gemini_client.py    # Resilient Client with Key Rotation
│   ├── rag.py              # RAG Engine (ChromaDB + Cross-Encoder)
│   ├── server_main.py      # FastAPI Entry Point
│   └── synthesizer.py      # Event-to-Query Engine (Replaces Router)
├── client_journey_test.py  # Full User Journey Simulation Script
├── client_test.py          # Basic Endpoint Test
├── requirements.txt        # Python Dependencies
└── .env                    # API Keys

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

We provide two test scripts to validate the system.

#### 1. Basic Sanity Check

**`client_test.py`**
Use this for quick unit testing. It hits every endpoint once to ensure the server is running and returning 200 OK status codes.

```bash
python client_test.py

```

#### 2. Full User Journey Simulation

**`client_journey_test.py`**
Use this to verify the entire logic flow. It simulates a "Day in the Life" of a user:

1. **Reads a Module:** Highlights text -> AI Explains.
2. **Opens a Trade:** Triggers Pre-Flight Check overlay.
3. **Loses a Trade:** Triggers Post-Trade Audit.
4. **Verification:** Checks if the **Dashboard** updated with a new "Scolding" message and if the **Curriculum** tab received a personalized Recommendation.

```bash
python client_journey_test.py

```

---

## API Reference

### 1. Dashboard & Profile

**`GET /dashboard/{user_id}`**
Returns the full state for the UI: Balance, Radar Chart, Daily Briefing (AI Insight), and Recommended Module.

### 2. Chat (The Sensei)

**`POST /chat`**
Standard conversational interface.

```json
{
  "user_id": "william",
  "query": "How do I size my position?",
  "user_state": { "current_chapter": "Risk Management" }
}

```

### 3. Curriculum Features

**`POST /curriculum/ask`** (Text Highlight Overlay)

```json
{
  "user_id": "william",
  "current_chapter": "Market Structure",
  "highlighted_text": "What is a liquidity sweep?"
}

```

**`POST /curriculum/complete`** (Finish Module)

```json
{ "user_id": "william", "chapter_id": "Trading Psychology" }

```

### 4. Live Trading

**`POST /trade/open`** (Pre-Flight Check)

```json
{ "user_id": "william", "asset": "BTCUSDT", "side": "buy" }

```

**`POST /trade/close`** (Post-Trade Analysis)
Triggers the Analysis -> Dashboard Update -> Recommendation pipeline.

```json
{
  "user_id": "william",
  "asset": "BTCUSDT",
  "side": "buy",
  "entry_price": 65000,
  "exit_price": 64000,
  "volume": 0.5,
  "open_time": 1700000000,
  "close_time": 1700000600,
  "stop_loss": null,
  "take_profit": 66000
}


```
---

## License
This project is licensed under the MIT License
