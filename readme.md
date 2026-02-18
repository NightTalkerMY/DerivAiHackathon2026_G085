# The Adaptive Trading Dojo (V2)

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/AI_Core-Gemini_2.0-4285F4?style=flat&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Synthesizer-GPT_OSS_120B-f55036?style=flat)

**The Adaptive Trading Dojo** is a full-stack AI education platform designed to bridge the gap between *theory* and *execution*.

Unlike standard chatbots, the Dojo features a **Proactive "Sensei" Persona** that watches your live trading performance. If you break your rules (e.g., trading without a stop-loss), the AI immediately intervenes with a "Scolding" and dynamically updates your learning curriculum.

---

## 🚀 Quick Start Guide

To run the full system, you need to open **two separate terminals**.

### Terminal 1: The Brain (Backend)
This runs the API, the Event Loop, and the Vector Database.

```bash
cd server
# Windows
.\venv\Scripts\activate
# Install dependencies (if not already done)
pip install -r ../requirements.txt

# Start the Server
uvicorn server_main:app --reload

```

*Server running at: `http://localhost:8000*`

### Terminal 2: The Interface (Frontend)

This runs the React Dashboard and Trading Terminal.

```bash
cd frontend
# Install dependencies (first time only)
npm install

# Start the UI
npm run dev

```

*Client running at: `http://localhost:5173*`

---

## 🏗️ System Architecture

The application is a **Monorepo** split into two distinct domains:

### 1. [Frontend Client](https://github.com/NightTalkerMY/DerivAiHackathon2026_G085/blob/main_v2/frontend/readme.md)

A React + Vite application that handles the real-time Dashboard, Trading Terminal, and Chat Interface.

* **Key Tech:** React 18, Tailwind CSS, Recharts (Visualization).
* **Highlights:** `ShifuChat` (AI Overlay), `CompetencyRadar` (Skill Tracking).

### 2. [Backend Server](https://github.com/NightTalkerMY/DerivAiHackathon2026_G085/blob/main_v2/server/readme.md)

A FastAPI event engine that manages the AI logic and user state.

* **Key Tech:** Python 3.10, ChromaDB (RAG), Google Gemini (Reasoning).
* **Highlights:** `synthesizer.py` (Event-to-Query translation), `brain.py` (Persona Logic).

---

*Created for the Deriv AI Hackathon 2026 by Team 085.*