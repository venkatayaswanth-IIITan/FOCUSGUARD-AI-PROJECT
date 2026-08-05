import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Trash2, Shield, Radio, PauseCircle, CheckCircle2, AlertCircle } from "lucide-react";

function formatTime(timestamp) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function NotificationsCenter({ notifications = [], onClear, onMarkRead, onItemClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "start":
        return <Radio size={15} className="iconGreen" />;
      case "switch":
        return <Shield size={15} className="iconBlue" />;
      case "idle":
        return <PauseCircle size={15} className="iconOrange" />;
      case "stop":
        return <CheckCircle2 size={15} className="iconGreen" />;
      case "agent_connect":
        return <CheckCircle2 size={15} className="iconGreen" />;
      case "agent_disconnect":
        return <AlertCircle size={15} className="iconRed" />;
      default:
        return <Bell size={15} className="iconBlue" />;
    }
  };

  return (
    <div className="notificationsCenterContainer" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        className={`notificationBellBtn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="bellBadge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="notificationsDropdown">
          <div className="dropdownHeader">
            <div>
              <h3>System Updates</h3>
              <span className="eyebrow">{notifications.length} Total Updates</span>
            </div>

            <div className="dropdownActions">
              {unreadCount > 0 && (
                <button
                  className="textBtn"
                  onClick={() => {
                    if (onMarkRead) onMarkRead();
                  }}
                  title="Mark all read"
                >
                  <CheckCheck size={14} />
                  <span>Read All</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="textBtn danger"
                  onClick={() => {
                    if (onClear) onClear();
                  }}
                  title="Clear all"
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          <div className="notificationsList">
            {notifications.length === 0 ? (
              <div className="emptyNotifications">
                <Bell size={24} className="iconMuted" />
                <p>No new notifications yet.</p>
                <small>Updates will appear here when activity events occur.</small>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notificationItem ${!item.read ? "unread" : ""}`}
                  onClick={() => {
                    if (onItemClick) onItemClick(item.id);
                  }}
                >
                  <div className="notifIconWrapper">{getIcon(item.type)}</div>
                  <div className="notifContent">
                    <div className="notifTop">
                      <strong>{item.title}</strong>
                      <span className="notifTime">{formatTime(item.timestamp)}</span>
                    </div>
                    <p>{item.message}</p>
                  </div>
                  {!item.read && <span className="unreadDot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsCenter;
