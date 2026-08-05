function formatTime(date) {
  if (!date || date === "LIVE") return "LIVE";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(seconds) {
  const secs = Number(seconds || 0);
  if (secs < 60) return `${secs}s`;

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function RecentActivity({ activities = [] }) {
  return (
    <div className="panel recentPanel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">ACTIVITY LOG & TIMELINE</span>
          <h3>Recent Activity</h3>
        </div>
      </div>

      <div className="activityTable">
        <div className="activityRow tableHead">
          <span>Application</span>
          <span>Started</span>
          <span>Ended</span>
          <span>Duration</span>
        </div>

        {activities.length === 0 && (
          <div className="emptyState">
            No activity recorded yet.
          </div>
        )}

        {activities.map((item, index) => {
          const isLive = !item.end_time || item.end_time === "LIVE" || index === 0 && item.is_live;

          return (
            <div className={`activityRow ${isLive ? "liveRow" : ""}`} key={item.id || index}>
              <div className="activityApp">
                <span className="smallAppIcon">
                  {item.app_name?.charAt(0).toUpperCase() || "A"}
                </span>

                <div>
                  <strong>{item.app_name}</strong>
                  {item.window_title && <small>{item.window_title}</small>}
                </div>
              </div>

              <span>{formatTime(item.start_time || item.started_at)}</span>

              <span>
                {isLive ? <strong className="statusGreen">LIVE</strong> : formatTime(item.end_time || item.ended_at)}
              </span>

              <strong>
                {isLive ? <span className="statusGreen">LIVE</span> : formatDuration(item.duration_seconds)}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentActivity;
