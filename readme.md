# The Adaptive Trading Dojo (V2)

![Gemini](https://img.shields.io/badge/AI_Core-Gemini_2.5_Flash-4285F4?style=flat&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Synthesizer-GPT_OSS_120B-f55036?style=flat&logo=groq&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)

![FastAPI](https://img.shields.io/badge/FastAPI-Event_Driven-009688?style=flat&logo=fastapi&logoColor=white)
![ChromaDB](https://img.shields.io/badge/Vector_DB-ChromaDB-cc2b5e?style=flat&logo=chroma&logoColor=white)
![Pydantic](https://img.shields.io/badge/Data_Validation-Pydantic-e92063?style=flat&logo=pydantic&logoColor=white)

![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build_Tool-Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat&logo=tailwindcss&logoColor=white)

**The Adaptive Trading Dojo** is a full-stack AI education platform designed to bridge the gap between *theory* and *execution*.

Unlike standard chatbots, the Dojo features a **Proactive "Sensei" Persona** that watches your live trading performance. If you break your rules (e.g., trading without a stop-loss), the AI immediately intervenes with a "Scolding" and dynamically updates your learning curriculum.

---

## 🎥 See it in Action

<video src="https://github.com/user-attachments/assets/e0524a43-3538-420b-b066-c46d84d6c3b8" controls="controls" style="max-width: 100%;">
</video>

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