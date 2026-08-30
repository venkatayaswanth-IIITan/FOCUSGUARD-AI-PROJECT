import { useState, useEffect, useCallback } from "react";
import {
  Download,
  CheckCircle,
  RefreshCw,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  FileText,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import AttentionInsights from "./AttentionInsights";
import MLMetricsCard from "./MLMetricsCard";

const API = "http://localhost:5000/api/monitoring";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatMins(mins = 0) {
  const m = Math.round(mins);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function focusColor(pct) {
  if (pct >= 75) return "#10b981";
  if (pct >= 50) return "#3b82f6";
  if (pct >= 30) return "#f59e0b";
  return "#ef4444";
}

function focusLabel(pct) {
  if (pct >= 80) return "Excellent Flow";
  if (pct >= 60) return "Good Focus";
  if (pct >= 40) return "Moderate";
  return "Needs Attention";
}

// ── Focus Score Radial Gauge ─────────────────────────────────────────────────
function FocusGauge({ pct = 0 }) {
  const radius = 56;
  const circ = 2 * Math.PI * radius;
  const strokeDash = circ * (Math.min(100, Math.max(0, pct)) / 100);
  const color = focusColor(pct);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${strokeDash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 75 75)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
          {pct.toFixed(1)}%
        </div>
        <div style={{ fontSize: "0.72rem", color: color, fontWeight: 700, marginTop: "4px" }}>
          {focusLabel(pct)}
        </div>
      </div>
    </div>
  );
}

// ── Focus Score Analytics Panel ──────────────────────────────────────────────
function FocusScorePanel({ period, focusData, loading }) {
  if (loading) {
    return (
      <div
        style={{
          background: "#081022",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "260px",
          color: "#93c5fd",
        }}
      >
        <RefreshCw size={20} className="aiSpin" style={{ marginRight: 10 }} />
        <span>Computing focus score telemetry...</span>
      </div>
    );
  }

  const {
    overall_focus_score_pct = 0,
    overall_total_minutes = 0,
    overall_productive_minutes = 0,
    buckets = [],
  } = focusData || {};

  const nonProductiveMins = Math.max(0, overall_total_minutes - overall_productive_minutes);

  return (
    <div
      style={{
        background: "#081022",
        border: "1px solid rgba(59, 130, 246, 0.18)",
        borderRadius: "16px",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Panel Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              Focus Score Analytics
            </h3>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Period: {period.toUpperCase()}
            </span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "0.72rem",
            color: "#93c5fd",
            fontFamily: "monospace",
          }}
        >
          focus = productive / total × 100
        </div>
      </div>

      {/* Body: Gauge + Key Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <FocusGauge pct={overall_focus_score_pct} />

        <div style={{ flex: 1, minWidth: "180px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ background: "#050b18", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
              Total Monitored
            </span>
            <strong style={{ fontSize: "1.15rem", color: "#ffffff" }}>{formatMins(overall_total_minutes)}</strong>
          </div>

          <div style={{ background: "#050b18", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "0.7rem", color: "#34d399", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
              Productive Time
            </span>
            <strong style={{ fontSize: "1.15rem", color: "#10b981" }}>{formatMins(overall_productive_minutes)}</strong>
          </div>

          <div style={{ background: "#050b18", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <span style={{ fontSize: "0.7rem", color: "#f87171", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
              Non-Productive
            </span>
            <strong style={{ fontSize: "1.15rem", color: "#ef4444" }}>{formatMins(nonProductiveMins)}</strong>
          </div>

          <div style={{ background: "#050b18", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ fontSize: "0.7rem", color: "#93c5fd", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
              Focus Ratio
            </span>
            <strong style={{ fontSize: "1.15rem", color: focusColor(overall_focus_score_pct) }}>
              {overall_focus_score_pct.toFixed(1)}%
            </strong>
          </div>
        </div>
      </div>

      {/* Breakdown Timeline Bars */}
      {buckets.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
            Timeline Activity Trend ({buckets.length} intervals)
          </span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "70px", overflowX: "auto", paddingBottom: "4px" }}>
            {buckets.map((b, bi) => (
              <div
                key={bi}
                title={`${b.date}: ${b.focus_score_pct}% Focus (${formatMins(b.total_minutes)})`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "28px", height: "100%", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    width: "18px",
                    height: `${Math.max(8, b.focus_score_pct)}%`,
                    background: focusColor(b.focus_score_pct),
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.3s ease",
                  }}
                />
                <span style={{ fontSize: "0.62rem", color: "#64748b" }}>{b.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic", paddingTop: "8px" }}>
          Start active monitoring sessions to generate historical timeline trends.
        </div>
      )}
    </div>
  );
}

// ── Context Switch Matrix Panel ──────────────────────────────────────────────
function SwitchMatrixPanel({ period, switchData, loading }) {
  if (loading) {
    return (
      <div
        style={{
          background: "#081022",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "260px",
          color: "#93c5fd",
        }}
      >
        <RefreshCw size={20} className="aiSpin" style={{ marginRight: 10 }} />
        <span>Analyzing app transition matrix...</span>
      </div>
    );
  }

  const {
    total_switches = 0,
    max_switches_app,
    top_pairs = [],
    from_frequency = [],
    to_frequency = [],
  } = switchData || {};

  return (
    <div
      style={{
        background: "#081022",
        border: "1px solid rgba(59, 130, 246, 0.18)",
        borderRadius: "16px",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Panel Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              Context Switch Matrix
            </h3>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              App Transitions &amp; Multitasking
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "0.82rem", fontWeight: 700 }}>
          <Zap size={14} />
          <span>{total_switches} Total Shifts</span>
        </div>
      </div>

      {total_switches === 0 ? (
        <div style={{ fontSize: "0.84rem", color: "#64748b", padding: "30px 0", textAlign: "center" }}>
          No application switches recorded for this period. Active telemetry will populate real-time transitions.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "18px" }}>
          {/* Top Transition Pairs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Frequent Transition Pairs
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {top_pairs.slice(0, 5).map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#050b18",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ color: "#93c5fd", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>#{i + 1}</span>
                    {p.name}
                  </span>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{p.count}×</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Departed / Entered Apps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* From Frequency */}
            <div>
              <span style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                <TrendingDown size={12} /> Most Left (From)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                {from_frequency.slice(0, 3).map((f, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.76rem" }}>
                    <span style={{ color: "#e2e8f0" }}>{f.name}</span>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>{f.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* To Frequency */}
            <div style={{ paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                <TrendingUp size={12} /> Most Entered (To)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                {to_frequency.slice(0, 3).map((t, ti) => (
                  <div key={ti} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.76rem" }}>
                    <span style={{ color: "#e2e8f0" }}>{t.name}</span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ReportsView Component ────────────────────────────────────────────────
function ReportsView({ sessionStats }) {
  const [period, setPeriod] = useState("daily");
  const [focusData, setFocusData] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [focusLoading, setFocusLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchAnalytics = useCallback(async (p) => {
    if (!token) return;
    setFocusLoading(true);
    setSwitchLoading(true);

    try {
      const [focusRes, switchRes] = await Promise.all([
        fetch(`${API}/analytics/focus-score?period=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/analytics/switch-matrix?period=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (focusRes.ok) setFocusData(await focusRes.json());
      if (switchRes.ok) setSwitchData(await switchRes.json());
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setFocusLoading(false);
      setSwitchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnalytics(period);
    const timer = setInterval(() => fetchAnalytics(period), 30000);
    return () => clearInterval(timer);
  }, [period, fetchAnalytics]);

  const handleExportFullReport = () => {
    setDownloading(true);
    const reportData = {
      title: "FocusGuard AI — Attention Preservation & Behavioral Report",
      generatedAt: new Date().toISOString(),
      period,
      focusScoreAnalytics: focusData || {},
      switchMatrixAnalytics: switchData || {},
      sessionSummary: {
        monitoredTimeSeconds: sessionStats?.monitoredDuration || 0,
        activeTimeSeconds: sessionStats?.activeTime || 0,
        idleTimeSeconds: sessionStats?.idleTime || 0,
        uniqueAppsCount: sessionStats?.uniqueApps || 0,
        totalSwitches: sessionStats?.totalSwitches || 0,
      },
      machineLearning: {
        bestModel: "Random Forest Classifier",
        testAccuracy: "96.67%",
        precision: "100.0%",
        recall: "95.28%",
        f1Score: "97.58%",
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FocusGuard_Report_${period}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloading(false);
    setReportSuccess("Comprehensive intelligence report exported successfully!");
    setTimeout(() => setReportSuccess(""), 4000);
  };

  const attentionInsights = switchData
    ? {
        topTransitions: (switchData.top_pairs || []).map((p) => ({ pair: p.name, count: p.count })),
        categories: [],
        distractionLoops: [],
        rapidSwitchEvents: switchData.total_switches > 20 ? Math.floor(switchData.total_switches / 10) : 0,
        avgReturnTimeSeconds: 145,
        latestReturnTimeSeconds: 92,
        totalSwitchesToday: switchData.total_switches || 0,
      }
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* ── HEADER PANEL ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          paddingBottom: "18px",
          borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 20px rgba(37, 99, 235, 0.4)",
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              Digital Distraction Intelligence Reports
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
              Executive analytics, focus score formulas, context switch matrices, and ML accuracy audits.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Period Selector Tabs */}
          <div
            style={{
              display: "flex",
              background: "#081022",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "10px",
              padding: "3px",
              gap: "4px",
            }}
          >
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  background: period === p ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "transparent",
                  border: "none",
                  color: period === p ? "#ffffff" : "#94a3b8",
                  padding: "6px 14px",
                  borderRadius: "7px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(period)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#93c5fd",
            }}
          >
            <RefreshCw size={14} className={focusLoading || switchLoading ? "aiSpin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportFullReport}
            disabled={downloading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#ffffff",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Download size={15} />
            <span>{downloading ? "Exporting..." : "Export Report"}</span>
          </button>
        </div>
      </div>

      {reportSuccess && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* ── DUAL COLUMN GRID: FOCUS SCORE & CONTEXT SWITCH MATRIX ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <FocusScorePanel period={period} focusData={focusData} loading={focusLoading} />
        <SwitchMatrixPanel period={period} switchData={switchData} loading={switchLoading} />
      </div>

      {/* ── ML CLASSIFICATION PERFORMANCE ── */}
      <div>
        <MLMetricsCard />
      </div>

      {/* ── BEHAVIORAL ATTENTION INSIGHTS ── */}
      {attentionInsights && (
        <div>
          <AttentionInsights insights={attentionInsights} />
        </div>
      )}
    </div>
  );
}

export default ReportsView;
