import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";

function LandingPage() {
  const navigate = useNavigate();

  // ─── STATE ───
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [insightIdx, setInsightIdx] = useState(0);
  const [insightText, setInsightText] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Counters
  const [heroC, setHeroC] = useState({ focus: 0, prod: 0, attn: 0, dist: 0, deep: 0 });
  const [statC, setStatC] = useState({ score: 0, improve: 0, deep: 0, reduced: 0 });
  const [goalC, setGoalC] = useState({ focus: 0, deep: 0, dist: 0, streak: 0 });

  // Refs
  const sectRefs = useRef([]);
  const heroStarted = useRef(false);
  const statStarted = useRef(false);
  const goalStarted = useRef(false);

  // ─── DATA ───
  const navLinks = ["Home", "Features", "How It Works", "AI Intelligence", "Analytics", "Mobile App"];
  const navIds = ["hero", "features", "pipeline", "ai-intel", "dashboard", "mobile"];

  const aiInsights = [
    "Your strongest focus window is 9:30 AM – 11:45 AM.",
    "You are 34% more productive during morning sessions.",
    "Notifications caused your largest attention interruptions.",
    "Your optimal deep-work session is approximately 52 minutes.",
    "Attention fatigue risk is increasing — take a break soon.",
    "Your focus decreases after frequent task switching.",
  ];

  const problemCards = [
    { icon: "🔔", title: "Constant Interruptions", desc: "Notifications repeatedly break deep work, fragmenting your concentration into unusable pieces.", color: "blue" },
    { icon: "🔄", title: "Context Switching", desc: "Moving between applications increases cognitive load and destroys productivity momentum.", color: "purple" },
    { icon: "👁️", title: "Invisible Attention Leaks", desc: "Traditional screen-time tools show usage but don't explain why focus disappears.", color: "cyan" },
    { icon: "🧠", title: "Cognitive Fatigue", desc: "Long digital sessions gradually reduce attention stability without warning.", color: "orange" },
  ];

  const pipelineSteps = [
    "User Activity Monitoring", "Behavioral Data Collection", "Activity Analysis",
    "AI Attention Analysis", "Distraction Pattern Detection", "Focus Score Generation",
    "Recommendation Engine", "Personalized Insights", "Focus Improvement Actions",
    "Performance Tracking",
  ];

  const features = [
    { icon: "📊", title: "Activity Intelligence", desc: "Track application usage, screen time, session duration, task switching, and notification activity in real-time.", items: ["App Usage", "Screen Time", "Task Switching", "Notifications"], color: "blue", size: "large" },
    { icon: "🛡️", title: "AI Distraction Detection", desc: "Detect frequent interruptions, context switching, notification impact, and focus loss patterns.", items: ["Interruptions", "Context Switches", "Focus Loss"], color: "purple", size: "medium" },
    { icon: "🎯", title: "Intelligent Focus Scores", desc: "Generate daily focus, productivity, attention stability scores and concentration trends.", items: ["Focus Score", "Productivity", "Stability"], color: "cyan", size: "medium" },
    { icon: "📈", title: "Predictive Analytics", desc: "Predict focus degradation, productivity risks, and attention fatigue before they happen.", items: ["Focus Forecast", "Risk Detection", "Fatigue Alert"], color: "green", size: "medium" },
    { icon: "💡", title: "AI Recommendations", desc: "Personalized focus improvement suggestions, productivity tips, and work-pattern optimization.", items: ["Focus Tips", "Recovery", "Optimization"], color: "orange", size: "medium" },
    { icon: "📅", title: "Smart Focus Planner", desc: "AI-recommended optimal work sessions, break schedules, high-focus periods, and task priorities.", items: ["Work Sessions", "Breaks", "Priorities"], color: "pink", size: "large" },
  ];

  const plannerItems = [
    { time: "8:00 AM", task: "Planning", type: "light" },
    { time: "9:00 AM", task: "Deep Focus", type: "deep" },
    { time: "10:30 AM", task: "Short Break", type: "break" },
    { time: "10:45 AM", task: "Deep Work", type: "deep" },
    { time: "12:00 PM", task: "Recovery", type: "break" },
    { time: "2:00 PM", task: "Medium Focus Tasks", type: "medium" },
    { time: "4:00 PM", task: "Collaboration", type: "light" },
    { time: "6:00 PM", task: "Daily Review", type: "light" },
  ];

  const recommendations = [
    { icon: "🔄", title: "Reduce Context Switching", desc: "You switched applications 23 times during your last focus session.", action: "Start Focus Mode", color: "blue" },
    { icon: "⏸️", title: "Optimal Break Detected", desc: "Your attention stability usually drops after approximately 55 minutes.", action: "Schedule Break", color: "green" },
    { icon: "🎯", title: "High Focus Window", desc: "Your strongest concentration period begins around 9:30 AM.", action: "Plan Deep Work", color: "cyan" },
    { icon: "🔕", title: "Notification Risk", desc: "Messaging notifications caused multiple interruptions today.", action: "Enable Smart Notifications", color: "orange" },
  ];

  const techStack = [
    { name: "FastAPI", icon: "⚡" }, { name: "PostgreSQL", icon: "🗄️" },
    { name: "Artificial Intelligence", icon: "🧠" }, { name: "Machine Learning", icon: "🤖" },
    { name: "Behavioral Analytics", icon: "📊" }, { name: "Predictive Modeling", icon: "📈" },
    { name: "Docker", icon: "🐳" }, { name: "Cloud Deployment", icon: "☁️" },
    { name: "Web Application", icon: "🌐" }, { name: "Mobile Application", icon: "📱" },
  ];

  // ─── EFFECTS ───

  // Navbar scroll
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((p) => { const n = new Set(p); n.add(e.target.dataset.s); return n; });
          }
        });
      },
      { threshold: 0.12 }
    );
    sectRefs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  // Hero counters
  useEffect(() => {
    if (visible.has("hero") && !heroStarted.current) {
      heroStarted.current = true;
      animateCounters(
        { focus: 87, prod: 91, attn: 84, dist: 12, deep: 4.53 },
        setHeroC, 2000
      );
    }
  }, [visible]);

  // Stat counters (report section)
  useEffect(() => {
    if (visible.has("report") && !statStarted.current) {
      statStarted.current = true;
      animateCounters({ score: 84, improve: 12, deep: 21.25, reduced: 18 }, setStatC, 2000);
    }
  }, [visible]);

  // Goal counters
  useEffect(() => {
    if (visible.has("goals") && !goalStarted.current) {
      goalStarted.current = true;
      animateCounters({ focus: 85, deep: 18, dist: 24, streak: 12 }, setGoalC, 1800);
    }
  }, [visible]);

  // AI insight typing
  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIdx((p) => (p + 1) % aiInsights.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setInsightText("");
    const text = aiInsights[insightIdx];
    let i = 0;
    const typer = setInterval(() => {
      setInsightText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(typer);
    }, 22);
    return () => clearInterval(typer);
  }, [insightIdx]);

  // ─── HELPERS ───
  function animateCounters(targets, setter, duration) {
    const fps = 60, frames = (duration / 1000) * fps;
    let f = 0;
    const timer = setInterval(() => {
      f++;
      const p = Math.min(f / frames, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const result = {};
      for (const k in targets) {
        const t = targets[k];
        result[k] = Number.isInteger(t) ? Math.round(t * e) : +(t * e).toFixed(t >= 10 ? 1 : 2);
      }
      setter(result);
      if (f >= frames) clearInterval(timer);
    }, 1000 / fps);
  }

  const isV = (id) => visible.has(id);
  const addRef = (el, i) => { sectRefs.current[i] = el; };

  const handleMouse = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  const scrollTo = (id) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 58;
  const focusOffset = circumference - (heroC.focus / 100) * circumference;

  // ─── RENDER ───
  return (
    <div className="landing" onMouseMove={handleMouse}>
      <ParticleBackground />

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav className={`ln-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="ln-nav-inner">
          <div className="ln-brand" onClick={() => scrollTo("hero")}>
            <div className="ln-logo">FG</div>
            <span className="ln-brand-name">FocusGuard AI</span>
          </div>

          <div className={`ln-links ${mobileMenu ? "open" : ""}`}>
            {navLinks.map((l, i) => (
              <a key={i} onClick={() => scrollTo(navIds[i])}>{l}</a>
            ))}
            <div className="ln-links-mobile-actions">
              <button className="ln-btn-ghost" onClick={() => navigate("/login")}>Login</button>
              <button className="ln-btn-primary" onClick={() => navigate("/register")}>Get Started</button>
            </div>
          </div>

          <div className="ln-nav-right">
            <button className="ln-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
            <button
              className="ln-btn-primary"
              onClick={() => navigate("/register")}
              style={{
                background: "linear-gradient(135deg, #10b981, #06d6a0)",
                color: "#052e16",
                fontWeight: 700,
                boxShadow: "0 0 16px rgba(16,185,129,0.4)",
              }}
            >
              Sign Up <span className="ln-arrow">&rarr;</span>
            </button>
          </div>

          <button className="ln-hamburger" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="s-hero" id="hero" ref={(el) => addRef(el, 0)} data-s="hero">
        <div className="hero-glow-orb" style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }} />
        <div className="hero-glow-orb two" style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }} />

        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge"><span className="badge-dot" />AI-Powered Attention Intelligence</div>

            <h1 className="hero-title">
              Protect Your <span className="grad-text">Focus.</span><br />
              Understand Your <span className="grad-text-alt">Distractions.</span><br />
              Master Your <span className="grad-text">Attention.</span>
            </h1>

            <p className="hero-sub">
              FocusGuard AI transforms your digital activity into actionable attention intelligence.
              Understand distraction patterns, predict focus degradation, and build smarter productivity habits.
            </p>

            <div className="hero-actions">
              <button
                className="btn-primary lg"
                onClick={() => navigate("/register")}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
                  color: "#fff",
                }}
              >
                Sign Up <span className="btn-icon">&rarr;</span>
              </button>
              <button className="btn-secondary lg" onClick={() => scrollTo("pipeline")}>
                <span className="play-circle">▶</span> Explore How It Works
              </button>
            </div>

            <div className="hero-trust">
              {["AI Powered", "Privacy Focused", "Behavioral Intelligence", "Personalized Insights"].map((t, i) => (
                <span key={i} className="trust-item"><span className="trust-dot" />{t}</span>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Mockup */}
          <div className="hero-visual" style={{ transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)` }}>
            <div className="hero-dash">
              <div className="hd-header">
                <div className="hd-dots"><span /><span /><span /></div>
                <span className="hd-title">FocusGuard Dashboard</span>
              </div>

              <div className="hd-body">
                <div className="hd-focus-ring-area">
                  <svg className="hd-ring" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="58" className="ring-bg" />
                    <circle cx="70" cy="70" r="58" className="ring-fill"
                      strokeDasharray={circumference} strokeDashoffset={focusOffset} />
                  </svg>
                  <div className="hd-ring-label">
                    <span className="hd-ring-val">{heroC.focus}</span>
                    <span className="hd-ring-sub">Focus Score</span>
                  </div>
                </div>

                <div className="hd-metrics">
                  <div className="hd-metric"><span className="hd-m-val blue">{heroC.prod}%</span><span className="hd-m-lbl">Productivity</span></div>
                  <div className="hd-metric"><span className="hd-m-val cyan">{heroC.attn}%</span><span className="hd-m-lbl">Attention</span></div>
                  <div className="hd-metric"><span className="hd-m-val pink">{heroC.dist}</span><span className="hd-m-lbl">Distractions</span></div>
                  <div className="hd-metric"><span className="hd-m-val green">{heroC.deep > 0 ? `${Math.floor(heroC.deep)}h ${Math.round((heroC.deep % 1) * 60)}m` : "0h 0m"}</span><span className="hd-m-lbl">Deep Focus</span></div>
                </div>

                <div className="hd-chart">
                  {[40, 65, 55, 80, 72, 50, 88].map((v, i) => (
                    <div key={i} className="hd-bar" style={{ height: `${v}%`, animationDelay: `${1.2 + i * 0.08}s` }} />
                  ))}
                </div>
              </div>

              {/* Floating insights */}
              <div className="hd-float-card insight-card" style={{ transform: `translate(${mousePos.x * -4}px, ${mousePos.y * -4}px)` }}>
                <span className="hd-fc-icon">🧠</span>
                <span className="hd-fc-text">{insightText}<span className="typing-cursor">|</span></span>
              </div>

              <div className="hd-float-card warning-card" style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}>
                <span className="hd-fc-icon">⚠️</span>
                <span className="hd-fc-text">Attention fatigue predicted in ~35 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ THE PROBLEM ══════════════ */}
      <section className="s-problem" ref={(el) => addRef(el, 1)} data-s="problem">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">The Problem</span>
            <h2 className="s-title">Your Attention Is Constantly <span className="grad-text">Under Attack</span></h2>
            <p className="s-desc">Notifications, social media, emails and continuous application switching silently fragment your concentration.</p>
          </div>

          <div className={`problem-grid ${isV("problem") ? "anim" : ""}`}>
            {problemCards.map((c, i) => (
              <div className={`problem-card ${c.color}`} key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className={`p-icon ${c.color}`}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ INTRODUCING FOCUSGUARD ══════════════ */}
      <section className="s-intro" ref={(el) => addRef(el, 2)} data-s="intro">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Introduction</span>
            <h2 className="s-title">More Than a <span className="grad-text-alt">Screen-Time Tracker</span></h2>
            <p className="s-desc">FocusGuard AI doesn't simply measure how long you use your devices. It analyzes behavioral patterns to understand when, where and why your attention starts breaking.</p>
          </div>

          <div className={`compare-wrap ${isV("intro") ? "anim" : ""}`}>
            <div className="compare-col traditional">
              <h3>Traditional Tools</h3>
              <ul>
                <li><span className="cmp-x">✕</span> Website Blocking</li>
                <li><span className="cmp-x">✕</span> Screen Time Tracking</li>
                <li><span className="cmp-x">✕</span> Notification Muting</li>
              </ul>
            </div>

            <div className="compare-vs">VS</div>

            <div className="compare-col focusguard">
              <h3>FocusGuard AI</h3>
              <ul>
                <li><span className="cmp-check">✓</span> Attention Pattern Analysis</li>
                <li><span className="cmp-check">✓</span> Distraction Detection</li>
                <li><span className="cmp-check">✓</span> Focus Scoring</li>
                <li><span className="cmp-check">✓</span> Predictive Analytics</li>
                <li><span className="cmp-check">✓</span> Personalized Recommendations</li>
                <li><span className="cmp-check">✓</span> Behavioral Intelligence</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS — PIPELINE ══════════════ */}
      <section className="s-pipeline" id="pipeline" ref={(el) => addRef(el, 3)} data-s="pipeline">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">How It Works</span>
            <h2 className="s-title">From <span className="grad-text">Activity</span> to <span className="grad-text-alt">Intelligence</span></h2>
            <p className="s-desc">An intelligent pipeline that transforms your digital behavior into actionable insights.</p>
          </div>

          <div className={`pipeline-wrap ${isV("pipeline") ? "anim" : ""}`}>
            {pipelineSteps.map((s, i) => (
              <div className="pipe-node" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="pipe-num">{String(i + 1).padStart(2, "0")}</div>
                <span className="pipe-label">{s}</span>
                {i < pipelineSteps.length - 1 && <div className="pipe-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CORE FEATURES — BENTO GRID ══════════════ */}
      <section className="s-features" id="features" ref={(el) => addRef(el, 4)} data-s="features">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Platform Features</span>
            <h2 className="s-title">Everything You Need to Understand Your <span className="grad-text">Attention</span></h2>
          </div>

          <div className={`bento-grid ${isV("features") ? "anim" : ""}`}>
            {features.map((f, i) => (
              <div className={`bento-card ${f.color} ${f.size}`} key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`bento-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="bento-tags">
                  {f.items.map((it, j) => <span key={j} className="bento-tag">{it}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ AI INTELLIGENCE ══════════════ */}
      <section className="s-ai" id="ai-intel" ref={(el) => addRef(el, 5)} data-s="ai">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">AI Engine</span>
            <h2 className="s-title">AI That <span className="grad-text">Understands</span> How You Work</h2>
            <p className="s-desc">FocusGuard AI converts behavioral signals into meaningful attention intelligence.</p>
          </div>

          <div className={`ai-pipeline ${isV("ai") ? "anim" : ""}`}>
            {["Digital Activity", "Behavioral Analytics", "Machine Learning", "Attention Intelligence", "Personalized Actions"].map((s, i) => (
              <div className="ai-node" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="ai-node-dot" />
                <span>{s}</span>
                {i < 4 && <div className="ai-connector" />}
              </div>
            ))}
          </div>

          <div className={`ai-insights-grid ${isV("ai") ? "anim" : ""}`}>
            {aiInsights.slice(0, 5).map((ins, i) => (
              <div className="ai-insight-card" key={i} style={{ animationDelay: `${0.6 + i * 0.12}s` }}>
                <span className="ai-ins-icon">🧠</span>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ANALYTICS DASHBOARD ══════════════ */}
      <section className="s-dashboard" id="dashboard" ref={(el) => addRef(el, 6)} data-s="dashboard">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Analytics</span>
            <h2 className="s-title">Your Focus <span className="grad-text">Command Center</span></h2>
          </div>

          <div className={`dash-showcase ${isV("dashboard") ? "anim" : ""}`}>
            <div className="dash-frame">
              <div className="dash-top-bar">
                <div className="hd-dots"><span /><span /><span /></div>
                <span className="hd-title">Focus Analytics</span>
              </div>

              <div className="dash-content">
                <div className="dash-stats-row">
                  {[
                    { label: "Focus Score", val: "87", color: "blue" },
                    { label: "Productivity", val: "91%", color: "green" },
                    { label: "Attention", val: "84%", color: "cyan" },
                    { label: "Deep Focus", val: "4h 32m", color: "purple" },
                    { label: "Distractions", val: "12", color: "pink" },
                    { label: "Switches", val: "23", color: "orange" },
                  ].map((s, i) => (
                    <div className={`dash-stat ${s.color}`} key={i}>
                      <span className="ds-val">{s.val}</span>
                      <span className="ds-lbl">{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="dash-charts-row">
                  <div className="dash-chart-card">
                    <h4>Weekly Focus Trend</h4>
                    <div className="dash-line-chart">
                      {[62, 78, 55, 87, 72, 68, 85].map((v, i) => (
                        <div key={i} className="dlc-bar-wrap">
                          <div className="dlc-bar" style={{ height: `${v}%` }} />
                          <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dash-chart-card">
                    <h4>Distraction Sources</h4>
                    <div className="dash-dist-list">
                      {[
                        { name: "Social Media", pct: 35, color: "#ff4d8d" },
                        { name: "Notifications", pct: 28, color: "#ff8c42" },
                        { name: "Messaging", pct: 18, color: "#3977ff" },
                        { name: "Email", pct: 12, color: "#00d4ff" },
                        { name: "App Switching", pct: 7, color: "#7654ff" },
                      ].map((d, i) => (
                        <div className="dd-item" key={i}>
                          <div className="dd-info"><span>{d.name}</span><span className="dd-pct">{d.pct}%</span></div>
                          <div className="dd-track"><div className="dd-fill" style={{ width: `${d.pct}%`, background: d.color }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dash-ai-panel">
                  <span className="ai-panel-icon">🧠</span>
                  <p>Tuesday mornings are currently your strongest focus periods. Consider scheduling deep work tasks then.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ SMART FOCUS PLANNER ══════════════ */}
      <section className="s-planner" ref={(el) => addRef(el, 7)} data-s="planner">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Focus Planner</span>
            <h2 className="s-title">Plan Your Day Around <span className="grad-text-alt">Your Brain</span></h2>
          </div>

          <div className="planner-wrap">
            <div className={`planner-timeline ${isV("planner") ? "anim" : ""}`}>
              {plannerItems.map((item, i) => (
                <div className={`pl-item ${item.type}`} key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="pl-time">{item.time}</span>
                  <div className="pl-dot-line">
                    <div className={`pl-dot ${item.type}`} />
                    {i < plannerItems.length - 1 && <div className="pl-line" />}
                  </div>
                  <div className="pl-task">{item.task}</div>
                </div>
              ))}
            </div>

            <div className={`planner-ai-card ${isV("planner") ? "anim" : ""}`}>
              <span className="pai-icon">🧠</span>
              <p>Based on your attention history, schedule your most demanding task between <strong>9:15 AM and 11:00 AM</strong>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ RECOMMENDATIONS ══════════════ */}
      <section className="s-recs" ref={(el) => addRef(el, 8)} data-s="recs">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Smart Recommendations</span>
            <h2 className="s-title">Personalized <span className="grad-text">Action Plans</span></h2>
          </div>

          <div className={`recs-stack ${isV("recs") ? "anim" : ""}`}>
            {recommendations.map((r, i) => (
              <div className={`rec-card ${r.color}`} key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className={`rec-icon ${r.color}`}>{r.icon}</div>
                <div className="rec-content">
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
                <button className={`rec-action ${r.color}`}>{r.action}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ GOALS & HABITS ══════════════ */}
      <section className="s-goals" ref={(el) => addRef(el, 9)} data-s="goals">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Goals & Habits</span>
            <h2 className="s-title">Turn Better Focus Into a <span className="grad-text-alt">Habit</span></h2>
          </div>

          <div className={`goals-grid ${isV("goals") ? "anim" : ""}`}>
            {[
              { label: "Weekly Focus Goal", value: `${goalC.focus}%`, pct: goalC.focus, color: "blue" },
              { label: "Deep Work Goal", value: `${goalC.deep} / 20 hrs`, pct: (goalC.deep / 20) * 100, color: "cyan" },
              { label: "Distraction Reduction", value: `-${goalC.dist}%`, pct: goalC.dist * 2, color: "green" },
              { label: "Focus Streak", value: `${goalC.streak} Days`, pct: (goalC.streak / 14) * 100, color: "orange" },
            ].map((g, i) => (
              <div className={`goal-card ${g.color}`} key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <h4>{g.label}</h4>
                <span className={`goal-val ${g.color}`}>{g.value}</span>
                <div className="goal-bar-track">
                  <div className={`goal-bar-fill ${g.color}`} style={{ width: `${Math.min(g.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ WEEKLY REPORT ══════════════ */}
      <section className="s-report" ref={(el) => addRef(el, 10)} data-s="report">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Weekly Report</span>
            <h2 className="s-title">Understand Your Week in <span className="grad-text">Seconds</span></h2>
          </div>

          <div className={`report-card ${isV("report") ? "anim" : ""}`}>
            <div className="report-stats">
              {[
                { label: "Avg Focus Score", val: statC.score, suffix: "", color: "blue" },
                { label: "Focus Improvement", val: `+${statC.improve}`, suffix: "%", color: "green" },
                { label: "Deep Work", val: `${Math.floor(statC.deep)}h ${Math.round((statC.deep % 1) * 60)}m`, suffix: "", color: "cyan" },
                { label: "Distractions Reduced", val: statC.reduced, suffix: "%", color: "pink" },
              ].map((s, i) => (
                <div className="rpt-stat" key={i}>
                  <span className={`rpt-val ${s.color}`}>{s.val}{s.suffix}</span>
                  <span className="rpt-lbl">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="report-extras">
              <div className="rpt-row"><span className="rpt-k">Best Focus Day</span><span className="rpt-v">Tuesday</span></div>
              <div className="rpt-row"><span className="rpt-k">Strongest Window</span><span className="rpt-v">9 AM – 11 AM</span></div>
            </div>
            <div className="report-ai">
              <span>🧠</span>
              <p>Your attention stability improved this week. Reducing afternoon notification activity could further improve productivity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ MOBILE APP ══════════════ */}
      <section className="s-mobile" id="mobile" ref={(el) => addRef(el, 11)} data-s="mobile">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Mobile App</span>
            <h2 className="s-title">Your Focus Intelligence, <span className="grad-text-alt">Everywhere</span></h2>
          </div>

          <div className={`mobile-showcase ${isV("mobile") ? "anim" : ""}`}>
            <div className="phones-row">
              {[
                { title: "Focus Dashboard", icon: "📊", val: "87", sub: "Focus Score" },
                { title: "Daily Score", icon: "🎯", val: "91%", sub: "Productivity" },
                { title: "Activity Insights", icon: "📈", val: "4h 32m", sub: "Deep Focus" },
                { title: "Goals", icon: "🏆", val: "12", sub: "Day Streak" },
                { title: "AI Recommendations", icon: "🧠", val: "3", sub: "New Tips" },
              ].map((screen, i) => (
                <div className="phone-mockup" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="phone-notch" />
                  <div className="phone-screen">
                    <span className="ps-icon">{screen.icon}</span>
                    <span className="ps-title">{screen.title}</span>
                    <span className="ps-val">{screen.val}</span>
                    <span className="ps-sub">{screen.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mobile-features">
              {["Focus Dashboard", "Activity Insights", "Productivity Reports", "Goal Tracking", "Smart Recommendations"].map((f, i) => (
                <span className="mob-feat" key={i}><span className="mf-check">✓</span>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ ARCHITECTURE ══════════════ */}
      <section className="s-arch" ref={(el) => addRef(el, 12)} data-s="arch">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Architecture</span>
            <h2 className="s-title">Platform <span className="grad-text">Architecture</span></h2>
          </div>

          <div className={`arch-flow ${isV("arch") ? "anim" : ""}`}>
            {[
              { name: "Web / Mobile App", icon: "🌐" },
              { name: "FastAPI Backend", icon: "⚡" },
              { name: "Auth & APIs", icon: "🔐" },
              { name: "PostgreSQL", icon: "🗄️" },
              { name: "Behavioral Analytics", icon: "📊" },
              { name: "AI / ML Engine", icon: "🧠" },
              { name: "Recommendation Engine", icon: "💡" },
              { name: "Analytics & Reporting", icon: "📈" },
            ].map((node, i) => (
              <div className="arch-node" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="arch-icon">{node.icon}</span>
                <span className="arch-label">{node.name}</span>
                {i < 7 && <div className="arch-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ADMIN PLATFORM ══════════════ */}
      <section className="s-admin" ref={(el) => addRef(el, 13)} data-s="admin">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Administration</span>
            <h2 className="s-title">Administrative <span className="grad-text-alt">Analytics Dashboard</span></h2>
          </div>

          <div className={`admin-grid ${isV("admin") ? "anim" : ""}`}>
            {[
              { icon: "👥", title: "User Analytics", desc: "Monitor user engagement and activity patterns." },
              { icon: "📡", title: "System Monitoring", desc: "Real-time system health and performance metrics." },
              { icon: "🤖", title: "AI Model Monitoring", desc: "Track AI model accuracy and prediction quality." },
              { icon: "📊", title: "Platform Statistics", desc: "Usage statistics and growth analytics." },
              { icon: "📈", title: "Usage Analytics", desc: "Feature adoption and user behavior insights." },
              { icon: "⚡", title: "Performance Monitoring", desc: "API response times and infrastructure health." },
            ].map((card, i) => (
              <div className="admin-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="adm-icon">{card.icon}</span>
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PRIVACY & SECURITY ══════════════ */}
      <section className="s-privacy" ref={(el) => addRef(el, 14)} data-s="privacy">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Security</span>
            <h2 className="s-title">Your Attention Data Deserves <span className="grad-text">Protection</span></h2>
          </div>

          <div className={`privacy-grid ${isV("privacy") ? "anim" : ""}`}>
            {[
              { icon: "🔐", title: "Secure Authentication", desc: "Protected account access and authorization with industry-standard protocols." },
              { icon: "🛡️", title: "Privacy-Focused Analytics", desc: "Activity information is processed responsibly with privacy-first architecture." },
              { icon: "☁️", title: "Secure Infrastructure", desc: "Protected APIs, encrypted database architecture and secure cloud deployment." },
            ].map((c, i) => (
              <div className="privacy-card" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="prv-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TECHNOLOGY ══════════════ */}
      <section className="s-tech" ref={(el) => addRef(el, 15)} data-s="tech">
        <div className="container">
          <div className="s-header">
            <span className="s-badge">Technology</span>
            <h2 className="s-title">Built for Intelligent <span className="grad-text-alt">Attention Analytics</span></h2>
          </div>

          <div className={`tech-grid ${isV("tech") ? "anim" : ""}`}>
            {techStack.map((t, i) => (
              <div className="tech-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="tech-icon">{t.icon}</span>
                <span className="tech-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="s-cta" ref={(el) => addRef(el, 16)} data-s="cta">
        <div className="cta-glow" />
        <div className="container">
          <div className={`cta-inner ${isV("cta") ? "anim" : ""}`}>
            <h2 className="cta-title">
              Your Time Is <span className="grad-text">Valuable.</span><br />
              Your Attention Is <span className="grad-text-alt">Priceless.</span>
            </h2>
            <p className="cta-desc">Understand your digital behavior, reduce distractions and build healthier focus habits with FocusGuard AI.</p>
            <div className="cta-actions">
              <button
                className="btn-primary lg"
                onClick={() => navigate("/register")}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
                  color: "#fff",
                }}
              >
                Sign Up <span className="btn-icon">&rarr;</span>
              </button>
              <button className="btn-secondary lg" onClick={() => scrollTo("features")}>
                Explore FocusGuard AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="s-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="ln-logo">FG</div>
              <div>
                <span className="ln-brand-name">FocusGuard AI</span>
                <p className="footer-tagline">Human Attention Preservation &amp; Digital Distraction Intelligence Platform</p>
              </div>
            </div>

            <div className="footer-cols">
              <div className="footer-col">
                <h5>Product</h5>
                <a onClick={() => scrollTo("features")}>Features</a>
                <a onClick={() => scrollTo("ai-intel")}>AI Intelligence</a>
                <a onClick={() => scrollTo("dashboard")}>Analytics</a>
                <a onClick={() => scrollTo("mobile")}>Mobile</a>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <a href="#">Privacy</a>
                <a href="#">Documentation</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 FocusGuard AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
