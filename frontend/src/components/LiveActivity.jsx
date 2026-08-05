import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Play, Square, AlertCircle, Radio, Clock, Monitor } from "lucide-react";

function formatTimer(seconds) {
  const secs = Number(seconds || 0);
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;
  const pad = (num) => String(num).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(remainingSecs)}`;
  }
  return `${pad(mins)}:${pad(remainingSecs)}`;
}

function LiveActivity({
  onSessionStart,
  onSessionStop,
  onStatsUpdate,
  onAgentStatusChange,
  onNotification,
  activeSession,
}) {
  const [socket, setSocket] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(Boolean(activeSession));
  const [currentApp, setCurrentApp] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMonitoring(Boolean(activeSession));
  }, [activeSession]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socketInstance = io("http://localhost:5000", {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      socketInstance.emit("client:sync");
    });

    socketInstance.on("agent:status", (data) => {
      const connected = Boolean(data?.connected);
      setIsAgentConnected(connected);
      if (onAgentStatusChange) onAgentStatusChange(connected);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: connected ? "agent_connect" : "agent_disconnect",
          title: connected ? "Monitoring Agent Connected" : "Monitoring Agent Disconnected",
          message: connected
            ? "Python Windows monitoring agent attached."
            : "Python monitoring agent disconnected from server.",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    socketInstance.on("monitoring:status", (data) => {
      const isMon = Boolean(data?.isMonitoring);
      const isConn = Boolean(data?.isAgentConnected);

      setIsMonitoring(isMon);
      setIsAgentConnected(isConn);
      if (onAgentStatusChange) onAgentStatusChange(isConn);

      if (data?.currentApp) {
        setCurrentApp(data.currentApp);
      }
      if (data?.stats && onStatsUpdate) {
        onStatsUpdate(data.stats);
      }
    });

    socketInstance.on("activity:current", (data) => {
      const isConn = Boolean(data?.isAgentConnected);
      setIsAgentConnected(isConn);
      if (onAgentStatusChange) onAgentStatusChange(isConn);

      if (data?.currentApp) {
        setCurrentApp(data.currentApp);
      }
      if (data?.stats && onStatsUpdate) {
        onStatsUpdate(data.stats);
      }
    });

    socketInstance.on("activity:changed", (data) => {
      if (data?.stats && onStatsUpdate) {
        onStatsUpdate(data.stats);
      }
      if (onNotification && data?.currentApp) {
        onNotification({
          id: Date.now(),
          type: "switch",
          title: "Application Changed",
          message: `Switched to ${data.currentApp} (${data.durationSeconds || 1}s in ${data.previousApp || "previous app"})`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    socketInstance.on("idle:started", (data) => {
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: "idle",
          title: "User Inactivity Detected",
          message: "System idle threshold reached. Activity timer paused.",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    socketInstance.on("idle:ended", (data) => {
      if (data?.stats && onStatsUpdate) {
        onStatsUpdate(data.stats);
      }
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: "idle",
          title: "User Resumed Activity",
          message: `Inactivity ended. Idle duration: ${data?.idleData?.duration_seconds || 0}s`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    socketInstance.on("monitoring:started", (data) => {
      setIsMonitoring(true);
      if (data?.stats && onStatsUpdate) {
        onStatsUpdate(data.stats);
      }
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: "start",
          title: "Monitoring Session Started",
          message: "Active Windows application tracking initialized.",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    socketInstance.on("monitoring:stopped", () => {
      setIsMonitoring(false);
      setCurrentApp(null);
      setLiveSeconds(0);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: "stop",
          title: "Monitoring Session Stopped",
          message: "Monitoring session closed and statistics aggregated in PostgreSQL.",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Application session duration timer (Derived strictly from current timestamp - app start timestamp)
  useEffect(() => {
    if (!currentApp || !currentApp.start_time) return;

    const calculateElapsed = () => {
      const start = new Date(currentApp.start_time).getTime();
      const now = new Date().getTime();
      const elapsed = Math.max(0, Math.floor((now - start) / 1000));
      setLiveSeconds(elapsed);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [currentApp]);

  // Handle START MONITORING Click
  const handleStartMonitoring = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/monitoring/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsMonitoring(true);
        if (socket) {
          socket.emit("client:start_monitoring", data.session);
        }
        if (onSessionStart) onSessionStart(data.session);
      }
    } catch (err) {
      console.error("Start monitoring error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle STOP MONITORING Click
  const handleStopMonitoring = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/monitoring/stop", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentApp }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsMonitoring(false);
        setCurrentApp(null);
        setLiveSeconds(0);

        if (socket) {
          socket.emit("client:stop_monitoring");
        }
        if (onSessionStop) onSessionStop(data.analytics);
      }
    } catch (err) {
      console.error("Stop monitoring error:", err);
    } finally {
      setLoading(false);
    }
  };

  // STATE 1: AGENT DISCONNECTED
  if (!isAgentConnected) {
    return (
      <div className="panel livePanel disconnectedPanel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">MONITOR CONNECTION STATUS</span>
            <h3>Windows Activity Agent</h3>
          </div>
          <span className="liveBadge badgeRed">🔴 Agent Disconnected</span>
        </div>

        <div className="agentAlertBox">
          <AlertCircle size={24} className="iconRed" />
          <div>
            <h4>Monitoring Agent Disconnected</h4>
            <p>Start the FocusGuard Windows monitoring agent to begin activity tracking.</p>
          </div>
        </div>

        <div className="actionRow">
          <button className="startMonitoringBtn disabled" disabled={true}>
            <Play size={18} />
            <span>▶ Start Monitoring</span>
          </button>
        </div>

        <div className="liveTimer">
          <span>Agent Status</span>
          <strong className="statusRed">OFFLINE</strong>
        </div>
      </div>
    );
  }

  // STATE 2: AGENT CONNECTED + MONITORING OFF
  if (!isMonitoring) {
    return (
      <div className="panel livePanel readyPanel">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">SYSTEM STATE</span>
            <h3>Activity Monitor Ready</h3>
          </div>
          <span className="liveBadge badgeGray">🟢 Agent Connected (Monitoring Off)</span>
        </div>

        <div className="readyContent">
          <p>Click <strong>▶ START MONITORING</strong> to begin tracking real foreground Windows applications during this session.</p>

          <button
            className="startMonitoringBtn"
            onClick={handleStartMonitoring}
            disabled={loading}
          >
            <Play size={18} />
            <span>▶ START MONITORING</span>
          </button>
        </div>

        <div className="liveTimer">
          <span>Monitoring Status</span>
          <strong className="statusGray">READY / OFF</strong>
        </div>
      </div>
    );
  }

  // STATE 3: MONITORING ACTIVE
  return (
    <div className="panel livePanel activePanel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">
            <Radio size={14} /> REAL FOREGROUND APPLICATION
          </span>
          <h3>Currently Active</h3>
        </div>

        <div className="livePanelActions">
          <button
            className="stopMonitoringBtn"
            onClick={handleStopMonitoring}
            disabled={loading}
          >
            <Square size={16} />
            <span>■ STOP MONITORING</span>
          </button>

          <span className="liveBadge badgeGreen">🟢 Monitoring Active</span>
        </div>
      </div>

      <div className="activeApplication">
        <div className="appIcon large">
          <Monitor size={30} />
        </div>

        <div>
          <span className="muted">Currently Active Application</span>
          <h2>{currentApp?.app_name || "Detecting foreground application..."}</h2>
          {currentApp?.process_name && (
            <p className="processNameText">Process: {currentApp.process_name}</p>
          )}
          {currentApp?.window_title ? (
            <p className="windowTitleText">Window: {currentApp.window_title}</p>
          ) : (
            <p className="muted">Window title collection OFF</p>
          )}
        </div>
      </div>

      <div className="liveTimer">
        <div>
          <span>Current App Duration</span>
          <p className="timerSubtitle">
            Started: {currentApp?.start_time ? new Date(currentApp.start_time).toLocaleTimeString() : "Just now"}
          </p>
        </div>

        <div className="liveCounterDisplay">
          <Clock size={16} />
          <span className="timerDigits">{formatTimer(liveSeconds)}</span>
          <strong className="statusGreen">LIVE</strong>
        </div>
      </div>
    </div>
  );
}

export default LiveActivity;
