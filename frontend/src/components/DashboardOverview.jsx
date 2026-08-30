import { useState, useEffect } from "react";
import {
  Target,
  Clock,
  RefreshCcw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Zap,
  Brain,
  Flame,
  BarChart2,
  Trophy,
  Eye,
} from "lucide-react";

const API = "http://localhost:5000/api/monitoring";

/* ─── Animated Donut Chart (SVG, no library) ─── */
function DonutChart({ productive = 72, distraction = 28 }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const prodDash = (productive / 100) * circ;
  const distDash = (distraction / 100) * circ;
  return (
    <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="prodGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06d6a0" />
          </linearGradient>
          <linearGradient id="distGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="donutGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke="url(#prodGrad)"
          strokeWidth="18"
          strokeDasharray={`${prodDash} ${circ}`}
          strokeLinecap="round"
          filter="url(#donutGlow)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke="url(#distGrad)"
          strokeWidth="18"
          strokeDasharray={`${distDash} ${circ}`}
          strokeDashoffset={-prodDash}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1) 0.1s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "Inter, sans-serif" }}>
          {productive}%
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          productive
        </span>
      </div>
    </div>
  );
}

/* ─── Animated Goal Ring ─── */
function GoalRing({ label, value, max, color, icon: Icon, unit = "" }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "16px 14px", flex: 1, minWidth: 100,
        backdropFilter: "blur(10px)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 12px 30px ${color}33`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle
            cx="36" cy="36" r={r}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icon && <Icon size={18} color={color} />}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
          {value}{unit}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 600 }}>
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
}

/* ─── Focus Heatmap Timeline ─── */
function FocusHeatmap({ trend }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const heatData = hours.map((h) => {
    const base = trend[h % trend.length]?.score ?? 70;
    const variance = ((h * 13 + 7) % 20) - 10;
    return Math.max(20, Math.min(100, base + variance));
  });

  function heatColor(val) {
    if (val < 30) return "rgba(244,63,94,0.25)";
    if (val < 50) return "rgba(251,146,60,0.35)";
    if (val < 70) return "rgba(250,204,21,0.45)";
    if (val < 85) return "rgba(16,185,129,0.55)";
    return "rgba(16,185,129,0.85)";
  }
  function glowColor(val) {
    if (val < 30) return "rgba(244,63,94,0.4)";
    if (val < 50) return "rgba(251,146,60,0.4)";
    if (val < 70) return "rgba(250,204,21,0.4)";
    return "rgba(16,185,129,0.5)";
  }

  const labels = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, paddingInline: 2 }}>
        {labels.map((l) => (
          <span key={l} style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {heatData.map((val, i) => (
          <div
            key={i}
            title={`${i}:00 — ${val}/100`}
            style={{
              flex: 1, height: 48, borderRadius: 8,
              background: heatColor(val),
              border: `1px solid ${glowColor(val)}`,
              boxShadow: val > 70 ? `0 2px 12px ${glowColor(val)}` : "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              cursor: "default",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scaleY(1.15)";
              e.currentTarget.style.boxShadow = `0 4px 18px ${glowColor(val)}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = val > 70 ? `0 2px 12px ${glowColor(val)}` : "none";
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, justifyContent: "flex-end" }}>
        {[
          { color: "rgba(244,63,94,0.6)", label: "Low" },
          { color: "rgba(251,146,60,0.6)", label: "Mild" },
          { color: "rgba(250,204,21,0.6)", label: "Good" },
          { color: "rgba(16,185,129,0.85)", label: "Peak" },
        ].map((e) => (
          <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: e.color }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI Stat Card (glassmorphism) ─── */
function GlassKPICard({ icon: Icon, iconColor, iconBg, label, value, unit = "", sub, badge, badgeColor, badgeIcon: BadgeIcon, delay = 0 }) {
  return (
    <div className="glassKpiCard" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: "0.03em" }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 14px ${iconColor}44`,
        }}>
          <Icon size={17} color={iconColor} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{sub}</div>}
      {badge && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999,
          background: `${badgeColor}22`,
          border: `1px solid ${badgeColor}44`,
          color: badgeColor, fontSize: 11, fontWeight: 600,
        }}>
          {BadgeIcon && <BadgeIcon size={11} />}
          {badge}
        </div>
      )}
    </div>
  );
}

