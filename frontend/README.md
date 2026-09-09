# 🧭 Frontend Structure & Navigation Guide

Welcome to the **FocusGuard AI Frontend**! If you are wondering **"Which file am I supposed to open/see first?"**, this guide gives you the exact answer.

---

## 🎯 Which File Do I Open First? (The 3-Step Path)

Whenever you are working on or exploring the frontend, follow this flow:

```mermaid
graph TD
    Step1["1. src/main.jsx<br/>(Entry Point)"] --> Step2["2. src/App.jsx<br/>(Router & URL Routes)"]
    Step2 -->|"/dashboard"| Step3["3. src/pages/Dashboard.jsx<br/>(Main App Interface)"]
    Step2 -->|"/" or "/landing"| Landing["src/pages/LandingPage.jsx"]
    Step2 -->|"/login"| Login["src/pages/Login.jsx"]
    Step2 -->|"/register"| Register["src/pages/Register.jsx"]
```

1. **[src/main.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/main.jsx)**: Vite's root bootstrap file. Renders `<App />` into the DOM.
2. **[src/App.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/App.jsx)**: **The central router**. Shows you every URL route in the app.
3. **[src/pages/Dashboard.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Dashboard.jsx)**: **The main application page** where all monitoring, analytics, and tabs live.

---

## 🗺️ Which File Controls What?

### 1. The 4 Main Pages (`src/pages/`)
| URL Route | File to Open | Description |
| :--- | :--- | :--- |
| `/` or `/landing` | [LandingPage.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/LandingPage.jsx) | Marketing homepage with features, hero section, and pricing/demo. |
| `/login` | [Login.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Login.jsx) | User authentication & JWT token generation. |
| `/register` | [Register.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Register.jsx) | New user sign up and onboarding. |
| `/dashboard` | [Dashboard.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Dashboard.jsx) | **Core product workspace** with tabs, live stats, timer, and AI bot. |

---

### 2. Dashboard Tabs (`src/components/`)
Inside [Dashboard.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/Dashboard.jsx), clicking an item on the left **Sidebar** switches the active tab. Here is which component renders each tab:

| Sidebar Tab Clicked | Component Rendered | What It Does |
| :--- | :--- | :--- |
| **Overview** (default) | [DashboardOverview.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/DashboardOverview.jsx) | Main KPI cards, live focus score, quick start session, and charts. |
| **Activity** | [ActivityView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/ActivityView.jsx) | Real-time active window logs, category breakdown, and app time. |
| **Focus Sessions** | [FocusSessionsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/FocusSessionsView.jsx) | Pomodoro session launcher, active countdown timer, session history. |
| **Distractions** | [DistractionsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/DistractionsView.jsx) | Distraction incidents, flagged apps, penalty logs, and alert triggers. |
| **Telemetry** | [RecentTelemetryView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/RecentTelemetryView.jsx) | Raw incoming event stream from the desktop Python monitoring agent. |
| **Goals & Streaks** | [GoalsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/GoalsView.jsx) | Daily and weekly focus targets, streak counters, and achievements. |
| **Reports** | [ReportsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/ReportsView.jsx) | Productivity report generation, executive summaries, PDF downloads. |
| **Analytics** | [AnalyticsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/AnalyticsView.jsx) | Attention curves, peak focus hours, and historical trends. |
| **AI Insights** | [AIInsightsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/AIInsightsView.jsx) | Machine learning predictions, fatigue warnings, and smart tips. |
| **Settings** | [SettingsView.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/SettingsView.jsx) | Personal thresholds, theme, agent API keys, and account settings. |

---

### 3. Layout & Global Widgets
- **[Sidebar.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/Sidebar.jsx)**: Navigation drawer that switches between tabs.
- **[PersonalFocusBot.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/PersonalFocusBot.jsx)**: Floating AI assistant widget on the bottom right (Groq + RAG powered).
- **[NotificationsCenter.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/NotificationsCenter.jsx)**: Notification bell in the dashboard header.
- **[ProfileMenu.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/ProfileMenu.jsx)**: User avatar, account info, and sign-out button.
- **[MLMetricsCard.jsx](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/components/MLMetricsCard.jsx)**: Live accuracy, inference latency, and ML model status.

---

### 4. Stylesheets (`src/` & `src/pages/`)
- **[src/index.css](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/index.css)**: Global CSS variables (colors, typography, light/dark themes, glassmorphism tokens).
- **[src/pages/dashboard.css](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/pages/dashboard.css)**: CSS styles specifically for the Dashboard layout and all tab views.

---

### 5. API Client (`src/services/`)
- **[src/services/api.js](file:///d:/INFOSYS/FocusGuard-AI--Human-Attention-Preservation---Digital-Distraction-Intelligence-Platform-July-2026/frontend/src/services/api.js)**: Base URL configs for REST endpoints (`/api/monitoring`, `/api/auth`, `/api/goals`, `/api/ai`).
