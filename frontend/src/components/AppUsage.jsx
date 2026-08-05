function formatDuration(seconds) {
  const secs = Number(seconds || 0);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSecs}s`;
  return `${remainingSecs}s`;
}

function AppUsage({ activities = [], totalActiveTime = 0 }) {
  // Total active time or max application duration for percentage calculation
  const activeDuration = Number(totalActiveTime || 0);
  const maxDuration = activities.length > 0
    ? Math.max(...activities.map((item) => Number(item.total_seconds || 0)))
    : 0;

  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">APPLICATION METRICS</span>
          <h3>Application Usage</h3>
        </div>
      </div>

      <div className="usageList">
        {activities.length === 0 && (
          <div className="emptyState">
            No activity recorded yet.
          </div>
        )}

        {activities.map((activity, index) => {
          const seconds = Number(activity.total_seconds || 0);
          const sessions = Number(activity.session_count || activity.sessions || 1);
          
          // Calculate percentage of active time mathematically
          const percentage = activeDuration > 0
            ? Math.min(100, Math.round((seconds / activeDuration) * 100))
            : (maxDuration > 0 ? Math.round((seconds / maxDuration) * 100) : 0);

          return (
            <div className="usageItem" key={activity.app_name}>
              <div className="usageTop">
                <div>
                  <span className="appNumber">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{activity.app_name}</strong>
                  <span className="sessionTag">({sessions} session{sessions === 1 ? "" : "s"})</span>
                </div>

                <div className="usageMetricsRight">
                  <strong>{formatDuration(seconds)}</strong>
                  <span className="percentageTag">{percentage}% of active time</span>
                </div>
              </div>

              <div className="progressTrack">
                <div
                  className="progressFill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AppUsage;
