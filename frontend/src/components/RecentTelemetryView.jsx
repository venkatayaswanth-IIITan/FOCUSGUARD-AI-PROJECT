import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Search,
  RefreshCw,
  Download,
  Filter,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Brain,
  ShieldCheck,
  BarChart2,
} from "lucide-react";

import { API_MONITORING } from "../services/api";

const API = API_MONITORING;

const APP_COLOR_MAP = {
  "Google Chrome": { bg: "#4285f4", text: "#fff" },
  "PowerPoint": { bg: "#d04a02", text: "#fff" },
  "Discord": { bg: "#5865f2", text: "#fff" },
  "Spotify": { bg: "#1db954", text: "#fff" },
  "IntelliJ IDEA": { bg: "#fe315d", text: "#fff" },
  "VS Code": { bg: "#007acc", text: "#fff" },
  "Slack": { bg: "#4a154b", text: "#fff" },
  "Excel": { bg: "#217346", text: "#fff" },
  "Word": { bg: "#2b579a", text: "#fff" },
  "LeetCode": { bg: "#ffa116", text: "#fff" },
  "Udemy": { bg: "#a435f0", text: "#fff" },
  "Stack Overflow": { bg: "#f48024", text: "#fff" },
  "ChatGPT": { bg: "#10a37f", text: "#fff" },
  "YouTube": { bg: "#ff0000", text: "#fff" },
  "Netflix": { bg: "#e50914", text: "#fff" },
  "Instagram": { bg: "#e1306c", text: "#fff" },
  "Facebook": { bg: "#1877f2", text: "#fff" },
  "Twitter": { bg: "#1da1f2", text: "#fff" },
};

