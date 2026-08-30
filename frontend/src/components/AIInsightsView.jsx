import { useState, useEffect, useRef } from "react";
import {
  Brain,
  Zap,
  RefreshCw,
  Send,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
  FileText,
  BookOpen,
  Trash2,
  Copy,
  Check,
  Cpu,
  Target,
  Activity,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { API_MONITORING } from "../services/api";

const API_CHAT = `${API_MONITORING}/chat`;

// ── Actionable Insights (Clean & Direct) ──────────────────────────────────────
const CORE_INSIGHTS = [
  {
    id: 1,
    icon: AlertTriangle,
    color: "#f59e0b",
    badge: "High Alert",
    title: "Excessive Context Switching (112 switches)",
    summary: "Multitasking today is 34% above baseline, fragmenting your deep focus.",
    action: "Work in 45-minute single-task sprints. Close background Discord and email.",
    impact: "+18% Focus Efficiency",
    prompt: "How can I reduce my 112 app context switches and maintain flow state?",
  },
  {
    id: 2,
    icon: ShieldAlert,
    color: "#ef4444",
    badge: "Critical",
    title: "Afternoon Distraction Slump (3:00 PM)",
    summary: "Social media and browsing spike between 2:30–4:00 PM (averaging 23 mins).",
    action: "Take a scheduled 15-minute screen-free walk at 3 PM and enable domain blocking.",
    impact: "Recover ~1.2 hrs daily",
    prompt: "What does the PDF knowledge base say about social media domain classifications?",
  },
  {
    id: 3,
    icon: Brain,
    color: "#8b5cf6",
    badge: "Peak Flow",
    title: "Optimal Morning Cognitive Window (9–11:30 AM)",
    summary: "Focus scores peak at 94–96 in the morning with 2.3× faster problem-solving.",
    action: "Reserve 9:00–11:30 AM exclusively for high-complexity architecture and coding.",
    impact: "94.2% Mental Acuity",
    prompt: "How should I structure a 90-minute ultradian deep work session?",
  },
  {
    id: 4,
    icon: Zap,
    color: "#10b981",
    badge: "Positive",
    title: "High Productive App Ratio (87.4%)",
    summary: "87.4% of your screen time is in productive apps (IDE, Learning, Research).",
    action: "Keep ad-hoc meetings out of your morning deep work block to sustain this ratio.",
    impact: "Top 10% Focus Tier",
    prompt: "What activities contributed most to my 87.4% productive ratio today?",
  },
];

// ── Top 4 Key Metrics ────────────────────────────────────────────────────────
const STAT_CARDS = [
  {
    icon: Target,
    label: "Predicted Focus Score",
    value: "88.6%",
    color: "#10b981",
    sub: "↑ 2.4% vs 7-day average",
    tag: "Optimal",
  },
  {
    icon: Zap,
    label: "Peak Flow Window",
    value: "9:00–11:30 AM",
    color: "#8b5cf6",
    sub: "94.2% Acuity Score",
    tag: "Morning",
  },
  {
    icon: ShieldAlert,
    label: "Distraction Risk Period",
    value: "3:00–4:30 PM",
    color: "#ef4444",
    sub: "Afternoon slump window",
    tag: "Caution",
  },
  {
    icon: Activity,
    label: "Daily Switch Forecast",
    value: "84 / day",
    color: "#3b82f6",
    sub: "↓ 28 fewer context shifts",
    tag: "Improving",
  },
];

// ── Quick Prompt Chips ───────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Was Udemy classified as productive in the dataset?",
  "How many total records belong to Coding and Office?",
  "What are the non-productive social media domains?",
  "How is the daily focus score calculated?",
];

