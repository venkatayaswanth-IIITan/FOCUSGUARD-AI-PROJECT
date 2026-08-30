import { useEffect, useState } from "react";
import {
  Flame, Play, Square, Target, Trophy, Clock, Zap, TrendingUp,
  CheckCircle, Calendar, BarChart2, RefreshCw, Download, Trash2,
  Plus, Timer, Brain, Star, Layers, ArrowRight, Activity,
} from "lucide-react";
import SessionAnalytics from "./SessionAnalytics";
import { API_MONITORING } from "../services/api";

const API = API_MONITORING;

function fmt(s) {
  const secs = Number(s || 0), h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${secs % 60}s`;
}
function fmtDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────────────────────────────
   POMODORO TIMER
───────────────────────────────────────────── */
function PomodoroTimer() {
  const MODES = {
    focus:  { secs: 25 * 60, label: "Deep Focus",   color: "#ef4444", glow: "rgba(239,68,68,0.35)" },
    short:  { secs: 5 * 60,  label: "Short Break",  color: "#10b981", glow: "rgba(16,185,129,0.35)" },
    long:   { secs: 15 * 60, label: "Long Break",   color: "#8b5cf6", glow: "rgba(139,92,246,0.35)" },
  };
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(MODES.focus.secs);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { setRunning(false); setCycles(c => c + 1); return MODES[mode].secs; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode]);

  const switchMode = (m) => { setMode(m); setRunning(false); setRemaining(MODES[m].secs); };
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = ((MODES[mode].secs - remaining) / MODES[mode].secs) * 100;
  const R = 80, CX = 100, CY = 100;
  const circ = 2 * Math.PI * R;
  const { color, glow, label } = MODES[mode];

  return (
    <div className="fsTimerCard">
      {/* Mode Tabs */}
      <div className="fsModeTabs">
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            className={`fsModeTab ${mode === key ? "fsModeTabActive" : ""}`}
            style={mode === key ? { "--tab-color": cfg.color } : {}}
            onClick={() => switchMode(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* SVG Ring Timer */}
      <div className="fsTimerRingWrap" style={{ "--ring-glow": glow }}>
        <svg width="200" height="200" viewBox="0 0 200 200" className="fsTimerSvg">
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color + "99"} />
            </linearGradient>
            <filter id="timerGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          {/* Progress */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={`url(#timerGrad)`}
            strokeWidth="12"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            filter="url(#timerGlow)"
            style={{ transition: "stroke-dasharray 0.9s ease" }}
          />
          {/* Time */}
          <text x={CX} y={CY - 10} textAnchor="middle" fontSize="34" fontWeight="900" fill={color} fontFamily="Inter, monospace">
            {mm}:{ss}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="Inter">
            {label.toUpperCase()}
          </text>
          <text x={CX} y={CY + 28} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="Inter">
            {cycles} cycles today
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="fsTimerControls">
        <button
          className="fsTimerBtn fsTimerBtnMain"
          style={{ "--btn-color": color, "--btn-glow": glow }}
          onClick={() => setRunning(!running)}
        >
          {running ? <><Square size={15} /> Pause</> : <><Play size={15} /> {remaining === MODES[mode].secs ? "Start" : "Resume"}</>}
        </button>
        <button
          className="fsTimerBtn fsTimerBtnReset"
          onClick={() => { setRunning(false); setRemaining(MODES[mode].secs); }}
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Cycle dots */}
      <div className="fsTimerCycles">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`fsCycleDot ${i < cycles % 4 ? "fsCycleDotFull" : ""}`} style={{ "--dot-color": color }} />
        ))}
        <span className="fsCycleHint">Pomodoro Cycle {Math.floor(cycles / 4) + 1}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STREAK CALENDAR
