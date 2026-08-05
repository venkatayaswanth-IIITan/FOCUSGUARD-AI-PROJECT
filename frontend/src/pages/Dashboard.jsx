import { useEffect, useState } from "react";
import { Clock, Code2, RefreshCcw, Layers, Zap, PauseCircle } from "lucide-react";

import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import LiveActivity from "../components/LiveActivity";
import AppUsage from "../components/AppUsage";
import RecentActivity from "../components/RecentActivity";
import SessionAnalytics from "../components/SessionAnalytics";
import NotificationsCenter from "../components/NotificationsCenter";
import ProfileMenu from "../components/ProfileMenu";
import ThemeToggle from "../components/ThemeToggle";

import "./dashboard.css";

const API = "http://localhost:5000/api/monitoring";

function formatDuration(seconds) {
  const secs = Number(seconds || 0);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSecs}s`;
  return `${remainingSecs}s`;
}

function Dashboard() {
  const [activeSession, setActiveSession] = useState(null);
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

  // Handle incoming real-time notifications from Socket.IO events
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

  // Fetch current session state from backend (for page load & browser refresh)
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
        } else {
          setActiveSession(null);
          setSessionStats({
            monitoredDuration: 0,
            activeTime: 0,
            idleTime: 0,
            uniqueApps: 0,
            totalSwitches: 0,
            longestSessionSeconds: 0,
            appUsage: [],
            recentActivity: [],
          });
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
    setCompletedAnalytics(analytics);
    fetchSessionData();
  };

  const handleStatsUpdate = (stats) => {
    if (stats) {
      setSessionStats(stats);
    }
  };

  const handleAgentStatusChange = (connected) => {
    setIsAgentConnected(connected);
  };

  return (
    <div className="dashboardLayout">
      <Sidebar />

      <main className="mainContent">
        <header className="topbar">
          <div>
            <span className="pageLabel">FOCUSGUARD AI — WINDOWS MONITORING</span>
            <h1>Real User Activity System</h1>
            <p>Foreground application tracking & win32 idle detection (No mock or simulated data).</p>
          </div>

          <div className="topActions">
            <div className={`agentStatusBadge ${isAgentConnected ? "connected" : "disconnected"}`}>
              <span className="statusDot" />
              {isAgentConnected ? "🟢 Windows Monitor Connected" : "🔴 Windows Monitor Disconnected"}
            </div>

            <div className={`monitorChip ${activeSession ? "active" : "inactive"}`}>
              <span className="statusDot" />
              {activeSession ? "🟢 Monitoring Active" : "⚪ Monitoring Off"}
            </div>

            {/* THEME TOGGLE (LIGHT / DARK) */}
            <ThemeToggle />

            {/* NOTIFICATIONS CENTER (TOP RIGHT CORNER) */}
            <NotificationsCenter
              notifications={notifications}
              onClear={handleClearNotifications}
              onMarkRead={handleMarkNotificationsRead}
              onItemClick={handleMarkItemRead}
            />

            {/* USER PROFILE SECTION (TOP RIGHT CORNER) */}
            <ProfileMenu isAgentConnected={isAgentConnected} />
          </div>
        </header>

        {loading ? (
          <div className="loading">Connecting to FocusGuard session manager...</div>
        ) : (
          <>
            {/* 6 REAL METRICS CARDS */}
            <section className="statsGrid">
              <StatCard
                icon={<Clock size={21} />}
                title="Monitoring Time"
                value={formatDuration(sessionStats.monitoredDuration)}
                subtitle={activeSession ? "Total time since session start" : "No active session"}
              />

              <StatCard
                icon={<Zap size={21} />}
                title="Active Time"
                value={formatDuration(sessionStats.activeTime)}
                subtitle="Non-idle interaction time"
              />

              <StatCard
                icon={<PauseCircle size={21} />}
                title="Idle Time"
                value={formatDuration(sessionStats.idleTime)}
                subtitle="Detected user inactivity"
              />

              <StatCard
                icon={<Code2 size={21} />}
                title="Apps Used"
                value={sessionStats.uniqueApps}
                subtitle="Distinct applications detected"
              />

              <StatCard
                icon={<RefreshCcw size={21} />}
                title="Task Switches"
                value={sessionStats.totalSwitches}
                subtitle="Foreground context switches"
              />

              <StatCard
                icon={<Layers size={21} />}
                title="Longest Session"
                value={formatDuration(sessionStats.longestSessionSeconds)}
                subtitle="Max continuous application duration"
              />
            </section>

            {/* LIVE FOREGROUND APPLICATION CARD */}
            <LiveActivity
              activeSession={activeSession}
              onSessionStart={handleSessionStart}
              onSessionStop={handleSessionStop}
              onStatsUpdate={handleStatsUpdate}
              onAgentStatusChange={handleAgentStatusChange}
              onNotification={handleNewNotification}
            />

            {/* LIVE APPLICATION USAGE LIST & PROGRESS BARS */}
            <section className="dashboardGrid">
              <AppUsage
                activities={sessionStats.appUsage}
                totalActiveTime={sessionStats.activeTime}
              />
            </section>

            {/* RECENT ACTIVITY LOG TABLE */}
            <RecentActivity activities={sessionStats.recentActivity} />

            {/* COMPLETED SESSION ANALYTICS MODAL */}
            {completedAnalytics && (
              <SessionAnalytics
                analytics={completedAnalytics}
                onClose={() => setCompletedAnalytics(null)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
