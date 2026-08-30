import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  Play, Square, Radio, Monitor, Brain, TrendingUp, TrendingDown,
  Clock, Zap, Activity, BarChart2, Cpu, Wifi, WifiOff, Circle,
  ArrowRightLeft, Eye, Shield, Target, Layers,
} from "lucide-react";
import { API_MONITORING, getSocketUrl } from "../services/api";

/* ── helpers ── */
function fmt(s) {
  const secs = Number(s || 0);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), sec = secs % 60;
  const p = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${p(h)}:${p(m)}:${p(sec)}`;
  return `${p(m)}:${p(sec)}`;
}
function fmtMins(secs) {
  const m = Math.floor(Number(secs || 0) / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const APP_COLORS = {
  "Google Chrome": "#4285f4", "PowerPoint": "#d04a02", "Discord": "#5865f2",
  "Spotify": "#1db954", "IntelliJ IDEA": "#fe315d", "VS Code": "#007acc",
  "Slack": "#4a154b", "Excel": "#217346", "Word": "#2b579a", "Notepad": "#ffb900",
  "Firefox": "#ff6611", "YouTube": "#ff0000", "Notion": "#000000",
};
function appColor(name) { return APP_COLORS[name] || "#6366f1"; }
function appInitial(name) { return (name || "?").charAt(0).toUpperCase(); }

/* ── Static demo data ── */
const DEMO_APPS = [
  { app: "IntelliJ IDEA", url: "-", dur: 4860, prod: "Productive", cat: "Coding" },
  { app: "Google Chrome", url: "udemy.com", dur: 4200, prod: "Productive", cat: "Learning" },
  { app: "Spotify", url: "-", dur: 3600, prod: "Non-Productive", cat: "Entertainment" },
  { app: "Google Chrome", url: "stackoverflow.com", dur: 2520, prod: "Productive", cat: "Research" },
  { app: "Google Chrome", url: "github.com", dur: 2280, prod: "Productive", cat: "Coding" },
  { app: "Discord", url: "-", dur: 1800, prod: "Non-Productive", cat: "Communication" },
  { app: "PowerPoint", url: "-", dur: 1500, prod: "Productive", cat: "Office" },
  { app: "Google Chrome", url: "twitter.com", dur: 1320, prod: "Non-Productive", cat: "Social Media" },
];
const totalDemo = DEMO_APPS.reduce((a, x) => a + x.dur, 0);
const prodDemo = DEMO_APPS.filter(x => x.prod === "Productive").reduce((a, x) => a + x.dur, 0);
const focusPct = Math.round((prodDemo / totalDemo) * 100);
const maxDur = Math.max(...DEMO_APPS.map(x => x.dur));

/* ── Heatmap ── */
const HEAT_ROWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEAT_COLS = ["6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am", "3am"];
const HEAT_DATA = HEAT_ROWS.map(() => HEAT_COLS.map(() => Math.floor(Math.random() * 60)));
const HEAT_MAX = Math.max(...HEAT_DATA.flat());

function heatColor(val, max) {
  const pct = max > 0 ? val / max : 0;
  if (pct === 0) return "rgba(57,119,255,0.05)";
  if (pct < 0.25) return "rgba(57,119,255,0.18)";
  if (pct < 0.5)  return "rgba(57,119,255,0.38)";
  if (pct < 0.75) return "rgba(57,119,255,0.62)";
  return "#3977ff";
}

/* ── Main Component ── */
function ActivityView({ activeSession, onSessionStart, onSessionStop, onStatsUpdate, onAgentStatusChange, onCurrentAppChange }) {
  const [socket, setSocket] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(Boolean(activeSession));
  const [currentApp, setCurrentApp] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [stats, setStats] = useState({ totalSwitches: 0, uniqueApps: 0, activeTime: 0, idleTime: 0 });

  useEffect(() => { setIsMonitoring(Boolean(activeSession)); }, [activeSession]);
  useEffect(() => { if (onCurrentAppChange) onCurrentAppChange(currentApp); }, [currentApp]);

  useEffect(() => {
    if (!activeSession?.started_at) { setSessionSeconds(0); return; }
    const start = new Date(activeSession.started_at).getTime();
    const t = setInterval(() => setSessionSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000))), 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(getSocketUrl(), { auth: { token }, reconnection: true, reconnectionDelay: 2000 });
    setSocket(s);
    s.on("connect", () => s.emit("client:sync"));
    s.on("agent:status", (d) => { const c = Boolean(d?.connected); setIsAgentConnected(c); if (onAgentStatusChange) onAgentStatusChange(c); });
    s.on("monitoring:status", (d) => {
      setIsMonitoring(Boolean(d?.isMonitoring));
      setIsAgentConnected(Boolean(d?.isAgentConnected));
      if (d?.currentApp) setCurrentApp(d.currentApp);
      if (d?.stats) { setStats(d.stats); if (onStatsUpdate) onStatsUpdate(d.stats); }
    });
    s.on("activity:current", (d) => {
      setIsAgentConnected(Boolean(d?.isAgentConnected));
      if (d?.currentApp) setCurrentApp(d.currentApp);
      if (d?.stats) { setStats(d.stats); if (onStatsUpdate) onStatsUpdate(d.stats); }
    });
    s.on("activity:changed", (d) => {
      if (d?.stats) { setStats(d.stats); if (onStatsUpdate) onStatsUpdate(d.stats); }
      if (d?.currentAppData) setCurrentApp(d.currentAppData);
      if (d?.previousApp) {
        setActivityFeed(prev => [{ app: d.previousApp, dur: d.durationSeconds, time: new Date(), id: Date.now() }, ...prev.slice(0, 19)]);
      }
    });
    s.on("monitoring:started", () => setIsMonitoring(true));
    s.on("monitoring:stopped", () => { setIsMonitoring(false); setCurrentApp(null); setLiveSeconds(0); });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!currentApp?.start_time) return;
    const t = setInterval(() => {
      setLiveSeconds(Math.max(0, Math.floor((Date.now() - new Date(currentApp.start_time).getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [currentApp]);

  const handleStart = async () => {
    const token = localStorage.getItem("token"); setLoading(true);
    try {
      const res = await fetch(`${API_MONITORING}/start`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (res.ok) { const d = await res.json(); setIsMonitoring(true); if (socket) socket.emit("client:start_monitoring", d.session); if (onSessionStart) onSessionStart(d.session); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleStop = async () => {
    const token = localStorage.getItem("token"); setLoading(true);
    try {
      const res = await fetch(`${API_MONITORING}/stop`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentApp })
      });
      if (res.ok) { const d = await res.json(); setIsMonitoring(false); setCurrentApp(null); setLiveSeconds(0); if (socket) socket.emit("client:stop_monitoring"); if (onSessionStop) onSessionStop(d.analytics); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const KPI_STATS = [
    { icon: Clock, label: "Session Time", val: fmt(sessionSeconds), color: "#3b82f6", glow: "rgba(59,130,246,0.25)" },
    { icon: ArrowRightLeft, label: "App Switches", val: stats.totalSwitches || 0, color: "#f59e0b", glow: "rgba(245,158,11,0.25)" },
    { icon: Layers, label: "Unique Apps", val: stats.uniqueApps || 0, color: "#8b5cf6", glow: "rgba(139,92,246,0.25)" },
    { icon: TrendingUp, label: "Active Time", val: fmtMins(stats.activeTime), color: "#10b981", glow: "rgba(16,185,129,0.25)" },
    { icon: TrendingDown, label: "Idle Time", val: fmtMins(stats.idleTime), color: "#ef4444", glow: "rgba(239,68,68,0.25)" },
    { icon: Target, label: "Focus Score", val: `${focusPct}%`, color: "#06b6d4", glow: "rgba(6,182,212,0.25)" },
  ];

  return (
    <div className="avPage">
      {/* ── PAGE HEADER ── */}
      <div className="avPageHeader">
        <div className="avPageHeaderLeft">
          <div className="avPageIconBadge">
            <Activity size={22} />
          </div>
          <div>
            <h2 className="avPageTitle">Activity Monitor</h2>
            <p className="avPageSub">
              <Radio size={11} style={{ display: "inline", marginRight: 5 }} />
              Real-time Windows foreground application tracking &amp; productivity intelligence
            </p>
          </div>
        </div>
        <div className="avPageHeaderRight">
          {/* Agent status pill */}
          <div className={`avAgentPill ${isAgentConnected ? "avAgentOnline" : "avAgentOffline"}`}>
            {isAgentConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isAgentConnected ? "Agent Online" : "Agent Offline"}</span>
            <span className={`avAgentDot ${isAgentConnected ? "dotGreen" : "dotRed"}`} />
          </div>
          {/* Start / Stop button */}
          {isMonitoring ? (
            <button className="avControlBtn avStopBtn" onClick={handleStop} disabled={loading}>
              <Square size={14} />
              <span>Stop Monitoring</span>
            </button>
          ) : (
            <button
              className={`avControlBtn avStartBtn ${(!isAgentConnected || loading) ? "avBtnDim" : ""}`}
              onClick={handleStart}
              disabled={loading || !isAgentConnected}
            >
              <Play size={14} />
              <span>{loading ? "Starting…" : "Start Monitoring"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="avKpiStrip">
        {KPI_STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div className="avKpiCard" key={i} style={{ "--kpi-glow": s.glow }}>
              <div className="avKpiIconBox" style={{ background: s.color + "18", color: s.color }}>
                <Icon size={17} />
              </div>
              <div className="avKpiInfo">
                <span className="avKpiVal" style={{ color: s.color }}>{s.val}</span>
                <span className="avKpiLabel">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="avGrid">
        {/* ── COL 1: Current App + Feed ── */}
        <div className="avCol1">
          {/* Current App Panel */}
          <div className="avCard avCurrentCard">
            <div className="avCardHeader">
              <div className="avCardHeaderLeft">
                <span className={`avLiveDot ${isMonitoring ? "dotPulseGreen" : "dotGrey"}`} />
                <span>{isMonitoring ? "Currently Active" : "Monitor Inactive"}</span>
              </div>
              <span className="avLiveBadge">{isMonitoring ? "● LIVE" : "● IDLE"}</span>
            </div>

            {isMonitoring && currentApp ? (
              <div className="avCurrentInner">
                <div
                  className="avAppAvatar"
                  style={{ background: `linear-gradient(135deg, ${appColor(currentApp.app_name)}, ${appColor(currentApp.app_name)}99)` }}
                >
                  {appInitial(currentApp.app_name)}
                </div>
                <div className="avCurrentDetails">
                  <h3 className="avCurrentAppName">{currentApp.app_name}</h3>
                  {currentApp.window_title && (
                    <p className="avCurrentWindow">{currentApp.window_title.slice(0, 60)}</p>
                  )}
                  <div className="avCurrentMeta">
                    <div className="avCurrentTimer">
                      <Clock size={12} />
                      <span className="avTimerDigits">{fmt(liveSeconds)}</span>
                    </div>
                    {currentApp.productivity && (
                      <div className={`avProdBadge ${currentApp.productivity.productive ? "avProdGreen" : "avProdRed"}`}>
                        <Brain size={11} />
                        <span>{currentApp.productivity.label}</span>
                        <strong>{currentApp.productivity.confidence}%</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="avIdleState">
                <div className="avIdleIconWrap">
                  <Monitor size={32} />
                </div>
                <p className="avIdleMsg">
                  {isAgentConnected
                    ? "Monitoring paused — click Start Monitoring above to begin tracking."
                    : "Windows agent not connected. Launch the background agent to enable live tracking."}
                </p>
                {!isMonitoring && isAgentConnected && (
                  <button className="avStartBtn avControlBtn" onClick={handleStart} disabled={loading}>
                    <Play size={13} />
                    <span>Start Now</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Live Switch Feed */}
          <div className="avCard avFeedCard">
            <div className="avCardHeader">
              <ArrowRightLeft size={14} style={{ color: "#3b82f6" }} />
              <span>Live App Switch Feed</span>
              {activityFeed.length > 0 && (
                <span className="avFeedCount">{activityFeed.length} switches</span>
              )}
            </div>
            {activityFeed.length === 0 ? (
              <div className="avFeedEmpty">
                <Eye size={28} style={{ color: "rgba(57,119,255,0.25)", marginBottom: 10 }} />
                <p>App switches appear here in real-time once monitoring starts.</p>
              </div>
            ) : (
              <div className="avFeedList">
                {activityFeed.map((item) => (
                  <div className="avFeedItem" key={item.id}>
                    <div className="avFeedAvatar" style={{ background: appColor(item.app) + "22", color: appColor(item.app) }}>
                      {appInitial(item.app)}
                    </div>
                    <div className="avFeedInfo">
                      <strong>{item.app}</strong>
                      <small>{item.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {fmtMins(item.dur)}</small>
                    </div>
                    <span className="avFeedDur">{fmtMins(item.dur)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── COL 2: Top Apps ── */}
        <div className="avCol2">
          <div className="avCard avTopAppsCard">
            <div className="avCardHeader">
              <BarChart2 size={14} style={{ color: "#8b5cf6" }} />
              <span>Top Apps by Usage Today</span>
              <span className="avFeedCount">{DEMO_APPS.length} apps</span>
            </div>
            <div className="avTopAppsList">
              {DEMO_APPS.sort((a, b) => b.dur - a.dur).map((app, i) => {
                const pct = Math.round((app.dur / maxDur) * 100);
                const isProductive = app.prod === "Productive";
                return (
                  <div className="avAppRow" key={i}>
                    <span className="avAppRank">#{i + 1}</span>
                    <div
                      className="avAppIcon"
                      style={{ background: appColor(app.app) + "22", color: appColor(app.app) }}
                    >
                      {appInitial(app.app)}
                    </div>
                    <div className="avAppDetails">
                      <div className="avAppRowTop">
                        <span className="avAppName">{app.app}{app.url !== "-" && <small className="avAppUrl"> · {app.url}</small>}</span>
                        <span className="avAppTime">{fmtMins(app.dur)}</span>
                      </div>
                      <div className="avProgressTrack">
                        <div
                          className="avProgressFill"
                          style={{ width: `${pct}%`, background: isProductive ? "linear-gradient(90deg, #10b981, #06b6d4)" : "linear-gradient(90deg, #ef4444, #f59e0b)" }}
                        />
                      </div>
                    </div>
                    <span className={`avCatTag ${isProductive ? "catGreen" : "catRed"}`}>
                      {app.cat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── COL 3: Heatmap + Donut ── */}
        <div className="avCol3">
          {/* Productivity Donut */}
          <div className="avCard avDonutCard">
            <div className="avCardHeader">
              <Target size={14} style={{ color: "#10b981" }} />
              <span>Today's Focus Split</span>
            </div>
            <div className="avDonutWrap">
              <svg viewBox="0 0 140 140" className="avDonutSvg">
                <defs>
                  <linearGradient id="prodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="20" />
                <circle cx="70" cy="70" r="50" fill="none" stroke="url(#prodGrad)" strokeWidth="20"
                  strokeDasharray={`${(focusPct / 100) * 314} 314`}
                  strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dasharray 1.2s ease" }} />
                <text x="70" y="64" textAnchor="middle" fontSize="22" fontWeight="900" fill="#10b981">{focusPct}%</text>
                <text x="70" y="80" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">Productive</text>
              </svg>
              <div className="avDonutLegend">
                <div className="avDonutItem">
                  <span className="avDonutDot" style={{ background: "#10b981" }} />
                  <div>
                    <strong style={{ color: "#10b981" }}>{Math.round(prodDemo / 60)}m</strong>
                    <span>Productive</span>
                  </div>
                </div>
                <div className="avDonutItem">
                  <span className="avDonutDot" style={{ background: "#ef4444" }} />
                  <div>
                    <strong style={{ color: "#ef4444" }}>{Math.round((totalDemo - prodDemo) / 60)}m</strong>
                    <span>Distraction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Heatmap */}
          <div className="avCard avHeatmapCard">
            <div className="avCardHeader">
              <Cpu size={14} style={{ color: "#f59e0b" }} />
              <span>Weekly Activity Heatmap</span>
            </div>
            <div className="avHeatmapWrap">
              <div className="avHeatColLabels">
                <div className="avHeatBlank" />
                {HEAT_COLS.map((c, i) => <span key={i} className="avHeatColLabel">{c}</span>)}
              </div>
              {HEAT_ROWS.map((row, ri) => (
                <div className="avHeatRow" key={ri}>
                  <span className="avHeatRowLabel">{row}</span>
                  {HEAT_DATA[ri].map((val, ci) => (
                    <div
                      key={ci}
                      className="avHeatCell"
                      style={{ background: heatColor(val, HEAT_MAX) }}
                      title={`${row} ${HEAT_COLS[ci]}: ${Math.round(val)}m activity`}
                    />
                  ))}
                </div>
              ))}
              <div className="avHeatLegend">
                <span>Less</span>
                {["rgba(57,119,255,0.05)", "rgba(57,119,255,0.18)", "rgba(57,119,255,0.38)", "rgba(57,119,255,0.62)", "#3977ff"].map((c, i) => (
                  <div key={i} className="avHeatLegCell" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityView;
