import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ShieldCheck, Settings, Monitor, Check, X, Mail, Key } from "lucide-react";

function ProfileMenu({ isAgentConnected }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'preferences' | null
  const [userInfo, setUserInfo] = useState({
    username: "Yaswanth",
    email: "yaswanth@example.com",
  });
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Load user details from JWT token or localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserInfo({
          username: parsed.username || "Yaswanth",
          email: parsed.email || "yaswanth@example.com",
        });
      } else {
        const token = localStorage.getItem("token");
        if (token && token.includes(".")) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserInfo({
            username: payload.username || "Yaswanth",
            email: payload.email || "yaswanth@example.com",
          });
        }
      }
    } catch (err) {
      // Fallback defaults
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initial = userInfo.username ? userInfo.username.charAt(0).toUpperCase() : "U";

  return (
    <>
      <div className="profileMenuContainer" ref={menuRef}>
        {/* Topbar Avatar Trigger */}
        <button
          className={`profileTriggerBtn ${isOpen ? "active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          title="User Account Menu"
        >
          <div className="avatar">{initial}</div>
          <div className="profileTriggerText">
            <span className="profileName">{userInfo.username}</span>
            <span className="profileRole">Active User</span>
          </div>
          <span className={`onlineDot ${isAgentConnected ? "online" : "offline"}`} />
        </button>

        {/* Popover Dropdown */}
        {isOpen && (
          <div className="profileDropdown">
            {/* User Header */}
            <div className="profileHeader">
              <div className="profileAvatarLarge">{initial}</div>
              <div>
                <h4>{userInfo.username}</h4>
                <p>{userInfo.email}</p>
                <span className="jwtBadge">
                  <Check size={12} /> JWT Authenticated
                </span>
              </div>
            </div>

            {/* System Status Summary */}
            <div className="profileStatusBox">
              <div className="statusItem">
                <span><Monitor size={15} /> Windows Monitor</span>
                <strong className={isAgentConnected ? "statusGreen" : "statusRed"}>
                  {isAgentConnected ? "Connected" : "Disconnected"}
                </strong>
              </div>

              <div className="statusItem">
                <span><ShieldCheck size={15} /> Session Security</span>
                <strong className="statusGreen">Active Token</strong>
              </div>
            </div>

            {/* Action Links */}
            <div className="profileNavLinks">
              <button
                className="profileNavItem"
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal("profile");
                }}
              >
                <User size={16} />
                <span>Account Profile</span>
              </button>

              <button
                className="profileNavItem"
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal("preferences");
                }}
              >
                <Settings size={16} />
                <span>Preferences</span>
              </button>

              <button className="profileNavItem logoutItem" onClick={handleSignOut}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Profile Modal */}
      {activeModal === "profile" && (
        <div className="analyticsOverlay" onClick={() => setActiveModal(null)}>
          <div className="analyticsModal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="analyticsHeader">
              <div className="analyticsTitleGroup">
                <div className="profileAvatarLarge" style={{ width: "44px", height: "44px", fontSize: "16px" }}>{initial}</div>
                <div>
                  <h2>Account Profile</h2>
                  <p>Authenticated User Details</p>
                </div>
              </div>
              <button className="closeModalBtn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="profileModalBody">
              <div className="profileModalRow">
                <User size={18} className="iconBlue" />
                <div>
                  <small>Username</small>
                  <strong>{userInfo.username}</strong>
                </div>
              </div>

              <div className="profileModalRow">
                <Mail size={18} className="iconBlue" />
                <div>
                  <small>Email Address</small>
                  <strong>{userInfo.email}</strong>
                </div>
              </div>

              <div className="profileModalRow">
                <Key size={18} className="iconBlue" />
                <div>
                  <small>Authentication</small>
                  <strong>JWT Bearer Token (Active)</strong>
                </div>
              </div>
            </div>

            <div className="analyticsFooter" style={{ marginTop: "24px" }}>
              <button className="primaryBtn" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {activeModal === "preferences" && (
        <div className="analyticsOverlay" onClick={() => setActiveModal(null)}>
          <div className="analyticsModal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="analyticsHeader">
              <div className="analyticsTitleGroup">
                <div className="analyticsIcon"><Settings size={22} /></div>
                <div>
                  <h2>Preferences</h2>
                  <p>FocusGuard Application Settings</p>
                </div>
              </div>
              <button className="closeModalBtn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="preferencesBody">
              <div className="prefRow">
                <div>
                  <strong>Real-time Activity Tracking</strong>
                  <p>Record win32 foreground window context switches</p>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--db-blue)", width: "16px", height: "16px" }} />
              </div>

              <div className="prefRow">
                <div>
                  <strong>Notification Alerts</strong>
                  <p>Show desktop & socket alerts for long idle sessions</p>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--db-blue)", width: "16px", height: "16px" }} />
              </div>

              <div className="prefRow">
                <div>
                  <strong>Auto Session Archiving</strong>
                  <p>Save metrics to database on session completion</p>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--db-blue)", width: "16px", height: "16px" }} />
              </div>
            </div>

            <div className="analyticsFooter" style={{ marginTop: "24px" }}>
              <button className="primaryBtn" onClick={() => setActiveModal(null)}>Save & Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileMenu;
