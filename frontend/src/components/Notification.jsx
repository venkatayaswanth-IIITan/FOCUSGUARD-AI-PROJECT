import { useState, useEffect } from "react";

function Notification({ message, type, duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setExiting(false);

      const exitTimer = setTimeout(() => {
        setExiting(true);
      }, duration - 400);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, duration);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setVisible(false);
    }
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <div
      className={`notification ${type} ${
        exiting ? "notification-exit" : ""
      }`}
    >
      <div className="notification-icon">
        {type === "success" ? "✓" : "!"}
      </div>

      <span>{message}</span>

      <div
        className="notification-progress"
        style={{
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}

export default Notification;
