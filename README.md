# FocusGuard AI — Human Attention Preservation & Digital Distraction Intelligence Platform

**Intern:** Venkata Yaswanth  
**Organization:** Infosys Springboard Internship 2026  
**Tech Stack:** Node.js · Express · PostgreSQL · Socket.IO · React · Python · Win32 API

---

## What I Have Implemented

### 1. Database
I designed and implemented a PostgreSQL database with the following tables:
- **users** — stores registered user accounts
- **monitoring_sessions** — tracks each focus/monitoring session per user
- **activity_logs** — records every application the user used with duration
- **task_switches** — logs every time the user switched from one app to another
- **idle_events** — captures when the user was idle and for how long

### 2. Backend API (Node.js + Express)
I built a REST API server with the following features:
- **User Registration** — validates input, hashes password using bcryptjs, stores in database
- **User Login** — verifies credentials and returns a JWT token for authentication
- **Session Management** — start and stop monitoring sessions, check current session status
- **Activity Data APIs** — fetch activity logs, task switches, and full session analytics for any session
- **JWT Middleware** — protects all monitoring routes so only logged-in users can access them

### 3. Real-Time Communication (Socket.IO)
I integrated Socket.IO into the backend server to enable real-time data flow:
- The **Python monitoring agent** connects to the server as a special agent client
- The **React dashboard** connects as a regular user client
- When the Python agent detects an app switch or idle event, it sends the data to the server instantly
- The server forwards that data in real time to the correct user's dashboard
- A **heartbeat/ping system** keeps track of whether the Python agent is connected or disconnected

### 4. Python Windows Monitoring Agent
I built a Python agent that runs in the background on Windows and monitors user activity:
- Uses **Win32 API** (`win32gui`, `win32process`) to detect the current foreground application
- Uses **psutil** to get the process name and resolve it to a friendly app name (e.g., `chrome.exe` → `Google Chrome`)
- Detects **context switches** — when the user moves from one app to another, it records the duration spent on the previous app
- Detects **idle state** — if the user is inactive beyond a set threshold, it triggers an idle event
- Connects to the backend via **Socket.IO** and sends all activity data in real time
- Responds to remote **start/stop** commands sent from the dashboard

### 5. React Frontend (Dashboard)
I built a complete frontend application using React 19 and Vite with the following pages and features:
- **Landing Page** — describes the product with features and a hero section
- **Login & Register pages** — forms connected to the backend auth API with JWT storage
- **Dashboard** — the main monitoring interface with:
  - Start / Stop monitoring button
  - Live display of the current active application
  - Session stats (total time, active time, idle time, app switches)
  - App usage breakdown for the session
  - Recent activity feed
  - Session analytics after monitoring ends
  - Python agent connection status indicator (online/offline badge)
  - Notifications panel for system events
  - Profile menu and theme toggle (light/dark)

---

## Steps I Followed

**Step 1 — Planned the Architecture**  
Identified the three main layers needed: a database, a backend API, and a frontend. Also identified the need for a separate Python agent for Windows activity tracking since browsers cannot access system-level process data.

**Step 2 — Set Up the Database**  
Created the PostgreSQL schema with all required tables and indexes for fast querying by user and session.

**Step 3 — Built the Backend**  
Set up an Express server, connected it to PostgreSQL using `pg`, and implemented authentication (register/login with JWT). Then built all monitoring-related REST endpoints.

**Step 4 — Integrated Socket.IO**  
Added Socket.IO to the same Express server to handle real-time communication. Implemented separate handling for the Python agent connection and the React client connection. Set up per-user rooms so each user only receives their own data.

**Step 5 — Built the Python Monitoring Agent**  
Created the agent using pywin32 and psutil to track foreground windows on Windows. Implemented idle detection, friendly app name resolution, and a Socket.IO client to send data to the backend. Added a heartbeat ping every 3 seconds to keep the connection status accurate.

**Step 6 — Built the React Frontend**  
Set up the React app with Vite and React Router. Built the landing page, auth pages, and the full dashboard. Connected the dashboard to both the REST API and the Socket.IO server for live updates.

**Step 7 — Tested End-to-End Flow**  
Ran all three parts together — backend server, Python agent, and React frontend — and verified that starting a monitoring session from the dashboard triggers real-time activity tracking and live dashboard updates.

**Step 8 — Pushed to GitHub**  
Created the branch `venkata-yaswanth` on the Springboard repository and pushed all completed work.

---

## How to Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Python Agent (Windows only):**
```bash
cd monitoring-agent
pip install -r requirements.txt
python main.py
```

**Database:**  
Run `database/schema.sql` in PostgreSQL before starting the backend.

**Environment Variables (.env in root):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focusguard
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=5000
```