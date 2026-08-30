import { useEffect, useState } from "react";
import {
  Clock,
  Play,
  Square,
  BarChart2,
  Download,
  Trash2,
  Calendar,
  Layers,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import SessionAnalytics from "./SessionAnalytics";

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

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionsView({ activeSession, onStartSession, onStopSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'completed'
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const token = localStorage.getItem("token");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeSession]);

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm(`Are you sure you want to delete Session #${sessionId}?`)) return;

    try {
      const res = await fetch(`${API}/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setActionMessage(`Session #${sessionId} deleted successfully.`);
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleViewAnalytics = async (sessionId) => {
    try {
      const res = await fetch(`${API}/session/${sessionId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAnalytics(data);
      }
    } catch (err) {
      console.error("Error loading session analytics:", err);
    }
  };

  const handleExportSession = (session) => {
    const reportData = {
      sessionId: session.id,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalDurationSeconds: session.total_duration_seconds,
      activeSeconds: session.active_secs,
      idleSeconds: session.idle_secs,
      appCount: session.app_count,
      switchCount: session.switch_count,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FocusGuard_Session_${session.id}_Report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionMessage(`Exported report for Session #${session.id}.`);
    setTimeout(() => setActionMessage(""), 3000);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "active") return s.status === "active";
    if (filter === "completed") return s.status === "completed";
    return true;
  });

  return (
    <div className="sessionsViewContainer">
      {/* HEADER BAR */}
      <div className="panel sessionsHeaderPanel">
        <div>
          <span className="eyebrow">MONITORING HISTORY</span>
          <h2>Sessions & Attention Log</h2>
          <p>Review completed user activity sessions, inspect analytics breakdown, and export logs.</p>
        </div>

        <div className="sessionsHeaderActions">
          {activeSession ? (
            <button className="btn btnDanger" onClick={onStopSession}>
              <Square size={16} />
              <span>Stop Monitoring Session</span>
            </button>
          ) : (
            <button className="btn btnPrimary" onClick={onStartSession}>
              <Play size={16} />
              <span>Start New Session</span>
            </button>
          )}

          <button className="btn btnSecondary" onClick={fetchSessions}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && <div className="alertSuccessBanner">{actionMessage}</div>}

      {/* FILTER & STATS BAR */}
      <div className="sessionsControlBar">
        <div className="filterGroup">
          <Filter size={16} className="iconMuted" />
          <span className="filterLabel">Status:</span>
          <button
            className={`filterChip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({sessions.length})
          </button>
          <button
            className={`filterChip ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active ({sessions.filter((s) => s.status === "active").length})
          </button>
          <button
            className={`filterChip ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({sessions.filter((s) => s.status === "completed").length})
          </button>
        </div>
      </div>

      {/* SESSIONS TABLE */}
      {loading ? (
        <div className="panel emptyState">Loading monitoring sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="panel emptyState">
          <Calendar size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p>No monitoring sessions found under this filter.</p>
          {!activeSession && (
            <button className="btn btnPrimary" style={{ marginTop: 12 }} onClick={onStartSession}>
              Start First Session
            </button>
          )}
        </div>
      ) : (
        <div className="panel sessionsTablePanel">
          <table className="sessionsTable">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Status</th>
                <th>Started At</th>
                <th>Total Duration</th>
                <th>Active / Idle</th>
                <th>Apps & Switches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const isActive = session.status === "active";
                return (
                  <tr key={session.id} className={isActive ? "activeSessionRow" : ""}>
                    <td>
                      <strong className="sessionIdTag">#{session.id}</strong>
                    </td>
                    <td>
                      <span className={`statusPill ${session.status}`}>
                        {isActive ? (
                          <>
                            <span className="liveDot" /> Active
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} /> Completed
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="dateText">{formatDate(session.started_at)}</span>
                    </td>
                    <td>
                      <strong>{formatDuration(session.total_duration_seconds)}</strong>
                    </td>
                    <td>
                      <div className="durBreakdown">
                        <span className="textGreen">Active: {formatDuration(session.active_secs)}</span>
                        <span className="textAmber">Idle: {formatDuration(session.idle_secs)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="appsSwitches">
                        <span>{session.app_count} Apps</span>
                        <small>{session.switch_count} Switches</small>
                      </div>
                    </td>
                    <td>
                      <div className="actionButtonsRow">
                        <button
                          className="btnIcon btnAnalytics"
                          title="View Full Session Analytics"
                          onClick={() => handleViewAnalytics(session.id)}
                        >
                          <BarChart2 size={16} />
                          <span>Analytics</span>
                        </button>

                        <button
                          className="btnIcon btnExport"
                          title="Export Report (JSON)"
                          onClick={() => handleExportSession(session)}
                        >
                          <Download size={16} />
                        </button>

                        <button
                          className="btnIcon btnDelete"
                          title="Delete Session"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SESSION ANALYTICS MODAL */}
      {selectedAnalytics && (
        <SessionAnalytics
          analytics={selectedAnalytics}
          onClose={() => setSelectedAnalytics(null)}
        />
      )}
    </div>
  );
}

export default SessionsView;