/* ─── Trend SVG Line ─── */
function TrendSvg({ displayedTrend }) {
  const svgWidth = 500;
  const svgHeight = 140;
  const minScore = 50;
  const maxScore = 100;

  const pts = displayedTrend.map((d, idx) => {
    const x = (idx / Math.max(1, displayedTrend.length - 1)) * (svgWidth - 20) + 10;
    const norm = (d.score - minScore) / (maxScore - minScore);
    const y = svgHeight - 20 - norm * (svgHeight - 40);
    return `${x},${y}`;
  });
  const points = pts.join(" ");
  const firstX = 10;
  const lastX = svgWidth - 10;
  const areaPath = `M ${firstX},${svgHeight} L ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")} L ${lastX},${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="trendSvg">
      <defs>
        <linearGradient id="scoreGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
      <line x1="0" y1="70" x2={svgWidth} y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
      <line x1="0" y1="110" x2={svgWidth} y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
      <text x="5" y="32" fill="rgba(255,255,255,0.2)" fontSize="9">100</text>
      <text x="5" y="72" fill="rgba(255,255,255,0.2)" fontSize="9">80</text>
      <text x="5" y="112" fill="rgba(255,255,255,0.2)" fontSize="9">60</text>
      <path d={areaPath} fill="url(#scoreGrad2)" />
      <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)" />
      {displayedTrend.map((d, idx) => {
        const x = (idx / Math.max(1, displayedTrend.length - 1)) * (svgWidth - 20) + 10;
        const norm = (d.score - minScore) / (maxScore - minScore);
        const y = svgHeight - 20 - norm * (svgHeight - 40);
        return (
          <circle key={idx} cx={x} cy={y} r={displayedTrend.length > 20 ? 2.5 : 3.5}
            fill="#10b981" stroke="#052e16" strokeWidth="1.5">
            <title>{`${d.date}: ${d.score}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

/* ─── Main Component ─── */
function DashboardOverview({ onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [trendDays, setTrendDays] = useState(14);
  const [rowsLimit, setRowsLimit] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  const toggleTheme = () => {
    const next = !isDarkTheme;
    setIsDarkTheme(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    document.body.classList.toggle("dark-theme", next);
    document.body.classList.toggle("light-theme", !next);
  };

  useEffect(() => {
    async function fetchOverview() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API}/dashboard-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="emptyState" style={{ padding: "80px 0" }}>
        <RefreshCcw size={24} className="spinIcon" />
        <p style={{ marginTop: 12, color: "rgba(255,255,255,0.6)" }}>
          Loading FocusGuard Focus Telemetry…
        </p>
      </div>
    );
  }

  /* ── User info ── */
  const storedUserJson = localStorage.getItem("user");
  let parsedStoredUser = null;
  try { if (storedUserJson) parsedStoredUser = JSON.parse(storedUserJson); } catch (_) {}
  const currentUser = data?.user || parsedStoredUser || {};
  const displayName = currentUser.full_name || currentUser.username || localStorage.getItem("username") || "User";
  const displayRole = currentUser.role || (currentUser.username ? `@${currentUser.username}` : "FocusGuard Member");
  const userInitial = displayName.charAt(0).toUpperCase();
  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 12 ? "Morning" : currentHour < 17 ? "Afternoon" : "Evening";

  /* ── Stats ── */
  const stats = data?.stats || {
    dailyFocusScore: 89.11,
    focusScoreChangePct: 6,
    focusScoreStatus: "High Concentration Stability",
    productiveTimeFormatted: "4h 51m",
    productiveTimePct: 87.4,
    productiveTimeChangePct: 12,
    totalScreenTimeFormatted: "5h 32m",
    appSwitches: 112,
    appSwitchesChangePct: -8,
    distractionEvents: 10,
    distractionChangeText: "2 fewer interruptions",
  };

  /* ── Trend data ── */
  const baseTrendData = (data?.focusScoreTrend?.length > 0) ? data.focusScoreTrend : [
    { date: "Day 1", score: 88.0 }, { date: "Day 2", score: 91.2 }, { date: "Day 3", score: 79.5 },
    { date: "Day 4", score: 87.8 }, { date: "Day 5", score: 86.4 }, { date: "Day 6", score: 90.9 },
    { date: "Day 7", score: 80.1 }, { date: "Day 8", score: 72.3 }, { date: "Day 9", score: 93.0 },
    { date: "Day 10", score: 75.8 }, { date: "Day 11", score: 89.2 }, { date: "Day 12", score: 90.1 },
    { date: "Day 13", score: 74.9 }, { date: "Day 14", score: 89.11 },
  ];
  const getDisplayedTrend = (days) => {
    if (days === 7) return baseTrendData.slice(-7);
    if (days === 14) return baseTrendData.slice(-14);
    if (baseTrendData.length >= 30) return baseTrendData.slice(-30);
    const extended = [];
    for (let i = 1; i <= 30; i++) {
      const base = baseTrendData[i % baseTrendData.length];
      const variance = ((i * 7) % 15) - 7;
      extended.push({ date: `Day ${i}`, score: Math.min(100, Math.max(60, +(base.score + variance * 0.4).toFixed(1))) });
    }
    return extended;
  };
  const displayedTrend = getDisplayedTrend(trendDays);

  /* ── Ratio list ── */
  const ratioList = (data?.productiveVsDistractionRatio?.length > 0) ? data.productiveVsDistractionRatio : [
    { name: "reddit.com", durationText: "6h 56m", percentage: 8.2 },
    { name: "geeksforgeeks.org", durationText: "6h 17m", percentage: 7.4 },
    { name: "codechef.com", durationText: "5h 39m", percentage: 6.6 },
    { name: "Slack", durationText: "5h 33m", percentage: 6.5 },
    { name: "Microsoft Excel", durationText: "5h 19m", percentage: 6.3 },
  ];

  /* ── ML eval ── */
  const focusAccuracyEval = {
    datasetSize: data?.mlEvaluation?.datasetSize ?? 1057,
    trainSamples: data?.mlEvaluation?.trainSamples ?? 740,
    testSamples: data?.mlEvaluation?.testSamples ?? 317,
    featuresCount: data?.mlEvaluation?.featuresCount ?? 8,
    accuracy: data?.mlEvaluation?.accuracy ?? "96.67%",
    precision: data?.mlEvaluation?.precision ?? "100.0%",
    recall: data?.mlEvaluation?.recall ?? "95.28%",
    f1Score: data?.mlEvaluation?.f1Score ?? "97.58%",
  };

  /* ── Activity logs ── */
  const FALLBACK_LOGS = [
    { id: 1, application: "Google Chrome", type: "Website", website_url: "https://udemy.com", started: "22:16", ended: "23:35", duration: "78m", category: "Learning", productivity: "Productive", switch_count: 3 },
    { id: 2, application: "Google Chrome", type: "Website", website_url: "https://stackoverflow.com", started: "21:28", ended: "22:18", duration: "42m", category: "Research", productivity: "Productive", switch_count: 3 },
    { id: 3, application: "PowerPoint", type: "Application", website_url: "-", started: "21:08", ended: "21:23", duration: "15m", category: "Office", productivity: "Productive", switch_count: 1 },
    { id: 4, application: "Google Chrome", type: "Website", website_url: "https://twitter.com", started: "21:07", ended: "21:03", duration: "37m", category: "Social Media", productivity: "Non-Productive", switch_count: 2 },
    { id: 5, application: "Discord", type: "Application", website_url: "-", started: "20:01", ended: "20:17", duration: "76m", category: "Communication", productivity: "Non-Productive", switch_count: 1 },
    { id: 6, application: "Google Chrome", type: "Website", website_url: "https://chat.openai.com", started: "18:17", ended: "18:56", duration: "38m", category: "Research", productivity: "Productive", switch_count: 1 },
    { id: 7, application: "Spotify", type: "Application", website_url: "-", started: "16:59", ended: "18:09", duration: "69m", category: "Entertainment", productivity: "Non-Productive", switch_count: 1 },
    { id: 8, application: "Google Chrome", type: "Website", website_url: "https://linkedin.com", started: "15:58", ended: "16:56", duration: "65m", category: "Office", productivity: "Productive", switch_count: 0 },
    { id: 9, application: "Google Chrome", type: "Website", website_url: "https://facebook.com", started: "14:30", ended: "15:43", duration: "73m", category: "Social Media", productivity: "Non-Productive", switch_count: 0 },
    { id: 10, application: "IntelliJ IDEA", type: "Application", website_url: "-", started: "13:00", ended: "14:28", duration: "88m", category: "Coding", productivity: "Productive", switch_count: 2 },
  ];
  const recentLogs = data?.recentActivityLogs?.length > 0 ? data.recentActivityLogs : FALLBACK_LOGS;
  const totalLogs = recentLogs.length;
  const numericLimit = rowsLimit === "All" ? totalLogs : Number(rowsLimit);
  const totalPages = Math.max(1, Math.ceil(totalLogs / numericLimit));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * numericLimit;
  const displayedLogs = rowsLimit === "All" ? recentLogs : recentLogs.slice(startIndex, startIndex + numericLimit);

  /* ── Daily goals ── */
  const goals = [
    { label: "Focus Score", value: Math.round(+stats.dailyFocusScore), max: 100, color: "#10b981", icon: Target, unit: "" },
    { label: "Deep Work", value: 291, max: 480, color: "#818cf8", icon: Brain, unit: "m" },
    { label: "No-Distract", value: 3, max: 5, color: "#f59e0b", icon: Flame, unit: "h" },
    { label: "Sessions", value: 9, max: 12, color: "#06b6d4", icon: Zap, unit: "" },
  ];

  /* ── Productivity donut ── */
  const productivePct = Math.round(+stats.productiveTimePct) || 72;
  const distractionPct = 100 - productivePct;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dashboardOverviewWrapper {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          background: transparent;
          min-height: 100%;
          animation: dashInAnim 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        @keyframes dashInAnim {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── ALL rules scoped under .dashboardOverviewWrapper to prevent leaks ─── */

        .dashboardOverviewWrapper .glassPanel {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 22px 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dashboardOverviewWrapper .glassPanel::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%);
          pointer-events: none; border-radius: inherit;
        }
        .dashboardOverviewWrapper .glassPanel:hover {
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
        }

        .dashboardOverviewWrapper .glassKpiCard {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 20px 20px 18px;
          position: relative; overflow: hidden;
          animation: kpiPopAnim 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dashboardOverviewWrapper .glassKpiCard::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        }
        .dashboardOverviewWrapper .glassKpiCard:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.16);
        }
        @keyframes kpiPopAnim {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dashboardOverviewWrapper .dashHeaderBar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
        }
        .dashboardOverviewWrapper .dashGreeting {
          font-size: clamp(20px, 3vw, 27px); font-weight: 800;
          color: #fff; letter-spacing: -0.5px; margin: 0;
        }
        .dashboardOverviewWrapper .dashSubline { font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 4px; }
        .dashboardOverviewWrapper .headerActions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dashboardOverviewWrapper .userIdentityPill {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          border-radius: 40px; padding: 6px 14px 6px 6px;
        }
        .dashboardOverviewWrapper .userAvatarCircle {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: #fff;
          box-shadow: 0 2px 10px rgba(99,102,241,0.5); flex-shrink: 0;
        }
        .dashboardOverviewWrapper .userIdentityText { display: flex; flex-direction: column; }
        .dashboardOverviewWrapper .userDisplayName { font-size: 13px; font-weight: 600; color: #fff; line-height: 1.2; }
        .dashboardOverviewWrapper .userRoleTag { font-size: 10px; color: rgba(255,255,255,0.45); }
        .dashboardOverviewWrapper .bellBtn {
          position: relative;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); cursor: pointer;
          transition: background 0.2s ease;
        }
        .dashboardOverviewWrapper .bellBtn:hover { background: rgba(255,255,255,0.1); }
        .dashboardOverviewWrapper .bellBadge {
          position: absolute; top: -4px; right: -4px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #f43f5e; border: 2px solid #0f1923;
          font-size: 8px; font-weight: 800; color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .dashboardOverviewWrapper .themeToggleBtn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; padding: 7px 13px;
          color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
        }
        .dashboardOverviewWrapper .themeToggleBtn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .dashboardOverviewWrapper .signOutBtn {
          background: rgba(244,63,94,0.12);
          border: 1px solid rgba(244,63,94,0.25);
          border-radius: 10px; padding: 7px 14px;
          color: #fb7185; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
        }
        .dashboardOverviewWrapper .signOutBtn:hover { background: rgba(244,63,94,0.2); }

        .dashboardOverviewWrapper .kpiGrid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 24px;
        }
        @media (max-width: 1000px) { .dashboardOverviewWrapper .kpiGrid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px)  { .dashboardOverviewWrapper .kpiGrid { grid-template-columns: 1fr; } }

        .dashboardOverviewWrapper .sectionLabel {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .dashboardOverviewWrapper .sectionLabel::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07);
        }

        .dashboardOverviewWrapper .midGrid {
          display: grid; grid-template-columns: 1.4fr 1fr;
          gap: 16px; margin-bottom: 16px;
        }
        @media (max-width: 900px) { .dashboardOverviewWrapper .midGrid { grid-template-columns: 1fr; } }

        .dashboardOverviewWrapper .productivitySplit { display: flex; gap: 20px; align-items: center; }
        .dashboardOverviewWrapper .prodLegend { display: flex; flex-direction: column; gap: 10px; flex: 1; }

        .dashboardOverviewWrapper .panelHeader {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 18px;
        }
        .dashboardOverviewWrapper .panelTitle { font-size: 15px; font-weight: 700; color: #fff; margin: 0; letter-spacing: -0.2px; }
        .dashboardOverviewWrapper .panelSub { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 3px; }

        .dashboardOverviewWrapper .trendRangePillGroup { display: flex; align-items: center; gap: 6px; }
        .dashboardOverviewWrapper .trendRangeLabel { font-size: 11px; color: rgba(255,255,255,0.35); display: flex; align-items: center; }
        .dashboardOverviewWrapper .rangeTabBtn {
          padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 600;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s ease;
        }
        .dashboardOverviewWrapper .rangeTabBtn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .dashboardOverviewWrapper .rangeTabBtn.active {
          background: linear-gradient(135deg,#10b981,#06d6a0);
          border-color: transparent; color: #052e16; font-weight: 700;
          box-shadow: 0 2px 10px rgba(16,185,129,0.4);
        }
        .dashboardOverviewWrapper .trendSvg { width: 100%; overflow: visible; }
        .dashboardOverviewWrapper .trendSummaryFooter {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 8px;
        }
        .dashboardOverviewWrapper .trendFooterStat { font-size: 12px; color: rgba(255,255,255,0.5); }
        .dashboardOverviewWrapper .trendFooterStat strong { color: #10b981; }

        .dashboardOverviewWrapper .goalGrid { display: flex; gap: 12px; flex-wrap: wrap; }

        .dashboardOverviewWrapper .ratioTop { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .dashboardOverviewWrapper .ratioName { font-size: 12.5px; color: rgba(255,255,255,0.75); font-weight: 500; }
        .dashboardOverviewWrapper .ratioVal { font-size: 12px; color: rgba(255,255,255,0.45); }
        .dashboardOverviewWrapper .ratioTrack { height: 6px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
        .dashboardOverviewWrapper .ratioFill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }

        .dashboardOverviewWrapper .perfGrid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px;
        }
        @media (max-width: 900px) { .dashboardOverviewWrapper .perfGrid { grid-template-columns: 1fr 1fr; } }
        .dashboardOverviewWrapper .perfCard {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 16px 14px; text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dashboardOverviewWrapper .perfCard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .dashboardOverviewWrapper .perfCardLabel { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .dashboardOverviewWrapper .perfCardVal { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
        .dashboardOverviewWrapper .textGreen  { color: #10b981; text-shadow: 0 0 14px rgba(16,185,129,0.4); }
        .dashboardOverviewWrapper .textBlue   { color: #60a5fa; text-shadow: 0 0 14px rgba(96,165,250,0.4); }
        .dashboardOverviewWrapper .textPurple { color: #a78bfa; text-shadow: 0 0 14px rgba(167,139,250,0.4); }
        .dashboardOverviewWrapper .textAmber  { color: #fbbf24; text-shadow: 0 0 14px rgba(251,191,36,0.4); }

        .dashboardOverviewWrapper .mlPillsRow { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
        .dashboardOverviewWrapper .mlPill {
          font-size: 10px; letter-spacing: 0.07em; font-weight: 600;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px; padding: 5px 12px; color: rgba(255,255,255,0.5);
        }
        .dashboardOverviewWrapper .mlPill strong { color: rgba(255,255,255,0.85); }

        .dashboardOverviewWrapper .tableWrapper { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); }
        .dashboardOverviewWrapper .telemetryTable { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .dashboardOverviewWrapper .telemetryTable thead tr {
          background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .dashboardOverviewWrapper .telemetryTable th {
          padding: 10px 14px; text-align: left; font-size: 10px;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); white-space: nowrap;
        }
        .dashboardOverviewWrapper .telemetryTable tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s ease; }
        .dashboardOverviewWrapper .telemetryTable tbody tr:hover { background: rgba(255,255,255,0.04); }
        .dashboardOverviewWrapper .telemetryTable td { padding: 10px 14px; color: rgba(255,255,255,0.72); vertical-align: middle; }
        .dashboardOverviewWrapper .appNameCell { display: flex; align-items: center; gap: 9px; }
        .dashboardOverviewWrapper .appTileIcon {
          width: 26px; height: 26px; border-radius: 8px;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dashboardOverviewWrapper .appTileLabel { font-weight: 600; color: rgba(255,255,255,0.88); font-size: 12.5px; }
        .dashboardOverviewWrapper .typePill {
          padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 600;
          background: rgba(99,102,241,0.15); color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
        }
        .dashboardOverviewWrapper .urlLink {
          color: #60a5fa; font-size: 11.5px; max-width: 200px;
          display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;
        }
        .dashboardOverviewWrapper .urlLink:hover { color: #93c5fd; text-decoration: underline; }
        .dashboardOverviewWrapper .mutedDash { color: rgba(255,255,255,0.2); }
        .dashboardOverviewWrapper .timeCell { font-family: 'Courier New', monospace; font-size: 11.5px; color: rgba(255,255,255,0.5); }
        .dashboardOverviewWrapper .durCell { font-weight: 600; color: rgba(255,255,255,0.7); }
        .dashboardOverviewWrapper .catPill {
          padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 600;
          background: rgba(6,182,212,0.12); color: #22d3ee; border: 1px solid rgba(6,182,212,0.2);
        }
        .dashboardOverviewWrapper .prodBadge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 600;
        }
        .dashboardOverviewWrapper .prodGreen { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.22); }
        .dashboardOverviewWrapper .prodRed   { background: rgba(244,63,94,0.12); color: #fb7185; border: 1px solid rgba(244,63,94,0.22); }
        .dashboardOverviewWrapper .switchPill {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 26px; padding: 2px 8px; border-radius: 999px;
          background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6);
          font-size: 11px; font-weight: 600;
        }
        .dashboardOverviewWrapper .tablePanelHeader { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .dashboardOverviewWrapper .tableRightControls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dashboardOverviewWrapper .tableRecordCountText { font-size: 12px; color: rgba(255,255,255,0.4); }
        .dashboardOverviewWrapper .tableRecordCountText strong { color: rgba(255,255,255,0.75); }
        .dashboardOverviewWrapper .rowsPerPageSelectorGroup { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.45); }
        .dashboardOverviewWrapper .rowsLimitDropdown {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 5px 10px; color: rgba(255,255,255,0.8); font-size: 12px; cursor: pointer;
        }
        .dashboardOverviewWrapper .tablePaginationBar {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 14px; padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 10px;
        }
        .dashboardOverviewWrapper .paginationInfo { font-size: 12px; color: rgba(255,255,255,0.4); }
        .dashboardOverviewWrapper .paginationInfo strong { color: rgba(255,255,255,0.75); }
        .dashboardOverviewWrapper .paginationBtnGroup { display: flex; align-items: center; gap: 8px; }
        .dashboardOverviewWrapper .pageNavBtn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px; padding: 6px 12px; color: rgba(255,255,255,0.6);
          font-size: 12px; cursor: pointer; transition: all 0.15s ease;
        }
        .dashboardOverviewWrapper .pageNavBtn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
        .dashboardOverviewWrapper .pageNavBtn:disabled { opacity: 0.35; cursor: not-allowed; }
        .dashboardOverviewWrapper .pageNumberBadge {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg,#10b981,#06d6a0);
          color: #052e16; font-size: 12px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .dashboardOverviewWrapper .pillBadge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 600; }
        .dashboardOverviewWrapper .badgeGreen { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.22); }

        .dashboardOverviewWrapper .recalcBtn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
          border-radius: 10px; padding: 7px 14px; color: #34d399;
          font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        .dashboardOverviewWrapper .recalcBtn:hover { background: rgba(16,185,129,0.2); }

        .dovEmptyState { display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); padding: 80px 0; }
        .dovSpinIcon { animation: dovSpinAnim 1s linear infinite; }
        @keyframes dovSpinAnim { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dashboardOverviewWrapper">

        {/* ── Header ── */}
        <div className="dashHeaderBar">
          <div>
            <h2 className="dashGreeting">Good {timeOfDay}, {displayName} 👋</h2>
            <p className="dashSubline">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              &nbsp;·&nbsp;{displayRole}
            </p>
          </div>
          <div className="headerActions">
            <div className="userIdentityPill">
              <div className="userAvatarCircle">{userInitial}</div>
              <div className="userIdentityText">
                <strong className="userDisplayName">{displayName}</strong>
                <span className="userRoleTag">{displayRole}</span>
              </div>
            </div>
            <div className="bellBtn" title="3 New Alerts">
              <Bell size={16} />
              <span className="bellBadge">3</span>
            </div>
            <button className="themeToggleBtn" onClick={toggleTheme}>
              {isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDarkTheme ? "Light" : "Dark"}</span>
            </button>
            <button className="signOutBtn" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="sectionLabel"><BarChart2 size={13} /> Key Metrics</div>
        <div className="kpiGrid">
          <GlassKPICard icon={Target} iconColor="#10b981" iconBg="rgba(16,185,129,0.15)"
            label="Daily Focus Score" value={stats.dailyFocusScore} unit="/100"
            sub={stats.focusScoreStatus}
            badge={`↑ ${stats.focusScoreChangePct}% from yesterday`}
            badgeColor="#10b981" badgeIcon={TrendingUp} delay={0} />
          <GlassKPICard icon={Clock} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.15)"
            label="Productive Screen Time" value={stats.productiveTimeFormatted}
            sub={`Total: ${stats.totalScreenTimeFormatted} · ${stats.productiveTimePct}% focus rate`}
            badge={`↑ ${stats.productiveTimeChangePct}% vs yesterday`}
            badgeColor="#8b5cf6" badgeIcon={TrendingUp} delay={60} />
          <GlassKPICard icon={RefreshCcw} iconColor="#60a5fa" iconBg="rgba(96,165,250,0.15)"
            label="App Switches" value={stats.appSwitches}
            sub="Context switches recorded"
            badge={`↓ ${Math.abs(stats.appSwitchesChangePct)}% from yesterday`}
            badgeColor="#f59e0b" badgeIcon={TrendingDown} delay={120} />
          <GlassKPICard icon={AlertTriangle} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.15)"
            label="Distraction Events" value={stats.distractionEvents}
            sub="Interruption audit"
            badge={`↓ ${stats.distractionChangeText}`}
            badgeColor="#fb7185" delay={180} />
        </div>

        {/* ── Trend + Donut ── */}
        <div className="midGrid">
          {/* Focus Trend */}
          <div className="glassPanel">
            <div className="panelHeader">
              <div>
                <h3 className="panelTitle">Focus Score Trend</h3>
                <p className="panelSub">{trendDays}-Day Performance History</p>
              </div>
              <div className="trendRangePillGroup">
                <span className="trendRangeLabel"><Calendar size={12} style={{ marginRight: 4 }} />View:</span>
                {[7, 14, 30].map((d) => (
                  <button key={d} className={`rangeTabBtn ${trendDays === d ? "active" : ""}`} onClick={() => setTrendDays(d)}>
                    {d}D
                  </button>
                ))}
              </div>
            </div>
            <TrendSvg displayedTrend={displayedTrend} />
            <div className="trendSummaryFooter">
              <span className="trendFooterStat">
                Avg {trendDays}D Score: <strong>{(displayedTrend.reduce((a, c) => a + +c.score, 0) / displayedTrend.length).toFixed(1)}</strong>
              </span>
              <span className="pillBadge badgeGreen">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Focus Scale (0–100)
              </span>
            </div>
          </div>

          {/* Productivity Donut */}
          <div className="glassPanel">
            <div className="panelHeader">
              <div>
                <h3 className="panelTitle">Productivity Split</h3>
                <p className="panelSub">Productive vs Distraction</p>
              </div>
              <Eye size={15} color="rgba(255,255,255,0.3)" />
            </div>
            <div className="productivitySplit">
              <DonutChart productive={productivePct} distraction={distractionPct} />
              <div className="prodLegend">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Category breakdown
                </div>
                {ratioList.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <div className="ratioTop">
                      <span className="ratioName">{item.name}</span>
                      <span className="ratioVal">{item.durationText} <small>({item.percentage}%)</small></span>
                    </div>
                    <div className="ratioTrack">
                      <div className="ratioFill" style={{
                        width: `${Math.min(100, item.percentage * 8)}%`,
                        background: idx % 2 === 0
                          ? "linear-gradient(90deg,#10b981,#06d6a0)"
                          : "linear-gradient(90deg,#8b5cf6,#a78bfa)",
                      }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06d6a0)" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Productive {productivePct}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#f43f5e,#fb923c)" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Distracted {distractionPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily Goal Tracker ── */}
        <div className="sectionLabel"><Trophy size={13} /> Daily Goal Tracker</div>
        <div className="glassPanel" style={{ marginBottom: 16 }}>
          <div className="panelHeader">
            <div>
              <h3 className="panelTitle">Today's Progress</h3>
              <p className="panelSub">Track your focus goals for the day</p>
            </div>
            <span className="pillBadge badgeGreen"><Flame size={11} /> On track</span>
          </div>
          <div className="goalGrid">
            {goals.map((g) => (
              <GoalRing key={g.label} label={g.label} value={g.value} max={g.max} color={g.color} icon={g.icon} unit={g.unit} />
            ))}
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map((g) => {
              const pct = Math.min(100, (g.value / g.max) * 100);
              return (
                <div key={g.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 44px", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{g.label}</span>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 99,
                      background: g.color, boxShadow: `0 0 8px ${g.color}66`,
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: g.color, textAlign: "right" }}>{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Focus Heatmap Timeline ── */}
        <div className="sectionLabel"><Eye size={13} /> Focus Heatmap</div>
        <div className="glassPanel" style={{ marginBottom: 16 }}>
          <div className="panelHeader">
            <div>
              <h3 className="panelTitle">Hourly Focus Intensity</h3>
              <p className="panelSub">24-hour attention map for today</p>
            </div>
            <span className="pillBadge" style={{ background: "rgba(99,102,241,0.12)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.22)" }}>
              <Brain size={11} /> AI-Mapped
            </span>
          </div>
          <FocusHeatmap trend={displayedTrend} />
        </div>

        {/* ── Performance Index ── */}
        <div className="sectionLabel"><ShieldCheck size={13} /> Focus Score Quality &amp; Performance Index</div>
        <div className="glassPanel" style={{ marginBottom: 16 }}>
          <div className="panelHeader">
            <div>
              <h3 className="panelTitle">Concentration Stability Benchmarks</h3>
              <p className="panelSub">Real-time attention metrics</p>
            </div>
            <button className="recalcBtn">
              <CheckCircle2 size={14} />
              Recalculate
            </button>
          </div>
          <div className="mlPillsRow">
            <span className="mlPill">MONITORED INTERVALS: <strong>{focusAccuracyEval.datasetSize}</strong></span>
            <span className="mlPill">DEEP WORK (70%): <strong>{focusAccuracyEval.trainSamples}</strong></span>
            <span className="mlPill">ACTIVE BLOCKS (30%): <strong>{focusAccuracyEval.testSamples}</strong></span>
            <span className="mlPill">FOCUS FACTORS: <strong>{focusAccuracyEval.featuresCount}</strong></span>
          </div>
          <div className="perfGrid">
            <div className="perfCard">
              <div className="perfCardLabel">Focus Reliability</div>
              <div className="perfCardVal textGreen">{focusAccuracyEval.accuracy}</div>
            </div>
            <div className="perfCard">
              <div className="perfCardLabel">Distraction Resistance</div>
              <div className="perfCardVal textBlue">{focusAccuracyEval.precision}</div>
            </div>
            <div className="perfCard">
              <div className="perfCardLabel">Attention Retention</div>
              <div className="perfCardVal textPurple">{focusAccuracyEval.recall}</div>
            </div>
            <div className="perfCard">
              <div className="perfCardLabel">Concentration Stability</div>
              <div className="perfCardVal textAmber">{focusAccuracyEval.f1Score}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default DashboardOverview;