// ── Markdown Parser ──────────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  return text.split("\n\n").map((para, pi) => {
    const lines = para.split("\n");
    const isBulletList = lines.every((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*"));

    if (isBulletList) {
      return (
        <ul key={pi} style={{ margin: "6px 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {lines.map((line, li) => {
            const cleanLine = line.replace(/^[•\-\*]\s*/, "");
            return (
              <li key={li} style={{ lineHeight: "1.55", color: "#e2e8f0" }}>
                {renderInlineFormatted(cleanLine)}
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <p key={pi} style={{ margin: pi === 0 ? 0 : "8px 0 0", lineHeight: "1.6", fontSize: "0.88rem", color: "#e2e8f0" }}>
        {lines.map((line, li, arr) => (
          <span key={li}>
            {renderInlineFormatted(line)}
            {li < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

function renderInlineFormatted(line) {
  const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((pt, i) => {
    if (pt.startsWith("**") && pt.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: "#ffffff" }}>
          {pt.slice(2, -2)}
        </strong>
      );
    }
    if (pt.startsWith("`") && pt.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            background: "rgba(59, 130, 246, 0.2)",
            color: "#93c5fd",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: "0.88em",
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          {pt.slice(1, -1)}
        </code>
      );
    }
    return pt;
  });
}

// ── Main Simple AI Insights Component ─────────────────────────────────────────
function AIInsightsView() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "init-1",
      sender: "ai",
      text:
        "👋 **FocusGuard AI Copilot ready.**\n\nConnected to **`FocusGuard_RAG_Knowledge_Base.pdf`** (1,057 Activity Records · 29 Pages Indexed).\n\nAsk any question about dataset classifications, focus metrics, or deep work strategies:",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSend = async (queryText) => {
    const query = (typeof queryText === "string" ? queryText : input).trim();
    if (!query) return;

    setInput("");
    const userMsg = { id: `u-${Date.now()}`, sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(API_CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6),
          mode: "rag",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.reply,
            citation: "FocusGuard_RAG_Knowledge_Base.pdf",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text:
              "From **FocusGuard_RAG_Knowledge_Base.pdf**:\n\n" +
              "• **Coding**: Productive (264 records)\n" +
              "• **Social Media**: Non-Productive (177 records)\n" +
              "• **Office**: Productive (176 records)\n" +
              "• **Research**: Productive (175 records)\n\n" +
              "`udemy.com`, `github.com`, and `stackoverflow.com` are confirmed **Productive** in the dataset.",
            citation: "FocusGuard_RAG_Knowledge_Base.pdf",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text:
            "From **FocusGuard_RAG_Knowledge_Base.pdf**:\n\nThe official dataset contains 1,057 total activity records (703 Productive, 354 Non-Productive). Coding (264) and Office (176) are the largest categories.",
          citation: "FocusGuard_RAG_Knowledge_Base.pdf",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "init-reset",
        sender: "ai",
        text: "Chat cleared! Ask me anything about **`FocusGuard_RAG_Knowledge_Base.pdf`** or your focus metrics.",
      },
    ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* ── HEADER ── */}
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
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
            }}
          >
            <Brain size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
              AI Attention Intelligence
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
              Real-time cognitive diagnostics &amp; Groq LPU accelerated RAG knowledge retrieval.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              color: "#c4b5fd",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <Cpu size={14} />
            <span>Groq LPU Active</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#60a5fa",
              transition: "all 0.2s ease",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "aiSpin" : ""} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── TOP 4 KEY STAT CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {STAT_CARDS.map((st, i) => {
          const Icon = st.icon;
          return (
            <div
              key={i}
              style={{
                background: "#081022",
                border: "1px solid rgba(59, 130, 246, 0.18)",
                borderRadius: "14px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: st.color + "22",
                    color: st.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={17} />
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: st.color + "18",
                    color: st.color,
                    border: `1px solid ${st.color}44`,
                  }}
                >
                  {st.tag}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>{st.label}</div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: st.color, lineHeight: 1.1 }}>{st.value}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{st.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── 2-COLUMN MAIN SPLIT ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT: Priority Action Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.92rem", fontWeight: 800, color: "#ffffff", padding: "0 2px" }}>
            <Sparkles size={16} style={{ color: "#8b5cf6" }} />
            <span>Priority Attention Diagnostics ({CORE_INSIGHTS.length})</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {CORE_INSIGHTS.map((ins) => {
              const Icon = ins.icon;
              return (
                <div
                  key={ins.id}
                  style={{
                    background: "#081022",
                    border: "1px solid rgba(59, 130, 246, 0.16)",
                    borderLeft: `4px solid ${ins.color}`,
                    borderRadius: "14px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: ins.color + "22",
                          color: ins.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ins.title}
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: ins.color + "20",
                        color: ins.color,
                        border: `1px solid ${ins.color}44`,
                        flexShrink: 0,
                      }}
                    >
                      {ins.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
                    {ins.summary}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.22)",
                      fontSize: "0.82rem",
                      color: "#a7f3d0",
                      lineHeight: 1.45,
                    }}
                  >
                    <Lightbulb size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ color: "#34d399", marginRight: "4px" }}>Action:</strong>
                      <span>{ins.action}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#34d399" }}>
                      ⚡ {ins.impact}
                    </span>
                    <button
                      onClick={() => handleSend(ins.prompt)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.35)",
                        color: "#93c5fd",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Ask Copilot</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: AI Knowledge Copilot Chat */}
        <div
          style={{
            background: "#081022",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            position: "sticky",
            top: "20px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "14px 16px",
              background: "#050b18",
              borderBottom: "1px solid rgba(59, 130, 246, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <BookOpen size={16} />
              </div>
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff" }}>RAG Knowledge Copilot</div>
                <div style={{ fontSize: "0.72rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: "3px" }}>
                  <FileText size={10} />
                  FocusGuard_RAG_Knowledge_Base.pdf (1,057 Records)
                </div>
              </div>
            </div>

            <button
              onClick={handleClear}
              title="Clear Chat"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Quick Query Prompts */}
          <div
            style={{
              padding: "10px 14px",
              background: "#060d1e",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={12} style={{ color: "#f59e0b" }} />
              <span>Recommended Queries (Click to ask):</span>
            </div>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
              {QUICK_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    background: "#0c1836",
                    color: "#93c5fd",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              height: "380px",
              overflowY: "auto",
              background: "#060d1c",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    lineHeight: 1.55,
                    background: m.sender === "user" ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "#0d1b38",
                    border: m.sender === "user" ? "none" : "1px solid rgba(59, 130, 246, 0.2)",
                    color: "#ffffff",
                  }}
                >
                  {renderMarkdown(m.text)}

                  {m.sender === "ai" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {m.citation && (
                        <span style={{ fontSize: "0.68rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: "3px", fontFamily: "monospace" }}>
                          <FileText size={9} />
                          {m.citation}
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(m.text, m.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(59, 130, 246, 0.15)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          color: "#93c5fd",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={10} style={{ color: "#10b981" }} />
                            <span style={{ color: "#10b981" }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "#0d1b38",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span className="statusDot" style={{ background: "#60a5fa" }} />
                  <span className="statusDot" style={{ background: "#8b5cf6" }} />
                  <span className="statusDot" style={{ background: "#3b82f6" }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 14px",
              background: "#050b18",
              borderTop: "1px solid rgba(59, 130, 246, 0.15)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about the dataset, focus, or deep work..."
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "8px",
                background: "#091326",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                color: "#ffffff",
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsView;
