import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Sliders,
  Save,
  CheckCircle,
  Palette,
  Layout,
  RefreshCw,
  Monitor,
  Check,
  Database
} from "lucide-react";


const THEME_PRESETS = [
  {
    id: "light",
    name: "Light White",
    desc: "Bright, crisp white daylight mode — clean and professional",
    colors: ["#ffffff", "#2563eb", "#0f172a"],
    badge: "Light"
  },
  {
    id: "dark",
    name: "Dark Black-Blue",
    desc: "Deep navy black with electric blue accents — sleek dark mode",
    colors: ["#03080f", "#1e3a8a", "#3977ff"],
    badge: "Dark"
  },
];


function SettingsView() {
  const [user, setUser] = useState({
    username: "swarup",
    full_name: "Swarup Chandane",
    email: "swarup@focusguard.ai",
    role: "Coding & Software Engineering"
  });

  // Theme & Appearance State (Defaulting to Dark Obsidian theme)
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("focusguard_accent") || "blue");
  const [enableGlass, setEnableGlass] = useState(() => localStorage.getItem("focusguard_glass") !== "false");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("focusguard_compact") === "true");

  // Engine Threshold State
  const [idleThreshold, setIdleThreshold] = useState(60);
  const [rapidThreshold, setRapidThreshold] = useState(3);
  const [autoMonitoring, setAutoMonitoring] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState("");

  // Fetch initial profile from PostgreSQL API
  useEffect(() => {
    async function loadUserProfile() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser({
            username: data.username || "swarup",
            full_name: data.full_name || "Swarup Chandane",
            email: data.email || "swarup@focusguard.ai",
            role: data.role || "Coding & Software Engineering"
          });
          localStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error loading user profile from PostgreSQL:", err);
      }
    }
    loadUserProfile();

    try {
      const storedSettings = localStorage.getItem("focusguard_settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.idleThreshold) setIdleThreshold(parsed.idleThreshold);
        if (parsed.rapidThreshold) setRapidThreshold(parsed.rapidThreshold);
        if (parsed.autoMonitoring !== undefined) setAutoMonitoring(parsed.autoMonitoring);
        if (parsed.desktopNotifications !== undefined) setDesktopNotifications(parsed.desktopNotifications);
        if (parsed.soundAlerts !== undefined) setSoundAlerts(parsed.soundAlerts);
      }
    } catch (e) {
      console.error("Error loading stored settings:", e);
    }
  }, []);

  const applyTheme = (themeId) => {
    setSelectedTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    if (themeId === "light") {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    }
    localStorage.setItem("theme", themeId);
  };

  const handleAccentChange = (accId) => {
    setAccentColor(accId);
    localStorage.setItem("focusguard_accent", accId);
    document.documentElement.setAttribute("data-accent", accId);
  };

  const handleGlassToggle = (val) => {
    setEnableGlass(val);
    localStorage.setItem("focusguard_glass", String(val));
    document.documentElement.setAttribute("data-glass", String(val));
  };

  const handleCompactToggle = (val) => {
    setCompactMode(val);
    localStorage.setItem("focusguard_compact", String(val));
    document.documentElement.setAttribute("data-compact", String(val));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // 1. Save local preferences
    localStorage.setItem(
      "focusguard_settings",
      JSON.stringify({
        idleThreshold,
        rapidThreshold,
        autoMonitoring,
        desktopNotifications,
        soundAlerts,
        theme: selectedTheme,
        accent: accentColor,
        glass: enableGlass,
        compact: compactMode
      })
    );

    // 2. Automatically update PostgreSQL database via API
    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setDbStatusMsg("✅ Profile & Name successfully updated in PostgreSQL database!");
      } else {
        setDbStatusMsg("⚠️ Local settings saved. PostgreSQL update failed.");
      }
    } catch (err) {
      console.error("Error saving profile to PostgreSQL:", err);
      setDbStatusMsg("⚠️ Saved locally.");
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setDbStatusMsg("");
    }, 4000);
  };

  const handleResetDefaults = () => {
    applyTheme("light");
    handleAccentChange("blue");
    handleGlassToggle(true);
    handleCompactToggle(false);
    setIdleThreshold(60);
    setRapidThreshold(3);
    setAutoMonitoring(true);
    setDesktopNotifications(true);
    setSoundAlerts(false);
    setSavedSuccess(true);
    setDbStatusMsg("Reset theme to White Daylight Mode!");
    setTimeout(() => {
      setSavedSuccess(false);
      setDbStatusMsg("");
    }, 3000);
  };

  return (
    <div className="settingsViewContainer">
      {/* HEADER PANEL */}
      <div className="panel settingsHeaderPanel">
        <div className="settingsHeaderLeft">
          <div className="settingsHeaderIcon">
            <Settings size={26} />
          </div>
          <div>
            <span className="eyebrow">SYSTEM & APPEARANCE CONFIGURATION</span>
            <h2>Platform Settings & Professional Dashboard Themes</h2>
            <p>Customize real-time telemetry thresholds, dark/light white themes, user profile, and PostgreSQL database updates.</p>
          </div>
        </div>

        <div className="settingsHeaderActions">
          <button type="button" onClick={handleResetDefaults} className="btnResetDefaults">
            <RefreshCw size={14} />
            <span>Reset to White Theme</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="alertSuccessBanner">
          <CheckCircle size={18} style={{ marginRight: 8 }} />
          {dbStatusMsg || "Configuration settings and dashboard theme preferences updated successfully!"}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="settingsFormGrid">
        
        {/* SECTION 1: USER PROFILE & AUTOMATIC POSTGRESQL UPDATE */}
        <div className="panel settingsCard fullWidthCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">USER PROFILE & POSTGRESQL SYNC</span>
              <h3>Edit Account Identity (Auto Syncs to PostgreSQL)</h3>
            </div>
            <Database size={22} className="iconGreen" />
          </div>

          <div className="accountGrid">
            <div className="formGroup">
              <label>Full Display Name:</label>
              <input
                type="text"
                value={user.full_name || ""}
                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                className="editableInput"
                placeholder="Enter Full Name..."
              />
              <small>Updates your name on the dashboard and in PostgreSQL.</small>
            </div>

            <div className="formGroup">
              <label>Username:</label>
              <input
                type="text"
                value={user.username || ""}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                className="editableInput"
                placeholder="Enter Username..."
              />
              <small>System handle used for authentication.</small>
            </div>

            <div className="formGroup">
              <label>Email Address:</label>
              <input
                type="email"
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="editableInput"
                placeholder="Enter Email..."
              />
              <small>Primary email address linked to PostgreSQL user record.</small>
            </div>
          </div>
        </div>

        {/* SECTION 2: THEME — LIGHT WHITE or DARK BLACK-BLUE */}
        <div className="panel settingsCard fullWidthCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">VISUAL THEME</span>
              <h3>Choose Dashboard Theme</h3>
            </div>
            <Palette size={22} className="iconBlue" />
          </div>

          <div className="themePresetsGrid twoThemeGrid">
            {THEME_PRESETS.map((t) => {
              const isActive = selectedTheme === t.id;
              return (
                <div
                  key={t.id}
                  className={`themePresetCard ${isActive ? "active" : ""}`}
                  onClick={() => applyTheme(t.id)}
                >
                  <div className="themePreviewHeader">
                    <div className="themeColorDots">
                      {t.colors.map((c, idx) => (
                        <span key={idx} className="colorDot" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="themeBadge">{t.badge}</span>
                  </div>

                  <div className="themePresetInfo">
                    <h4>{t.name}</h4>
                    <p>{t.desc}</p>
                  </div>

                  {isActive && (
                    <div className="activeCheckBadge">
                      <Check size={14} />
                      <span>Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Layout density toggle */}
          <div className="visualSubSection" style={{ marginTop: 20 }}>
            <div className="subSectionGroup">
              <label className="subSectionLabel">
                <Layout size={16} />
                <span>Layout Options:</span>
              </label>
              <div className="togglesGrid">
                <label className="checkboxLabel customToggle">
                  <input
                    type="checkbox"
                    checked={enableGlass}
                    onChange={(e) => handleGlassToggle(e.target.checked)}
                  />
                  <span className="toggleSlider" />
                  <span className="toggleText">Glassmorphism & Shadow Cards</span>
                </label>
                <label className="checkboxLabel customToggle">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => handleCompactToggle(e.target.checked)}
                  />
                  <span className="toggleSlider" />
                  <span className="toggleText">Compact Layout Density</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: WINDOWS TELEMETRY & IDLE DETECTION */}
        <div className="panel settingsCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">WIN32 MONITORING ENGINE</span>
              <h3>Inactivity & Burst Sensitivity</h3>
            </div>
            <Sliders size={20} className="iconPurple" />
          </div>

          <div className="formGroup">
            <label>Idle Detection Threshold (Seconds):</label>
            <div className="inputWithRange">
              <input
                type="number"
                min="10"
                max="600"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(Number(e.target.value))}
                className="numberInput"
              />
              <input
                type="range"
                min="10"
                max="600"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(Number(e.target.value))}
                className="rangeSlider"
              />
            </div>
            <small>Duration of zero system input before recording an Idle Event.</small>
          </div>

          <div className="formGroup">
            <label>Rapid Switching Sensitivity (Switches/3 min):</label>
            <div className="inputWithRange">
              <input
                type="number"
                min="2"
                max="10"
                value={rapidThreshold}
                onChange={(e) => setRapidThreshold(Number(e.target.value))}
                className="numberInput"
              />
              <input
                type="range"
                min="2"
                max="10"
                value={rapidThreshold}
                onChange={(e) => setRapidThreshold(Number(e.target.value))}
                className="rangeSlider"
              />
            </div>
            <small>Threshold of context switches within 3 minutes to flag Context Fragmentation.</small>
          </div>

          <div className="formGroup checkboxGroup" style={{ marginTop: 16 }}>
            <label className="checkboxLabel customToggle">
              <input
                type="checkbox"
                checked={autoMonitoring}
                onChange={(e) => setAutoMonitoring(e.target.checked)}
              />
              <span className="toggleSlider" />
              <span className="toggleText">Auto-start telemetry session when Python Agent connects</span>
            </label>
          </div>
        </div>

        {/* SECTION 4: NOTIFICATIONS & SOUND ALERTS */}
        <div className="panel settingsCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">ALERTS & FEEDBACK</span>
              <h3>Notifications & Sound Controls</h3>
            </div>
            <Bell size={20} className="iconAmber" />
          </div>

          <div className="formGroup checkboxGroup">
            <label className="checkboxLabel customToggle">
              <input
                type="checkbox"
                checked={desktopNotifications}
                onChange={(e) => setDesktopNotifications(e.target.checked)}
              />
              <span className="toggleSlider" />
              <span className="toggleText">Real-Time WebSocket Toast Notifications</span>
            </label>
          </div>

          <div className="formGroup checkboxGroup" style={{ marginTop: 16 }}>
            <label className="checkboxLabel customToggle">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
              />
              <span className="toggleSlider" />
              <span className="toggleText">Audible Warning Tone on High Distraction Burst</span>
            </label>
          </div>

          <div className="livePreviewCard">
            <div className="previewTitle">
              <Monitor size={14} />
              <span>Live Theme Component Preview</span>
            </div>
            <div className="previewSample">
              <span className="previewBadge">Productive Session</span>
              <span className="previewMetric">98.4% Focus Score</span>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="panel settingsCard fullWidthCard" style={{ padding: "16px 24px" }}>
          <div className="saveActionsRow" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
            <button type="submit" className="btn btnPrimary saveBtn">
              <Save size={18} />
              <span>Save & Automatically Sync to PostgreSQL</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

export default SettingsView;
