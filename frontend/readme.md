
# Dojo Frontend (The Interface)

The frontend is a modern **React + Vite** application built for speed and real-time feedback. It connects to the backend via REST APIs and WebSockets (simulated) to provide instant "Scolding" or "Praise" from the AI.

## 📂 Project Structure

```bash
frontend/src/
├── ai/                 # AI Specific Logic
│   └── aiTutor.js      # Helper for curriculum explanations
├── api/                # Backend Connectors
│   ├── trading.js      # Trade execution endpoints
│   └── dashboard.js    # State fetching
├── components/         # UI Widgets
│   ├── dashboard/      # Visualization Tools
│   │   ├── CompetencyRadar.jsx   # Skill chart
│   │   └── PerformanceSummary.jsx
│   ├── trading/        # Live Terminal
│   │   ├── TradeForm.jsx         # Buy/Sell Input
│   │   └── TradeTicker.jsx       # Price streaming
│   └── layout/         # Core Shell
│       └── ShifuChat.jsx         # The "Sensei" floating chat
├── hooks/              # Custom React Hooks
│   ├── useLiveTrade.js # Manages active trade state
│   └── useTradeWebSocket.js # Simulates live price updates
└── pages/              # Main Route Views
    ├── LiveTrade.jsx   # The Trading Terminal
    └── Curriculum.jsx  # Education Hub

```

## 🎨 Key Features

### The "ShifuChat" Overlay

Located in `components/layout/ShifuChat.jsx`.
This component persists across all pages. It listens for global events (like a bad trade) and pops up to intervene, ensuring the user cannot ignore the lesson.

### Competency Radar

Located in `components/dashboard/CompetencyRadar.jsx`.
Visualizes the user's growth across 5 axes: *Discipline, Risk Management, Technical Analysis, Psychology, and Consistency.*

## 🛠️ Setup & Commands

```bash
# Install Dependencies
npm install

# Run Development Server
npm run dev

# Build for Production
npm run build

```
