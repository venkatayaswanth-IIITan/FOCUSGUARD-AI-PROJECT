import { useState } from "react";
import {
  AlertTriangle, ShieldAlert, TrendingUp, Clock, Zap, RefreshCw,
  Globe, Monitor, BarChart2, XCircle, Eye, Brain, Filter,
  Shield, Ban, Plus, ChevronRight, Activity, Flame,
  ArrowDownRight, Star,
} from "lucide-react";

/* ── Data ── */
const DISTRACTIONS = [
  { id: 1, app: "Google Chrome", url: "https://twitter.com",        category: "Social Media",  duration: 2220, time: "21:07", severity: "high",   count: 4 },
  { id: 2, app: "Discord",       url: "-",                          category: "Communication", duration: 4560, time: "20:01", severity: "medium", count: 2 },
  { id: 3, app: "Spotify",       url: "-",                          category: "Entertainment", duration: 4140, time: "16:59", severity: "medium", count: 1 },
  { id: 4, app: "Google Chrome", url: "https://facebook.com",       category: "Social Media",  duration: 4380, time: "14:30", severity: "high",   count: 5 },
  { id: 5, app: "Google Chrome", url: "https://facebook.com",       category: "Social Media",  duration: 2880, time: "22:57", severity: "high",   count: 3 },
  { id: 6, app: "Discord",       url: "-",                          category: "Communication", duration: 3780, time: "16:24", severity: "medium", count: 2 },
  { id: 7, app: "Google Chrome", url: "https://reddit.com",         category: "Social Media",  duration: 2700, time: "15:00", severity: "high",   count: 3 },
  { id: 8, app: "YouTube Music", url: "https://music.youtube.com",  category: "Entertainment", duration: 1800, time: "13:30", severity: "low",    count: 1 },
];

const CAT_CFG = {
  "Social Media":  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.28)",   label: "#f87171" },
  "Entertainment": { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.28)",  label: "#a78bfa" },
  "Communication": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)",  label: "#fbbf24" },
  "Gaming":        { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.28)",  label: "#60a5fa" },
};
const getCat = (c) => CAT_CFG[c] || CAT_CFG["Social Media"];

