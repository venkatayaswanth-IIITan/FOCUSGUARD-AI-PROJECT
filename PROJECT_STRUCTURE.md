# 🗺️ FocusGuard AI — Master Project Structure & File Guide

If you are opening this project and wondering **which file to look at or where to start**, this guide provides a complete, clear breakdown.

---

## ⚡ Quick Start: Which File to Open?

| If You Want To Edit / Inspect... | Open This File |
| :--- | :--- |
| **Frontend Router / All App Routes** | [frontend/src/App.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/App.jsx) |
| **Frontend Entry Point** | [frontend/src/main.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/main.jsx) |
| **Main Dashboard (Tabs, Timer, Header)** | [frontend/src/pages/Dashboard.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Dashboard.jsx) |
| **Landing Page** | [frontend/src/pages/LandingPage.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/LandingPage.jsx) |
| **All 25 Frontend Components Catalog** | [frontend/src/components/index.js](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/index.js) |
| **Backend Entry Point (Express & WebSockets)**| [backend/server.js](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/backend/server.js) |
| **Backend Database Pool & Tables** | [backend/config/db.js](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/backend/config/db.js) |
| **Backend API Endpoints** | [backend/routes/](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/backend/routes/) |
| **Backend Business Logic** | [backend/controllers/](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/backend/controllers/) |
| **Desktop Background Agent** | [monitoring-agent/main.py](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/monitoring-agent/main.py) |
| **AI ML Training & Models** | [ai/train_model.py](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/ai/train_model.py) |

---

## 🏗️ High-Level Project Architecture

```
FOCUSGUARD-AI/
├── 🌐 frontend/              # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── main.jsx          # Vite React root mount
│   │   ├── App.jsx           # Master URL router (/, /login, /register, /dashboard)
│   │   ├── index.css         # Global design tokens, dark/light themes
│   │   ├── pages/            # Top-level route pages
│   │   │   ├── LandingPage.jsx   # Marketing & features homepage
│   │   │   ├── Login.jsx         # Sign-in page
│   │   │   ├── Register.jsx      # Sign-up page
│   │   │   ├── Dashboard.jsx     # Main product dashboard (hosts all tabs)
│   │   │   └── dashboard.css     # Styles for dashboard & view tabs
│   │   ├── components/       # UI components & tab views (indexed in index.js)
│   │   │   ├── index.js          # Component registry & categorized exports
│   │   │   ├── Sidebar.jsx       # Left navigation menu
│   │   │   ├── DashboardOverview.jsx # Default dashboard tab
│   │   │   ├── ActivityView.jsx      # Active window activity tab
│   │   │   ├── FocusSessionsView.jsx # Pomodoro sessions tab
│   │   │   ├── DistractionsView.jsx  # Distraction logs tab
│   │   │   ├── RecentTelemetryView.jsx # Live telemetry stream tab
│   │   │   ├── GoalsView.jsx         # Daily/weekly goals tab
│   │   │   ├── ReportsView.jsx       # Analytics reports & PDF export tab
│   │   │   ├── AnalyticsView.jsx     # Deep focus curves tab
│   │   │   ├── AIInsightsView.jsx    # ML insights tab
│   │   │   ├── SettingsView.jsx      # App preferences & agent keys tab
│   │   │   └── PersonalFocusBot.jsx  # Floating RAG-powered AI chat assistant
│   │   └── services/
│   │       └── api.js        # Axios / fetch base configuration
│   └── README.md             # Detailed Frontend Guide
│
├── ⚙️ backend/               # Node.js + Express + Socket.IO REST API
│   ├── server.js             # Main server setup & socket handler
│   ├── config/
│   │   └── db.js             # PostgreSQL connection & auto schema creation
│   ├── routes/               # Express route definitions
│   │   ├── authRoutes.js     # User registration & login endpoints
│   │   ├── activityRoutes.js # Telemetry ingestion, sessions, AI chat
│   │   ├── goalRoutes.js     # Focus goal tracking
│   │   └── userRoutes.js     # User profile management
│   ├── controllers/          # Request handlers & DB operations
│   │   ├── authController.js
│   │   ├── activityController.js
│   │   ├── goalController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT authentication guard
│   ├── services/
│   │   └── ragEngine.js      # Vector knowledge base & Groq LLM integration
│   └── README.md             # Detailed Backend Guide
│
├── 💻 monitoring-agent/      # Native Python Desktop Activity Daemon
│   ├── main.py               # Background daemon entry point
│   ├── activity_monitor.py   # Windows foreground window poll loop
│   ├── idle_detector.py      # Keyboard/mouse inactivity detector
│   └── ml_predictor.py       # Local distraction inference engine
│
├── 🧠 ai/                    # ML Model Training & Evaluation
│   ├── train_model.py        # Random Forest / Decision Tree model trainer
│   ├── models/               # Saved joblib model files
│   └── reports/              # Model classification metrics & reports
│
└── 🗄️ database/              # SQL schemas & migration scripts
    └── schema.sql            # Master database DDL
```

---

## 💡 How Frontend & Backend Talk to Each Other

1. **User logs in on frontend** (`frontend/src/pages/Login.jsx`)
   ↳ Sends `POST /api/auth/login` to `backend/routes/authRoutes.js`
   ↳ Handled by `backend/controllers/authController.js`
   ↳ Returns JWT token stored in browser `localStorage.getItem("token")`.

2. **User opens Dashboard** (`frontend/src/pages/Dashboard.jsx`)
   ↳ Calls `GET /api/monitoring/status` to fetch active session & agent state.
   ↳ Listens to live WebSocket events via Socket.IO for real-time window switches.

3. **Desktop Agent tracks activity** (`monitoring-agent/main.py`)
   ↳ Detects foreground window on Windows OS.
   ↳ Sends `POST /api/monitoring/activity` to backend.
   ↳ Backend processes event, saves to PostgreSQL, and broadcasts to Dashboard.

4. **User asks Personal Focus Bot a question** (`PersonalFocusBot.jsx`)
   ↳ Sends query to `POST /api/ai/chat`.
   ↳ `ragEngine.js` performs RAG search on `FocusGuard_RAG_Knowledge_Base.pdf` chunks.
   ↳ Calls Groq LLM API and streams the smart answer back to the chat widget.
