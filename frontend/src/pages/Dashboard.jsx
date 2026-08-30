import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardOverview from "../components/DashboardOverview";
import ActivityView from "../components/ActivityView";
import SessionAnalytics from "../components/SessionAnalytics";

import FocusSessionsView from "../components/FocusSessionsView";
import DistractionsView from "../components/DistractionsView";
import RecentTelemetryView from "../components/RecentTelemetryView";
import GoalsView from "../components/GoalsView";
import ReportsView from "../components/ReportsView";
import AnalyticsView from "../components/AnalyticsView";
import AIInsightsView from "../components/AIInsightsView";
import SettingsView from "../components/SettingsView";
import PersonalFocusBot from "../components/PersonalFocusBot";

import "./dashboard.css";


const API = "http://localhost:5000/api/monitoring";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSession, setActiveSession] = useState(null);
  const [liveCurrentApp, setLiveCurrentApp] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    monitoredDuration: 0,
    activeTime: 0,
    idleTime: 0,
    uniqueApps: 0,
    totalSwitches: 0,
    longestSessionSeconds: 0,
    appUsage: [],
    recentActivity: [],
  });
  const [completedAnalytics, setCompletedAnalytics] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "agent_connect",
      title: "FocusGuard Activity System Initialized",
      message: "Ready to record real Windows foreground applications and system idle intervals.",
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Initialize Theme and Visual Preferences (Default: Dark Obsidian Glassmorphism)
  useEffect(() => {
    localStorage.setItem("theme", "dark");
    const accent = localStorage.getItem("focusguard_accent") || "blue";
    const glass = localStorage.getItem("focusguard_glass") !== "false";
    const compact = localStorage.getItem("focusguard_compact") === "true";

    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    document.documentElement.setAttribute("data-accent", accent);
    document.documentElement.setAttribute("data-glass", String(glass));
    document.documentElement.setAttribute("data-compact", String(compact));
  }, []);

  // Local monitoring timer
  useEffect(() => {
    if (!activeSession) return;
    const sessionStart = new Date(activeSession.started_at).getTime();
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
      setSessionStats((prev) => ({ ...prev, monitoredDuration: elapsed }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleNewNotification = (newNotif) => {
    setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkItemRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  async function fetchSessionData() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.active && data.session) {
          setActiveSession(data.session);
          if (data.stats) {
            setSessionStats(data.stats);
          }
        }
      }
    } catch (error) {
      console.error("Dashboard status fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleSessionStart = (session) => {
    setActiveSession(session);
    setCompletedAnalytics(null);
    fetchSessionData();
  };

  const handleSessionStop = (analytics) => {
    setActiveSession(null);
    setLiveCurrentApp(null);
    setCompletedAnalytics(analytics);
    fetchSessionData();
  };

  const handleManualStartSession = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        handleSessionStart(data.session);
      }
    } catch (err) {
      console.error("Manual start session error:", err);
    }
  };

  const handleManualStopSession = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentApp: liveCurrentApp }),
      });
      if (res.ok) {
        const data = await res.json();
        handleSessionStop(data.analytics);
      }
    } catch (err) {
      console.error("Manual stop session error:", err);
    }
  };

  const handleStatsUpdate = (stats, currentApp = null) => {
    if (stats) {
      setSessionStats((prev) => ({
        ...stats,
        monitoredDuration: prev.monitoredDuration,
      }));
    }
    if (currentApp) {
      setLiveCurrentApp(currentApp);
    }
  };

  const handleCurrentAppChange = (app) => {
    setLiveCurrentApp(app);
  };

  const handleAgentStatusChange = (connected) => {
    setIsAgentConnected(connected);
  };

  return (
    <div className="dashboardLayout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="mainContent">
        {loading ? (
          <div className="loading" style={{ padding: "40px" }}>
            Connecting to FocusGuard session manager...
          </div>
        ) : (
          <>
            {/* VIEW 1: MAIN DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <DashboardOverview onNavigateTab={setActiveTab} />
            )}

            {/* VIEW 2: ACTIVITY (live telemetry + heatmap + top apps) */}
            {activeTab === "live" && (
              <ActivityView
                activeSession={activeSession}
                onSessionStart={handleSessionStart}
                onSessionStop={handleSessionStop}
                onStatsUpdate={handleStatsUpdate}
                onAgentStatusChange={handleAgentStatusChange}
                onNotification={handleNewNotification}
                onCurrentAppChange={handleCurrentAppChange}
              />
            )}

            {/* VIEW: RECENTLY (Full telemetry records & timeline) */}
            {activeTab === "recently" && (
              <RecentTelemetryView
                sessionStats={sessionStats}
                liveCurrentApp={liveCurrentApp}
                activeSession={activeSession}
              />
            )}

            {/* VIEW 3: FOCUS SESSIONS (Pomodoro + streak + sessions table) */}
            {activeTab === "sessions" && (
              <FocusSessionsView
                activeSession={activeSession}
                onStartSession={handleManualStartSession}
                onStopSession={handleManualStopSession}
              />
            )}

            {/* VIEW 4: DISTRACTIONS */}
            {activeTab === "distractions" && (
              <DistractionsView />
            )}

            {/* VIEW 5: ANALYTICS */}
            {activeTab === "analytics" && (
              <AnalyticsView sessionStats={sessionStats} />
            )}

            {/* VIEW 6: AI INSIGHTS */}
            {activeTab === "insights" && (
              <AIInsightsView />
            )}

            {/* VIEW 7: REPORTS */}
            {activeTab === "reports" && (
              <ReportsView />
            )}

            {/* VIEW 8: GOALS */}
            {activeTab === "goals" && (
              <GoalsView />
            )}

            {/* VIEW 9: SETTINGS */}
            {activeTab === "settings" && (
              <SettingsView />
            )}

            {/* COMPLETED SESSION ANALYTICS MODAL */}
            {completedAnalytics && (
              <SessionAnalytics
                analytics={completedAnalytics}
                onClose={() => setCompletedAnalytics(null)}
              />
            )}

            {/* PERSONAL FOCUS ASSISTANT / CHATBOT FOR USER DOUBTS */}
            <PersonalFocusBot />
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
