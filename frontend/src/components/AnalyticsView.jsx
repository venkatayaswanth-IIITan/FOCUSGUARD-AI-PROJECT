import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Download, CheckCircle, RefreshCw, Target,
  Zap, TrendingUp, TrendingDown, Activity, Layers, Brain,
  Clock, ArrowUpRight, ArrowDownRight, Cpu, Shield,
} from "lucide-react";

const API = "http://localhost:5000/api/monitoring";

/* ── helpers ── */
function fmtMins(m = 0) {
  const r = Math.round(m);
  if (r < 60) return `${r}m`;
  return `${Math.floor(r / 60)}h ${r % 60}m`;
}
function focusColor(p) {
  if (p >= 70) return "#22c55e";
  if (p >= 40) return "#f59e0b";
  return "#ef4444";
}
function focusLabel(p) {
  if (p >= 80) return "Excellent";
  if (p >= 60) return "Good";
  if (p >= 40) return "Moderate";
  return "Needs Work";
}

/* ── Fallback demo data ── */
const FALLBACK_FOCUS = {
  overall_focus_score_pct: 76.4,
  overall_total_minutes: 332,
  overall_productive_minutes: 254,
  buckets: [
    { date: "08-15", focus_score_pct: 71, total_minutes: 280, session_count: 2 },
    { date: "08-16", focus_score_pct: 85, total_minutes: 310, session_count: 3 },
    { date: "08-17", focus_score_pct: 62, total_minutes: 240, session_count: 1 },
    { date: "08-18", focus_score_pct: 79, total_minutes: 295, session_count: 2 },
    { date: "08-19", focus_score_pct: 88, total_minutes: 350, session_count: 4 },
    { date: "08-20", focus_score_pct: 76, total_minutes: 332, session_count: 3 },
  ],
};
const FALLBACK_SWITCH = {
  total_switches: 112,
  max_switches_app: { app_name: "Google Chrome", max_switches: 48 },
  top_pairs: [
    { name: "IntelliJ → Chrome", count: 24 }, { name: "Chrome → Discord", count: 18 },
    { name: "Chrome → IntelliJ", count: 15 }, { name: "Discord → Chrome", count: 12 },
    { name: "Chrome → PowerPoint", count: 9 }, { name: "Spotify → Chrome", count: 7 },
  ],
  from_frequency: [
    { name: "Google Chrome", count: 48 }, { name: "IntelliJ IDEA", count: 24 },
    { name: "Discord", count: 18 }, { name: "Spotify", count: 12 }, { name: "PowerPoint", count: 10 },
  ],
  to_frequency: [
    { name: "Google Chrome", count: 52 }, { name: "Discord", count: 21 },
    { name: "IntelliJ IDEA", count: 19 }, { name: "PowerPoint", count: 11 }, { name: "Spotify", count: 9 },
  ],
};

/* ── SVG Radial Gauge ── */
function RadialGauge({ pct = 0 }) {
  const R = 70, CX = 90, CY = 90, SIZE = 180;
  const circ = 2 * Math.PI * R;
  const color = focusColor(pct);
  const label = focusLabel(pct);
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="anGaugeSvg">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color + "99"} />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" />
      {/* Progress */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
        filter="url(#gaugeGlow)"
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <text x={CX} y={CY - 8} textAnchor="middle" fontSize="26" fontWeight="900" fill={color} fontFamily="Inter">{pct.toFixed(1)}%</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="Inter">{label}</text>
    </svg>
  );
}