───────────────────────────────────────────── */
function StreakCalendar({ sessions }) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (27 - i));
    const key = d.toISOString().split("T")[0];
    return { date: d, active: sessions.some(s => s.started_at?.startsWith(key)) };
  });

  return (
    <div className="fsStreakGrid">
      {days.map((d, i) => (
        <div
          key={i}
          className={`fsStreakCell ${d.active ? "fsStreakCellOn" : ""}`}
          title={`${d.date.toLocaleDateString()} ${d.active ? "— session recorded" : "— no session"}`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN VIEW
───────────────────────────────────────────── */
function FocusSessionsView({ activeSession, onStartSession, onStopSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const token = localStorage.getItem("token");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSessions(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [activeSession]);

  const handleDelete = async (id) => {
    if (!confirm(`Delete Session #${id}?`)) return;
    try {
      const res = await fetch(`${API}/session/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setSessions(p => p.filter(s => s.id !== id)); setActionMsg(`Session #${id} deleted.`); setTimeout(() => setActionMsg(""), 3000); }
    } catch (e) { console.error(e); }
  };

  const handleViewAnalytics = async (id) => {
    try {
      const res = await fetch(`${API}/session/${id}/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSelectedAnalytics(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleExport = (session) => {
    const blob = new Blob([JSON.stringify({ sessionId: session.id, ...session, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `FocusGuard_Session_${session.id}.json` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setActionMsg(`Exported Session #${session.id}`); setTimeout(() => setActionMsg(""), 3000);
  };

  const filtered = sessions.filter(s => filter === "all" || s.status === filter);
  const completed = sessions.filter(s => s.status === "completed");
  const totalActive = sessions.reduce((a, s) => a + Number(s.active_secs || 0), 0);
  const totalSwitches = sessions.reduce((a, s) => a + Number(s.switch_count || 0), 0);

  const KPI = [
    { icon: Calendar, label: "Total Sessions", val: sessions.length, color: "#3b82f6", glow: "rgba(59,130,246,0.25)" },
    { icon: CheckCircle, label: "Completed", val: completed.length, color: "#10b981", glow: "rgba(16,185,129,0.25)" },
    { icon: Clock, label: "Total Focus Time", val: fmt(totalActive), color: "#8b5cf6", glow: "rgba(139,92,246,0.25)" },
    { icon: Zap, label: "App Switches", val: totalSwitches, color: "#f59e0b", glow: "rgba(245,158,11,0.25)" },
    { icon: Trophy, label: "Active Streak", val: `${completed.length} days`, color: "#ef4444", glow: "rgba(239,68,68,0.25)" },
  ];

  return (
    <div className="fsPage">
      {/* ── Page Header ── */}
      <div className="fsPageHeader">
        <div className="fsPageHeaderLeft">
          <div className="fsPageIconBadge">
            <Flame size={22} />
          </div>
          <div>
            <h2 className="fsPageTitle">Focus Sessions</h2>
            <p className="fsPageSub">Deep work sprints, Pomodoro timer, streaks &amp; session analytics</p>
          </div>
        </div>
        <div className="fsPageHeaderRight">
          {activeSession ? (
            <button className="fsControlBtn fsStopBtn" onClick={onStopSession}>
              <Square size={14} /> Stop Session
            </button>
          ) : (
            <button className="fsControlBtn fsStartBtn" onClick={onStartSession}>
              <Plus size={14} /> New Session
            </button>
          )}
          <button className="fsControlBtn fsOutlineBtn" onClick={fetchSessions}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Action Banner ── */}
      {actionMsg && (
        <div className="fsActionBanner">
          <CheckCircle size={14} /> {actionMsg}
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="fsKpiStrip">
        {KPI.map((k, i) => {
          const Icon = k.icon;
          return (
            <div className="fsKpiCard" key={i} style={{ "--kpi-glow": k.glow }}>
              <div className="fsKpiIconBox" style={{ background: k.color + "18", color: k.color }}>
                <Icon size={18} />
              </div>
              <div>
                <div className="fsKpiVal" style={{ color: k.color }}>{k.val}</div>
                <div className="fsKpiLabel">{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="fsGrid">
        {/* LEFT COLUMN */}
        <div className="fsLeftCol">
          <PomodoroTimer />

          {/* Streak Calendar */}
          <div className="fsCard fsStreakCard">
            <div className="fsCardHeader">
              <Trophy size={14} style={{ color: "#f59e0b" }} />
              <span>28-Day Consistency Streak</span>
              <span className="fsStreakBadge">{completed.length} / 28 days</span>
            </div>
            <div className="fsCardBody">
              <StreakCalendar sessions={sessions} />
              <p className="fsStreakHint">
                <span className="fsStreakDotLegend" />
                Day with session recorded
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="fsCard fsTipsCard">
            <div className="fsCardHeader">
              <Brain size={14} style={{ color: "#8b5cf6" }} />
              <span>Focus Techniques</span>
            </div>
            <div className="fsTipsList">
              {[
                { icon: Timer, color: "#ef4444", text: "25/5 Pomodoro — ideal for task sprints" },
                { icon: Brain, color: "#8b5cf6", text: "50/10 rule — optimal for deep coding" },
                { icon: Star, color: "#f59e0b", text: "52/17 — clinically proven peak alertness" },
                { icon: Activity, color: "#10b981", text: "90-min blocks — best for creative work" },
              ].map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div className="fsTipRow" key={i}>
                    <div className="fsTipIcon" style={{ background: tip.color + "18", color: tip.color }}>
                      <Icon size={13} />
                    </div>
                    <span>{tip.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Session History */}
        <div className="fsRightCol">
          <div className="fsCard fsHistoryCard">
            {/* History Header */}
            <div className="fsHistoryHeader">
              <div className="fsCardHeader">
                <BarChart2 size={14} style={{ color: "#3b82f6" }} />
                <span>Session History</span>
                <span className="fsSessionCountBadge">{filtered.length} sessions</span>
              </div>
              {/* Filter Chips */}
              <div className="fsFilterRow">
                {[["all", "All"], ["active", "Live"], ["completed", "Completed"]].map(([v, l]) => (
                  <button
                    key={v}
                    className={`fsFilterChip ${filter === v ? "fsFilterChipActive" : ""}`}
                    onClick={() => setFilter(v)}
                  >
                    {v === "active" && <span className="fsLiveDot" />}
                    {l}
                    <span className="fsFilterCount">{sessions.filter(s => v === "all" || s.status === v).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table / Empty / Loading */}
            {loading ? (
              <div className="fsLoadingState">
                <RefreshCw size={20} className="fsSpin" />
                <span>Loading sessions…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="fsEmptyState">
                <div className="fsEmptyIconWrap">
                  <Flame size={32} />
                </div>
                <p>No sessions found. Start your first deep work session!</p>
                <button className="fsControlBtn fsStartBtn" onClick={onStartSession}>
                  <Play size={13} /> Start Now
                </button>
              </div>
            ) : (
              <div className="fsTableWrap">
                <table className="fsTable">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Duration</th>
                      <th>Active / Idle</th>
                      <th>Apps</th>
                      <th>Switches</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className={s.status === "active" ? "fsActiveRow" : ""}>
                        <td><span className="fsRowId">#{s.id}</span></td>
                        <td>
                          <span className={`fsStatusPill ${s.status === "active" ? "fsStatusLive" : "fsStatusDone"}`}>
                            {s.status === "active"
                              ? <><span className="fsLiveDot fsLiveDotSm" />Live</>
                              : <><CheckCircle size={10} />Done</>
                            }
                          </span>
                        </td>
                        <td className="fsDateCell">{fmtDate(s.started_at)}</td>
                        <td><strong className="fsDuration">{fmt(s.total_duration_seconds)}</strong></td>
                        <td>
                          <div className="fsSplitCell">
                            <span className="fsSplitGreen">↑ {fmt(s.active_secs)}</span>
                            <span className="fsSplitAmber">⏸ {fmt(s.idle_secs)}</span>
                          </div>
                        </td>
                        <td><span className="fsAppCount">{s.app_count || 0}</span></td>
                        <td><span className="fsSwitchPill">{s.switch_count || 0}</span></td>
                        <td>
                          <div className="fsActionBtns">
                            <button className="fsActionBtn fsActionAnalyticsBtn" title="Analytics" onClick={() => handleViewAnalytics(s.id)}>
                              <BarChart2 size={13} />
                            </button>
                            <button className="fsActionBtn fsActionExportBtn" title="Export JSON" onClick={() => handleExport(s)}>
                              <Download size={13} />
                            </button>
                            <button className="fsActionBtn fsActionDeleteBtn" title="Delete" onClick={() => handleDelete(s.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAnalytics && (
        <SessionAnalytics analytics={selectedAnalytics} onClose={() => setSelectedAnalytics(null)} />
      )}
    </div>
  );
}

export default FocusSessionsView;
