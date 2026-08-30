import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Clock,
  Flame,
  AlertTriangle,
  LineChart,
  Sparkles,
  BarChart3,
  Target,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";


const menu = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "live", icon: Activity, label: "Activity" },
  { id: "recently", icon: Clock, label: "Recently" },
  { id: "sessions", icon: Flame, label: "Focus Sessions" },
  { id: "distractions", icon: AlertTriangle, label: "Distractions" },
  { id: "analytics", icon: LineChart, label: "Analytics" },
  { id: "insights", icon: Sparkles, label: "AI Insights" },
  { id: "reports", icon: BarChart3, label: "Reports" },
  { id: "goals", icon: Target, label: "Goals" },
  { id: "settings", icon: Settings, label: "Settings" },
];


function Sidebar({ activeTab = "dashboard", setActiveTab = () => {} }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <div className="brandIcon">
          <ShieldCheck size={24} />
        </div>

        <div>
          <strong>FocusGuard AI</strong>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", display: "block" }}>
            Distraction Intelligence
          </span>
        </div>
      </div>

      <nav style={{ marginTop: "16px" }}>
        {menu.map(({ id, icon: Icon, label }) => (
          <button
            className={activeTab === id ? "navItem active" : "navItem"}
            key={id}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebarBottom">
        <button className="navItem logoutBtn" onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>

        <div className="monitorStatus" style={{ marginTop: "8px" }}>
          <span className="statusDot" style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }} />

          <div>
            <strong style={{ fontSize: "0.78rem" }}>Ollama AI Connected</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