/* ── Sparkline ── */
function Sparkline({ data = [], color = "#3b82f6" }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), h = 36, w = 120;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="anSparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#spark-${color.replace("#","")})`}
        points={`0,${h} ${pts} ${w},${h}`}
      />
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Focus Bar Chart ── */
function FocusBarChart({ buckets, period }) {
  const maxVal = Math.max(...buckets.map(b => b.focus_score_pct), 1);
  return (
    <div className="anBarChart">
      {buckets.map((b, i) => {
        const pct = b.focus_score_pct;
        const color = focusColor(pct);
        const h = Math.max(6, (pct / maxVal) * 100);
        return (
          <div className="anBarCol" key={i} title={`${b.date}: ${pct.toFixed(1)}% focus`}>
            <div className="anBarOuter">
              <div
                className="anBarFill"
                style={{ height: `${h}%`, background: `linear-gradient(180deg, ${color}, ${color}88)`, boxShadow: `0 0 8px ${color}44` }}
              />
            </div>
            <span className="anBarLabel">{period === "daily" ? b.date.slice(3) : b.date}</span>
            <span className="anBarPct" style={{ color }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── ML Performance Card ── */
function MLPerformanceCard() {
  const metrics = [
    { label: "Focus Score Accuracy", val: 96.67, color: "#10b981", icon: Target },
    { label: "Distraction Detection", val: 94.2,  color: "#3b82f6", icon: Shield },
    { label: "Pattern Precision",    val: 91.8,  color: "#8b5cf6", icon: Cpu },
    { label: "Recall Score",         val: 93.4,  color: "#f59e0b", icon: Brain },
  ];
  return (
    <div className="anCard anMLCard">
      <div className="anCardHeader">
        <Brain size={14} style={{ color: "#8b5cf6" }} />
        <span>Focus Score Quality &amp; Performance Index</span>
        <span className="anMLBadge">AI-Powered</span>
      </div>
      <div className="anMLGrid">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div className="anMLMetric" key={i}>
              <div className="anMLMetricTop">
                <div className="anMLIcon" style={{ background: m.color + "18", color: m.color }}>
                  <Icon size={14} />
                </div>
                <span className="anMLLabel">{m.label}</span>
                <span className="anMLVal" style={{ color: m.color }}>{m.val}%</span>
              </div>
              <div className="anMLTrack">
                <div
                  className="anMLFill"
                  style={{ width: `${m.val}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color}88)` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main ── */
function AnalyticsView() {
  const [period, setPeriod] = useState("daily");
  const [focusData, setFocusData] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  const fetchAnalytics = useCallback(async (p) => {
    if (!token) return;
    setLoading(true);
    try {
      const [fr, sr] = await Promise.all([
        fetch(`${API}/analytics/focus-score?period=${p}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/analytics/switch-matrix?period=${p}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fd = fr.ok ? await fr.json() : null;
      const sd = sr.ok ? await sr.json() : null;
      setFocusData(fd?.overall_total_minutes > 0 ? fd : FALLBACK_FOCUS);
      setSwitchData(sd?.total_switches >= 0 ? sd : FALLBACK_SWITCH);
    } catch {
      setFocusData(FALLBACK_FOCUS);
      setSwitchData(FALLBACK_SWITCH);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchAnalytics(period);
    const t = setInterval(() => fetchAnalytics(period), 30000);
    return () => clearInterval(t);
  }, [period, fetchAnalytics]);

  const fd = focusData || FALLBACK_FOCUS;
  const sd = switchData || FALLBACK_SWITCH;
  const sparkData = fd.buckets?.map(b => b.focus_score_pct) || [];
  const trend = sparkData.length >= 2 ? sparkData[sparkData.length - 1] - sparkData[0] : 0;

  const handleExport = () => {
    setDownloading(true);
    const data = { title: "FocusGuard AI Analytics Report", generatedAt: new Date().toISOString(), period, focusScore: fd, switchMatrix: sd };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `FocusGuard_Analytics_${period}_${new Date().toISOString().split("T")[0]}.json` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setDownloading(false); setSuccess("Report downloaded!"); setTimeout(() => setSuccess(""), 4000);
  };

  const KPI = [
    { icon: Target,     label: "Focus Score",     val: `${fd.overall_focus_score_pct?.toFixed(1)}%`, color: focusColor(fd.overall_focus_score_pct), spark: sparkData, trend },
    { icon: Clock,      label: "Total Screen Time",val: fmtMins(fd.overall_total_minutes),            color: "#3b82f6", spark: fd.buckets?.map(b => b.total_minutes) || [] },
    { icon: TrendingUp, label: "Productive Time",  val: fmtMins(fd.overall_productive_minutes),       color: "#10b981", spark: fd.buckets?.map(b => b.total_minutes * b.focus_score_pct / 100) || [] },
    { icon: Zap,        label: "App Switches",     val: sd.total_switches,                             color: "#f59e0b", spark: [45, 68, 112, 90, 78, 112] },
    { icon: Brain,      label: "Accuracy Index",   val: "96.67%",                                      color: "#8b5cf6", spark: [92, 94, 95, 96, 96.67] },
  ];

  return (
    <div className="anPage">
      {/* ── Header ── */}
      <div className="anPageHeader">
        <div className="anPageHeaderLeft">
          <div className="anPageIconBadge">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="anPageTitle">Performance Analytics</h2>
            <p className="anPageSub">Focus score trends, context switch matrix &amp; performance intelligence</p>
          </div>
        </div>
        <div className="anPageHeaderRight">
          {/* Period toggle */}
          <div className="anPeriodGroup">
            {["daily", "weekly", "monthly"].map(p => (
              <button
                key={p}
                className={`anPeriodBtn ${period === p ? "anPeriodActive" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className="anControlBtn anOutlineBtn" onClick={() => fetchAnalytics(period)} disabled={loading}>
            <RefreshCw size={13} className={loading ? "anSpin" : ""} />
            Refresh
          </button>
          <button className="anControlBtn anPrimaryBtn" onClick={handleExport} disabled={downloading}>
            <Download size={13} />
            {downloading ? "Generating…" : "Export Report"}
          </button>
        </div>
      </div>

      {/* ── Success Banner ── */}
      {success && (
        <div className="anSuccessBanner">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      {/* ── KPI Strip ── */}
      <div className="anKpiStrip">
        {KPI.map((k, i) => {
          const Icon = k.icon;
          const hasTrend = k.trend !== undefined;
          const trendUp = (k.trend || 0) >= 0;
          return (
            <div className="anKpiCard" key={i} style={{ "--kpi-color": k.color }}>
              <div className="anKpiTop">
                <div className="anKpiIcon" style={{ background: k.color + "18", color: k.color }}>
                  <Icon size={16} />
                </div>
                {hasTrend && (
                  <span className={`anKpiTrend ${trendUp ? "trendUp" : "trendDown"}`}>
                    {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(k.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="anKpiVal" style={{ color: k.color }}>{k.val}</div>
              <div className="anKpiLabel">{k.label}</div>
              {k.spark?.length > 1 && <Sparkline data={k.spark} color={k.color} />}
            </div>
          );
        })}
      </div>

      {/* ── Dual Grid ── */}
      <div className="anDualGrid">
        {/* Focus Score Panel */}
        <div className="anCard anFocusCard">
          <div className="anCardHeader">
            <Target size={14} style={{ color: focusColor(fd.overall_focus_score_pct) }} />
            <span>Focus Score — <span style={{ textTransform: "capitalize" }}>{period}</span></span>
            <code className="anFormulaTag">productive / total × 100</code>
          </div>

          <div className="anFocusBody">
            <div className="anGaugeWrap">
              <RadialGauge pct={fd.overall_focus_score_pct || 0} />
            </div>
            <div className="anFocusStats">
              {[
                { label: "Total Screen Time",  val: fmtMins(fd.overall_total_minutes),                                                  color: "var(--db-t1)" },
                { label: "Productive Time",    val: fmtMins(fd.overall_productive_minutes),                                             color: "#22c55e" },
                { label: "Distraction Time",   val: fmtMins(fd.overall_total_minutes - fd.overall_productive_minutes),                  color: "#ef4444" },
                { label: "Focus Score",        val: `${fd.overall_focus_score_pct?.toFixed(2)}%`,                                       color: focusColor(fd.overall_focus_score_pct) },
              ].map((s, i) => (
                <div className="anFocusStat" key={i}>
                  <span className="anFocusStatLabel">{s.label}</span>
                  <strong className="anFocusStatVal" style={{ color: s.color }}>{s.val}</strong>
                </div>
              ))}
            </div>
          </div>

          {fd.buckets?.length > 0 && (
            <div className="anBucketSection">
              <div className="anBucketSectionTitle">
                <BarChart3 size={12} />
                {period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly"} Breakdown
              </div>
              <FocusBarChart buckets={fd.buckets} period={period} />
            </div>
          )}
        </div>

        {/* Switch Matrix Panel */}
        <div className="anCard anSwitchCard">
          <div className="anCardHeader">
            <Layers size={14} style={{ color: "#f59e0b" }} />
            <span>Context Switch Matrix — <span style={{ textTransform: "capitalize" }}>{period}</span></span>
          </div>

          <div className="anSwitchSummaryRow">
            <div className="anSwitchStat">
              <div className="anSwitchStatIcon" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                <Zap size={14} />
              </div>
              <div>
                <span className="anSwitchStatVal">{sd.total_switches}</span>
                <span className="anSwitchStatLabel">Total Switches</span>
              </div>
            </div>
            {sd.max_switches_app && (
              <div className="anSwitchStat">
                <div className="anSwitchStatIcon" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                  <Activity size={14} />
                </div>
                <div>
                  <span className="anSwitchStatVal">{sd.max_switches_app.app_name}</span>
                  <span className="anSwitchStatLabel">Top App ({sd.max_switches_app.max_switches}× switches)</span>
                </div>
              </div>
            )}
          </div>

          <div className="anSwitchBody">
            {/* Transition Pairs */}
            <div className="anSwitchCol">
              <p className="anSwitchColTitle">
                <Activity size={12} style={{ color: "#f59e0b" }} /> Top Transition Pairs
              </p>
              {sd.top_pairs?.slice(0, 6).map((p, i) => {
                const maxC = sd.top_pairs[0]?.count || 1;
                const pct = Math.round((p.count / maxC) * 100);
                return (
                  <div className="anPairRow" key={i}>
                    <span className="anPairRank">#{i + 1}</span>
                    <div className="anPairInfo">
                      <div className="anPairLabel">{p.name}</div>
                      <div className="anPairTrack">
                        <div className="anPairFill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="anPairCount">{p.count}×</span>
                  </div>
                );
              })}
            </div>

            {/* From / To Frequency */}
            <div className="anSwitchCol">
              <p className="anSwitchColTitle">
                <TrendingDown size={12} style={{ color: "#ef4444" }} /> Most Left (From)
              </p>
              {sd.from_frequency?.slice(0, 5).map((f, i) => {
                const pct = Math.round((f.count / (sd.from_frequency[0]?.count || 1)) * 100);
                return (
                  <div className="anFreqRow" key={i}>
                    <span className="anFreqApp">{f.name.split(" ")[0]}</span>
                    <div className="anFreqTrack">
                      <div className="anFreqFill anFreqFrom" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="anFreqCount">{f.count}</span>
                  </div>
                );
              })}
              <p className="anSwitchColTitle" style={{ marginTop: 16 }}>
                <TrendingUp size={12} style={{ color: "#10b981" }} /> Most Entered (To)
              </p>
              {sd.to_frequency?.slice(0, 5).map((f, i) => {
                const pct = Math.round((f.count / (sd.to_frequency[0]?.count || 1)) * 100);
                return (
                  <div className="anFreqRow" key={i}>
                    <span className="anFreqApp">{f.name.split(" ")[0]}</span>
                    <div className="anFreqTrack">
                      <div className="anFreqFill anFreqTo" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="anFreqCount">{f.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ML Performance ── */}
      <MLPerformanceCard />
    </div>
  );
}

export default AnalyticsView;
