import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Clock3,
  Target,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    icon: Activity,
    label: "Live Activity",
  },
  {
    icon: Clock3,
    label: "Sessions",
  },
  {
    icon: Target,
    label: "Goals",
  },
  {
    icon: BarChart3,
    label: "Reports",
  },
];

function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear user authentication tokens
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <div className="brandIcon">
          <ShieldCheck size={23} />
        </div>

        <div>
          <strong>FocusGuard</strong>
          <span>AI</span>
        </div>
      </div>

      <div className="sidebarLabel">WORKSPACE</div>

      <nav>
        {menu.map(({ icon: Icon, label }, index) => (
          <button
            className={index === 0 ? "navItem active" : "navItem"}
            key={label}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebarBottom">
        <button className="navItem">
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <button className="navItem logoutBtn" onClick={handleSignOut}>
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>

        <div className="monitorStatus">
          <span className="statusDot" />

          <div>
            <strong>FocusGuard AI</strong>
            <small>Windows Activity Engine</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