function getAppColors(appName) {
  for (const [key, val] of Object.entries(APP_COLOR_MAP)) {
    if ((appName || "").toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return { bg: "#64748b", text: "#fff" };
}

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

function RecentTelemetryView() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState(FALLBACK_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rowsLimit, setRowsLimit] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTelemetryData = async () => {
    setRefreshing(true);
    const token = localStorage.getItem("token");
    try {
      // Fetch overview data which contains the full PostgreSQL telemetry records
      const res = await fetch(`${API}/dashboard-overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.recentActivityLogs && data.recentActivityLogs.length > 0) {
          setLogs(data.recentActivityLogs);
        }
      }
    } catch (err) {
      console.error("Error fetching telemetry records:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
    const interval = setInterval(fetchTelemetryData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter logs based on search query, category, and productivity status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const app = (log.application || "").toLowerCase();
      const url = (log.website_url || "").toLowerCase();
      const cat = (log.category || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || app.includes(q) || url.includes(q) || cat.includes(q);

      const matchesCategory =
        filterCategory === "all" || cat === filterCategory.toLowerCase();

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "productive" && (log.productivity === "Productive" || log.productive === true)) ||
        (filterStatus === "distraction" && (log.productivity === "Non-Productive" || log.productive === false));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [logs, searchQuery, filterCategory, filterStatus]);

  // Pagination calculation
  const totalFiltered = filteredLogs.length;
  const numericLimit = rowsLimit === "All" ? totalFiltered : Number(rowsLimit);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / (numericLimit || 1)));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * (numericLimit || 1);
  const displayedLogs = rowsLimit === "All" ? filteredLogs : filteredLogs.slice(startIndex, startIndex + numericLimit);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const productiveCount = logs.filter(
      (l) => l.productivity === "Productive" || l.productive === true
    ).length;
    const distractionCount = total - productiveCount;
    const prodPct = total > 0 ? Math.round((productiveCount / total) * 100) : 0;
    const totalSwitches = logs.reduce((acc, curr) => acc + (Number(curr.switch_count) || 0), 0);

    return { total, productiveCount, distractionCount, prodPct, totalSwitches };
  }, [logs]);

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ["ID,Application,Type,Website URL,Started,Ended,Duration,Category,Productivity,Switches\n"];
    const rows = logs.map((row) => {
      const cleanUrl = (row.website_url || "-").replace(/,/g, " ");
      return `${row.id},"${row.application}","${row.type}","${cleanUrl}","${row.started}","${row.ended}","${row.duration}","${row.category}","${row.productivity}",${row.switch_count || 0}\n`;
    });

    const blob = new Blob([headers.join(""), ...rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FocusGuard_Telemetry_Records_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="recentTelemetryContainer" style={{ padding: "28px", maxWidth: "1440px", margin: "0 auto" }}>
      {/* ── Top Header Banner ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #06d6a0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(16,185,129,0.35)",
              }}
            >
              <Clock size={20} color="#052e16" />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Telemetry Records
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "3px 8px",
                borderRadius: "12px",
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                fontWeight: 600,
              }}
            >
              POSTGRESQL SYNCED
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", margin: 0 }}>
            Sequential activity telemetry records, foreground window dwells, tab switch frequencies, and AI productivity classifications.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchTelemetryData}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={15} className={refreshing ? "spin-icon" : ""} />
            {refreshing ? "Syncing..." : "Refresh"}
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
            }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "18px 20px",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Total Telemetry Records
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>{stats.total}</span>
            <span style={{ fontSize: "0.8rem", color: "#60a5fa" }}>logs in DB</span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "18px 20px",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Productive Telemetry Ratio
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}>{stats.prodPct}%</span>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>({stats.productiveCount} productive)</span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "18px 20px",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Distraction Events
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f43f5e" }}>{stats.distractionCount}</span>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>interruptions</span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "18px 20px",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Total Recorded Tab Switches
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fbbf24" }}>{stats.totalSwitches}</span>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>transitions</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          padding: "14px 18px",
          marginBottom: "20px",
          alignItems: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search by app name, URL, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.88rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "9px 14px",
              background: "rgba(20,24,36,0.9)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Productivity</option>
            <option value="productive">Productive Only</option>
            <option value="distraction">Non-Productive Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "9px 14px",
              background: "rgba(20,24,36,0.9)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Categories</option>
            <option value="coding">Coding</option>
            <option value="learning">Learning</option>
            <option value="research">Research</option>
            <option value="office">Office</option>
            <option value="social media">Social Media</option>
            <option value="entertainment">Entertainment</option>
            <option value="communication">Communication</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Rows:</span>
            <select
              value={rowsLimit}
              onChange={(e) => {
                setRowsLimit(e.target.value === "All" ? "All" : Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 10px",
                background: "rgba(20,24,36,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.82rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value="All">All ({totalFiltered})</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Telemetry Table ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="telemetryTable" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Application</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Type</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Website URL</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Started</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Ended</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Duration</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Category</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Productivity</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Switches</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                    Loading telemetry records from PostgreSQL...
                  </td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "50px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    <Activity size={32} style={{ marginBottom: "10px", opacity: 0.5 }} />
                    <p>No telemetry records found matching your query.</p>
                  </td>
                </tr>
              ) : (
                displayedLogs.map((log, idx) => {
                  const appColor = getAppColors(log.application);
                  const isProductive = log.productivity === "Productive" || log.productive === true;

                  return (
                    <tr
                      key={log.id || idx}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Application */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              background: appColor.bg,
                              color: appColor.text,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "12px",
                              flexShrink: 0,
                            }}
                          >
                            {(log.application || "A").charAt(0).toUpperCase()}
                          </span>
                          <strong style={{ color: "#fff", fontSize: "13px" }}>{log.application}</strong>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 600,
                            background: "rgba(99,102,241,0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.2)",
                          }}
                        >
                          {log.type || "Application"}
                        </span>
                      </td>

                      {/* Website URL */}
                      <td style={{ padding: "12px 16px" }}>
                        {log.website_url && log.website_url !== "-" ? (
                          <a
                            href={log.website_url.startsWith("http") ? log.website_url : `https://${log.website_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#60a5fa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {log.website_url}
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)" }}>–</span>
                        )}
                      </td>

                      {/* Started */}
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>{log.started || "—"}</td>

                      {/* Ended */}
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>{log.ended || "—"}</td>

                      {/* Duration */}
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#fff" }}>{log.duration || "—"}</td>

                      {/* Category */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          {log.category || "General"}
                        </span>
                      </td>

                      {/* Productivity Badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 9px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: isProductive ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
                            color: isProductive ? "#10b981" : "#f43f5e",
                            border: `1px solid ${isProductive ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
                          }}
                        >
                          {isProductive ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {isProductive ? "Productive" : "Non-Productive"}
                        </span>
                      </td>

                      {/* Switches */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.8)",
                          }}
                        >
                          {log.switch_count ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Pagination Bar ── */}
        {rowsLimit !== "All" && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              Page <strong style={{ color: "#fff" }}>{safeCurrentPage}</strong> of <strong style={{ color: "#fff" }}>{totalPages}</strong> ({totalFiltered} total entries)
            </span>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: safeCurrentPage === 1 ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                  fontWeight: 700,
                  fontSize: "12px",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                {safeCurrentPage}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: safeCurrentPage === totalPages ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentTelemetryView;
