import { CheckCircle2, Clock, Layers, RefreshCcw, Award, ArrowRight, X, Zap, PauseCircle } from "lucide-react";

function formatDuration(seconds) {
  const secs = Number(seconds || 0);
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hours > 0) return `${hours}h ${mins}m ${remainingSecs}s`;
  if (mins > 0) return `${mins}m ${remainingSecs}s`;
  return `${remainingSecs}s`;
}

function formatTime(isoString) {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function SessionAnalytics({ analytics, onClose }) {
  if (!analytics) return null;

  const {
    startedAt,
    endedAt,
    totalMonitoredDuration,
    totalActiveSeconds = 0,
    totalIdleSeconds = 0,
    totalSessions = 0,
    uniqueAppsCount = 0,
    longestSessionSeconds = 0,
    avgSessionSeconds = 0,
    totalSwitches = 0,
    mostUsedApp,
    mostCommonTransition,
    firstApp,
    lastApp,
    appUsage = [],
    summaryText,
  } = analytics;

  const maxDuration = appUsage.length > 0 ? Math.max(...appUsage.map((a) => Number(a.total_seconds))) : 0;

  return (
    <div className="analyticsOverlay">
      <div className="analyticsModal panel">
        {/* Modal Header */}
        <div className="analyticsHeader">
          <div className="analyticsTitleGroup">
            <div className="analyticsIcon">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <span className="eyebrow">REAL SESSION ANALYTICS</span>
              <h2>Monitoring Session Completed</h2>
              <p>
                Calculated strictly from PostgreSQL activity records for this session ({formatTime(startedAt)} – {formatTime(endedAt)}).
              </p>
            </div>
          </div>
          <button className="closeModalBtn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Deterministic Session Summary (NOT an AI insight) */}
        <div className="summaryBanner">
          <h4>
            <Award size={18} /> Session Analytics Summary
          </h4>
          <p>{summaryText}</p>
        </div>

        {/* Real Metrics Grid */}
        <div className="analyticsStatsGrid">
          <div className="analyticCard">
            <Clock size={20} className="cardIcon" />
            <div className="cardVal">{formatDuration(totalMonitoredDuration)}</div>
            <div className="cardLabel">Total Monitoring Time</div>
          </div>

          <div className="analyticCard">
            <Zap size={20} className="cardIcon" />
            <div className="cardVal">{formatDuration(totalActiveSeconds)}</div>
            <div className="cardLabel">Active Time</div>
          </div>

          <div className="analyticCard">
            <PauseCircle size={20} className="cardIcon" />
            <div className="cardVal">{formatDuration(totalIdleSeconds)}</div>
            <div className="cardLabel">Idle Time</div>
          </div>

          <div className="analyticCard">
            <Layers size={20} className="cardIcon" />
            <div className="cardVal">{uniqueAppsCount}</div>
            <div className="cardLabel">Applications Used</div>
          </div>

          <div className="analyticCard">
            <RefreshCcw size={20} className="cardIcon" />
            <div className="cardVal">{totalSwitches}</div>
            <div className="cardLabel">Task Switches</div>
          </div>

          <div className="analyticCard">
            <Award size={20} className="cardIcon" />
            <div className="cardVal">{formatDuration(longestSessionSeconds)}</div>
            <div className="cardLabel">Longest Session</div>
          </div>
        </div>

        {/* Details Two-Column Layout */}
        <div className="analyticsDetailsGrid">
          {/* Application Usage Breakdown */}
          <div className="analyticsSection">
            <h3>Application Usage Analytics</h3>
            {appUsage.length === 0 ? (
              <div className="emptyState">No application usage data available.</div>
            ) : (
              <div className="analyticsAppList">
                {appUsage.map((app, index) => {
                  const seconds = Number(app.total_seconds);
                  const sessions = Number(app.session_count || app.sessions || 1);
                  const pct = totalActiveSeconds > 0
                    ? Math.round((seconds / totalActiveSeconds) * 100)
                    : (maxDuration > 0 ? Math.round((seconds / maxDuration) * 100) : 0);

                  return (
                    <div className="analyticsAppItem" key={app.app_name}>
                      <div className="analyticsAppTop">
                        <strong>
                          {index + 1}. {app.app_name}
                        </strong>
                        <span>
                          {formatDuration(seconds)} ({sessions} session{sessions === 1 ? "" : "s"}) — {pct}% active time
                        </span>
                      </div>
                      <div className="progressTrack">
                        <div className="progressFill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Session Highlights & Task Switch Analytics */}
          <div className="analyticsSection">
            <h3>Task Switches & Session Highlights</h3>
            <div className="highlightsList">
              <div className="highlightItem">
                <span>Total Application Sessions</span>
                <strong>{totalSessions} sessions</strong>
              </div>

              <div className="highlightItem">
                <span>Average Session Duration</span>
                <strong>{formatDuration(avgSessionSeconds)}</strong>
              </div>

              <div className="highlightItem">
                <span>First Application</span>
                <strong>{firstApp || "None"}</strong>
              </div>

              <div className="highlightItem">
                <span>Last Application</span>
                <strong>{lastApp || "None"}</strong>
              </div>

              {mostCommonTransition ? (
                <div className="highlightItem transitionBox">
                  <span>Most Common Transition</span>
                  <div className="transPair">
                    <strong>{mostCommonTransition.from_app}</strong>
                    <ArrowRight size={14} />
                    <strong>{mostCommonTransition.to_app}</strong>
                    <small>({mostCommonTransition.transition_count} times)</small>
                  </div>
                </div>
              ) : (
                <div className="highlightItem">
                  <span>Most Common Transition</span>
                  <strong>No application switches occurred during this session.</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="analyticsFooter">
          <button className="primaryBtn" onClick={onClose}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionAnalytics;