const SEV_CFG = {
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   label: "High" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", label: "Medium" },
  low:    { color: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", label: "Low" },
};
const getSev = (s) => SEV_CFG[s] || SEV_CFG.low;

function fmtMin(secs) {
  const m = Math.round(Number(secs || 0) / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const APP_ICON = { "Google Chrome": "#4285f4", "Discord": "#5865f2", "Spotify": "#1db954", "YouTube Music": "#ff0000" };
const appColor = (a) => APP_ICON[a] || "#6366f1";
const appInitial = (a) => (a || "?").charAt(0).toUpperCase();

/* ─────────────────────────────
   BLOCK RULE CARD
───────────────────────────── */
function BlockRuleCard({ rule, onRemove, onToggle }) {
  const cat = getCat(rule.cat);
  return (
    <div className={`dsBlockCard ${rule.active ? "dsBlockCardOn" : "dsBlockCardOff"}`}>
      <div className="dsBlockCardLeft">
        <div className="dsBlockAvatar" style={{ background: cat.bg, color: cat.color }}>
          <Globe size={13} />
        </div>
        <div>
          <span className="dsBlockName">{rule.name}</span>
          <span className="dsBlockCat" style={{ color: cat.color }}>{rule.cat}</span>
        </div>
      </div>
      <div className="dsBlockCardRight">
        <button
          className={`dsToggleBtn ${rule.active ? "dsToggleOn" : "dsToggleOff"}`}
          onClick={() => onToggle(rule.id)}
          title={rule.active ? "Disable block" : "Enable block"}
        >
          <span className="dsToggleThumb" />
        </button>
        <span className={`dsBlockStatus ${rule.active ? "dsStatusBlocking" : "dsStatusInactive"}`}>
          {rule.active ? "Blocking" : "Paused"}
        </span>
        <button className="dsRemoveBtn" onClick={() => onRemove(rule.id)} title="Remove rule">
          <XCircle size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   MAIN VIEW
───────────────────────────── */
function DistractionsView() {
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [tab, setTab] = useState("overview");
  const [newRule, setNewRule] = useState("");
  const [blockRules, setBlockRules] = useState([
    { id: 1, name: "twitter.com",  cat: "Social Media",  active: true  },
    { id: 2, name: "facebook.com", cat: "Social Media",  active: true  },
    { id: 3, name: "reddit.com",   cat: "Social Media",  active: false },
    { id: 4, name: "youtube.com",  cat: "Entertainment", active: false },
  ]);

  const totalTime   = DISTRACTIONS.reduce((a, d) => a + d.duration, 0);
  const highCount   = DISTRACTIONS.filter(d => d.severity === "high").length;
  const uniqueCats  = [...new Set(DISTRACTIONS.map(d => d.category))];

  const catBreakdown = uniqueCats.map(cat => ({
    cat,
    total: DISTRACTIONS.filter(d => d.category === cat).reduce((a, d) => a + d.duration, 0),
    count: DISTRACTIONS.filter(d => d.category === cat).length,
  })).sort((a, b) => b.total - a.total);
  const maxCat = catBreakdown[0]?.total || 1;

  const hours = Array.from({ length: 24 }, (_, i) => {
    const val = DISTRACTIONS.filter(d => parseInt(d.time) === i).reduce((a, d) => a + d.duration, 0);
    return { h: i, val };
  });
  const maxHour = Math.max(...hours.map(h => h.val), 1);

  const filtered = DISTRACTIONS.filter(d =>
    (catFilter === "all" || d.category === catFilter) &&
    (sevFilter === "all" || d.severity === sevFilter)
  );

  const addRule = () => {
    if (!newRule.trim()) return;
    setBlockRules(p => [...p, { id: Date.now(), name: newRule.trim(), cat: "Social Media", active: true }]);
    setNewRule("");
  };

  const KPI = [
    { icon: Clock,         label: "Time Lost Today",      val: fmtMin(totalTime),      color: "#ef4444", glow: "rgba(239,68,68,0.22)" },
    { icon: AlertTriangle, label: "High-Severity Events", val: highCount,               color: "#f59e0b", glow: "rgba(245,158,11,0.22)" },
    { icon: Activity,      label: "Total Events",         val: DISTRACTIONS.length,    color: "#8b5cf6", glow: "rgba(139,92,246,0.22)" },
    { icon: Globe,         label: "Categories Affected",  val: uniqueCats.length,      color: "#3b82f6", glow: "rgba(59,130,246,0.22)" },
    { icon: Brain,         label: "Risk Score",           val: "High",                  color: "#dc2626", glow: "rgba(220,38,38,0.22)" },
  ];

  const INSIGHTS = [
    { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)",
      title: "Peak Distraction: 14:00–23:00",
      body: "62% of non-productive time is during evening hours. Activate Focus Mode from 9 PM onward." },
    { icon: Flame, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",
      title: "Social Media is #1 Time Drain",
      body: "Twitter, Facebook & Reddit account for 58% of distraction time. A 20-min daily cap could reclaim 1.5h/day." },
    { icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)",
      title: "Communication Interruptions ↓ 15%",
      body: "Discord usage is down 15% vs last week. Keep batching async messages to dedicated time slots." },
  ];

  return (
    <div className="dsPage">
      {/* ── Page Header ── */}
      <div className="dsPageHeader">
        <div className="dsPageHeaderLeft">
          <div className="dsPageIconBadge">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="dsPageTitle">Distraction Intelligence</h2>
            <p className="dsPageSub">Identify, analyze and block digital distractions with AI-powered insights</p>
          </div>
        </div>
        <div className={`dsAlertPill ${highCount > 3 ? "dsAlertRed" : "dsAlertAmber"}`}>
          <AlertTriangle size={13} />
          <span>{highCount} High-Severity events today</span>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="dsKpiStrip">
        {KPI.map((k, i) => {
          const Icon = k.icon;
          return (
            <div className="dsKpiCard" key={i} style={{ "--kpi-glow": k.glow }}>
              <div className="dsKpiIcon" style={{ background: k.color + "18", color: k.color }}>
                <Icon size={18} />
              </div>
              <div>
                <div className="dsKpiVal" style={{ color: k.color }}>{k.val}</div>
                <div className="dsKpiLabel">{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="dsTabs">
        {[
          ["overview",  "Overview",    BarChart2],
          ["timeline",  "Event Timeline", Eye],
          ["blocker",   "App Blocker",  Shield],
        ].map(([v, l, Icon]) => (
          <button
            key={v}
            className={`dsTab ${tab === v ? "dsTabActive" : ""}`}
            onClick={() => setTab(v)}
          >
            <Icon size={13} />
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {tab === "overview" && (
        <div className="dsOverviewGrid">
          {/* Category Breakdown */}
          <div className="dsCard dsCatCard">
            <div className="dsCardHeader">
              <BarChart2 size={14} style={{ color: "#8b5cf6" }} />
              <span>Distraction by Category</span>
            </div>
            <div className="dsCatList">
              {catBreakdown.map((c, i) => {
                const cfg = getCat(c.cat);
                const pct = Math.round((c.total / maxCat) * 100);
                return (
                  <div className="dsCatRow" key={i}>
                    <div className="dsCatRowTop">
                      <div className="dsCatLeft">
                        <div className="dsCatDot" style={{ background: cfg.color }} />
                        <span className="dsCatName">{c.cat}</span>
                        <span className="dsCatEventBadge" style={{ background: cfg.bg, color: cfg.label, border: `1px solid ${cfg.border}` }}>
                          {c.count} events
                        </span>
                      </div>
                      <span className="dsCatTime" style={{ color: cfg.color }}>{fmtMin(c.total)}</span>
                    </div>
                    <div className="dsCatTrack">
                      <div
                        className="dsCatFill"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)` }}
                      />
                    </div>
                    <div className="dsCatPct">{pct}% of peak</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Pattern */}
          <div className="dsCard dsHourCard">
            <div className="dsCardHeader">
              <Zap size={14} style={{ color: "#f59e0b" }} />
              <span>Hourly Distraction Pattern</span>
            </div>
            <div className="dsHourChart">
              {hours.map((h) => {
                const pct = Math.max(2, (h.val / maxHour) * 100);
                const isHigh = h.val > maxHour * 0.6;
                const isMed  = h.val > 0 && !isHigh;
                const barColor = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "rgba(255,255,255,0.07)";
                return (
                  <div className="dsHourCol" key={h.h} title={`${h.h}:00 — ${fmtMin(h.val)}`}>
                    <div
                      className="dsHourBar"
                      style={{
                        height: `${pct}%`,
                        background: barColor,
                        boxShadow: isHigh ? `0 0 8px ${barColor}66` : "none",
                      }}
                    />
                    {h.h % 6 === 0 && <span className="dsHourLabel">{h.h}h</span>}
                  </div>
                );
              })}
            </div>
            <div className="dsHourLegend">
              <span><span className="dsLegDot" style={{ background: "#ef4444" }} /> High</span>
              <span><span className="dsLegDot" style={{ background: "#f59e0b" }} /> Medium</span>
              <span><span className="dsLegDot" style={{ background: "rgba(255,255,255,0.15)" }} /> None</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="dsCard dsInsightsCard">
            <div className="dsCardHeader">
              <Brain size={14} style={{ color: "#8b5cf6" }} />
              <span>AI Distraction Insights</span>
              <span className="dsInsightCount">{INSIGHTS.length} findings</span>
            </div>
            <div className="dsInsightList">
              {INSIGHTS.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <div key={i} className="dsInsightCard" style={{ background: ins.bg, border: `1px solid ${ins.border}` }}>
                    <div className="dsInsightIconWrap" style={{ background: ins.border, color: ins.color }}>
                      <Icon size={15} />
                    </div>
                    <div className="dsInsightBody">
                      <strong className="dsInsightTitle" style={{ color: ins.color }}>{ins.title}</strong>
                      <p className="dsInsightText">{ins.body}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: ins.color, flexShrink: 0, opacity: 0.6 }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TIMELINE TAB ══════════════ */}
      {tab === "timeline" && (
        <div className="dsCard dsTimelineCard">
          {/* Filter Bar */}
          <div className="dsTimelineFilterBar">
            <Filter size={13} style={{ color: "var(--db-t3)" }} />
            <span className="dsFilterLabel">Filter:</span>
            <div className="dsFilterChips">
              {["all", ...uniqueCats].map(c => (
                <button
                  key={c}
                  className={`dsFChip ${catFilter === c ? "dsFChipActive" : ""}`}
                  onClick={() => setCatFilter(c)}
                  style={catFilter === c && c !== "all" ? { background: getCat(c).bg, borderColor: getCat(c).border, color: getCat(c).label } : {}}
                >
                  {c === "all" ? "All Categories" : c}
                </button>
              ))}
            </div>
            <div className="dsFilterDivider" />
            {["all", "high", "medium", "low"].map(s => (
              <button
                key={s}
                className={`dsFChip ${sevFilter === s ? "dsFChipActive" : ""}`}
                onClick={() => setSevFilter(s)}
                style={sevFilter === s && s !== "all" ? { background: getSev(s).bg, borderColor: getSev(s).border, color: getSev(s).color } : {}}
              >
                {s === "all" ? "All Severity" : getSev(s).label}
              </button>
            ))}
          </div>

          {/* Timeline Events */}
          <div className="dsTimelineList">
            {filtered.map((d) => {
              const sev = getSev(d.severity);
              const cat = getCat(d.category);
              return (
                <div className="dsTimelineItem" key={d.id}>
                  {/* Time stamp */}
                  <div className="dsTLTime">{d.time}</div>

                  {/* Connector */}
                  <div className="dsTLConnector">
                    <div className="dsTLDot" style={{ background: sev.color, boxShadow: `0 0 8px ${sev.color}88` }} />
                    <div className="dsTLLine" />
                  </div>

                  {/* Event Card */}
                  <div className="dsTLCard" style={{ borderLeft: `3px solid ${sev.color}` }}>
                    <div className="dsTLCardTop">
                      <div className="dsTLAppIcon" style={{ background: appColor(d.app) + "22", color: appColor(d.app) }}>
                        {appInitial(d.app)}
                      </div>
                      <strong className="dsTLAppName">{d.app}</strong>
                      <span className="dsTLCatTag" style={{ background: cat.bg, color: cat.label, border: `1px solid ${cat.border}` }}>{d.category}</span>
                      <span className="dsTLSevTag" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>{sev.label}</span>
                    </div>
                    {d.url !== "-" && <p className="dsTLUrl">{d.url}</p>}
                    <div className="dsTLMeta">
                      <span><Clock size={11} /> {fmtMin(d.duration)}</span>
                      <span><Zap size={11} /> {d.count} switches</span>
                      {d.severity === "high" && (
                        <span className="dsTLHighAlert"><AlertTriangle size={10} /> Focus Blocker Recommended</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="dsEmptyTimeline">
                <Eye size={32} style={{ opacity: 0.2 }} />
                <p>No events match the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ BLOCKER TAB ══════════════ */}
      {tab === "blocker" && (
        <div className="dsBlockerGrid">
          {/* Block Rules */}
          <div className="dsCard dsBlockerRulesCard">
            <div className="dsCardHeader">
              <Ban size={14} style={{ color: "#ef4444" }} />
              <span>Active Block Rules</span>
              <span className="dsBlockActiveCount">
                {blockRules.filter(r => r.active).length} active
              </span>
            </div>
            {/* Add Rule */}
            <div className="dsAddRuleRow">
              <div className="dsAddRuleInput">
                <Globe size={13} style={{ color: "var(--db-t3)" }} />
                <input
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addRule()}
                  placeholder="Enter URL to block (e.g. twitter.com)"
                />
              </div>
              <button className="dsAddBtn" onClick={addRule} disabled={!newRule.trim()}>
                <Plus size={13} /> Block URL
              </button>
            </div>
            {/* Rules List */}
            <div className="dsBlockRulesList">
              {blockRules.map(r => (
                <BlockRuleCard
                  key={r.id}
                  rule={r}
                  onRemove={(id) => setBlockRules(p => p.filter(x => x.id !== id))}
                  onToggle={(id) => setBlockRules(p => p.map(x => x.id === id ? { ...x, active: !x.active } : x))}
                />
              ))}
            </div>
          </div>

          {/* Blocker Stats */}
          <div className="dsBlockerSideCol">
            <div className="dsCard dsBlockerStatsCard">
              <div className="dsCardHeader">
                <TrendingUp size={14} style={{ color: "#10b981" }} />
                <span>Blocker Effectiveness</span>
              </div>
              <div className="dsBlockStatList">
                {[
                  { icon: Shield,       label: "Blocks This Week", val: "23",                             color: "#10b981" },
                  { icon: Clock,        label: "Focus Time Saved",  val: "4h 12m",                        color: "#3b82f6" },
                  { icon: Star,         label: "Active Rules",      val: blockRules.filter(r=>r.active).length, color: "#8b5cf6" },
                  { icon: ArrowDownRight, label: "Distraction Drop", val: "−38%",                         color: "#f59e0b" },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div className="dsBlockStat" key={i}>
                      <div className="dsBlockStatIcon" style={{ background: s.color + "18", color: s.color }}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="dsBlockStatVal" style={{ color: s.color }}>{s.val}</div>
                        <div className="dsBlockStatLabel">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pro Tips */}
            <div className="dsCard dsBlockerTipsCard">
              <div className="dsCardHeader">
                <Brain size={14} style={{ color: "#8b5cf6" }} />
                <span>Blocking Tips</span>
              </div>
              <div className="dsBlockerTips">
                {[
                  "Block during 9–11 AM deep work window",
                  "Schedule 15-min social check-in at 3 PM",
                  "Use wildcard blocks: *.social.com",
                  "Whitelist work tools before blocking all",
                ].map((tip, i) => (
                  <div className="dsBlockerTip" key={i}>
                    <ChevronRight size={12} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                    <span>{tip}</span>
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

export default DistractionsView;
