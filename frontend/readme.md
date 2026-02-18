# Dojo Frontend (The Interface)

The frontend is a modern **React + Vite** application built for speed and real-time feedback. It connects to the backend via REST APIs and WebSockets to provide instant "Scolding" or "Praise" from the AI.

## 📂 Project Structure

```bash
frontend/src/
├── ai/                     # AI Helper Logic
│   └── aiTutor.js          # Curriculum explanation logic
├── api/                    # Backend API Connectors
│   ├── achievement.js      # Gamification endpoints
│   ├── curriculum.js       # Lesson progress endpoints
│   ├── dashboard.js        # User state fetching
│   └── trading.js          # Trade execution endpoints
├── assets/                 # Static Resources
│   ├── achievement.json    # Lottie Animation data
│   ├── empty-state.json    # UI placeholders
│   └── loading.json        # Loading state animation
├── components/             # UI Widgets
│   ├── dashboard/          # Analytics Visualizations
│   │   ├── CompetencyRadar.jsx     # Recharts Radar Chart
│   │   ├── MemorableMoment.jsx     # Achievement Highlight Card
│   │   └── PerformanceSummary.jsx  # PnL & Win Rate Stats
│   ├── layout/             # App Shell Structure
│   │   ├── MainLayout.jsx          # Wrapper for Pages
│   │   ├── ShifuChat.jsx           # The "Sensei" Overlay (Global)
│   │   ├── SideBar.jsx             # Navigation
│   │   └── TopBar.jsx              # Header & User Status
│   └── trading/            # Live Terminal Components
│       ├── ConnectionStatus.jsx    # WebSocket Health Indicator
│       ├── PriceChart.jsx          # Candlestick Visualization
│       ├── PriceTicker.jsx         # Live Price Header
│       ├── TradeForm.jsx           # Buy/Sell Controls
│       └── TradeTicker.jsx         # Scrolling Ticker Tape
├── data/                   # Static Data & Content
│   ├── curricular.json     # Hardcoded Lesson Content (Backup)
│   └── curriculum.js       # Curriculum Structure Definition
├── hooks/                  # Custom React Hooks
│   ├── useLiveTrade.js     # Manages active trade session state
│   ├── useTheme.jsx        # Dark/Light mode handler
│   └── useTradeWebSocket.js # Real-time price streaming logic
└── pages/                  # Main Route Views
    ├── Achievements.jsx    # User Badges & XP
    ├── AITutor.jsx         # Dedicated Chat Interface
    ├── Curriculum.jsx      # Lesson Map
    ├── Dashboard.jsx       # Main Hub
    ├── LessonDetail.jsx    # Individual Lesson View
    ├── LiveTrade.jsx       # The Trading Terminal
    ├── ModuleDetail.jsx    # Chapter Overview
    └── Settings.jsx        # User Configuration

```

## 🎨 Key Features

### The "ShifuChat" Overlay

Located in `components/layout/ShifuChat.jsx`.
This component persists across all pages. It listens for global events (like a bad trade or a completed lesson) and pops up to intervene, ensuring the user cannot ignore the AI's feedback.

### Competency Radar

Located in `components/dashboard/CompetencyRadar.jsx`.
Visualizes the user's growth across 5 axes: *Discipline, Risk Management, Technical Analysis, Psychology, and Consistency.*

### Real-Time Trading Terminal

Located in `pages/LiveTrade.jsx`.
Uses `useTradeWebSocket.js` to simulate live market data, allowing the user to practice execution while the AI watches their behavior in the background.

## 🛠️ Setup & Commands

```bash
# Install Dependencies
npm install

# Run Development Server
npm run dev

# Build for Production
npm run build

```
