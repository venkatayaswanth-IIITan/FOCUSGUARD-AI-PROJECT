const pool = require("../config/db");

/*
------------------------------------------------
HELPER: FORMAT DURATION IN SECONDS TO HUMAN STRING
------------------------------------------------
*/
function formatDurationString(seconds) {
  const secs = Number(seconds || 0);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${remainingSecs}s`;
  if (minutes > 0) return `${minutes}m ${remainingSecs}s`;
  return `${remainingSecs}s`;
}

/*
------------------------------------------------
START MONITORING SESSION
------------------------------------------------
*/
const startSession = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has an active monitoring session
    const activeCheck = await pool.query(
      `SELECT * FROM monitoring_sessions WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (activeCheck.rows.length > 0) {
      return res.json({
        message: "Monitoring session already active",
        session: activeCheck.rows[0],
      });
    }

    const result = await pool.query(
      `INSERT INTO monitoring_sessions (user_id, status, started_at)
       VALUES ($1, 'active', NOW())
       RETURNING *`,
      [userId]
    );

    return res.status(201).json({
      message: "Monitoring session started",
      session: result.rows[0],
    });
  } catch (error) {
    console.error("Start session error:", error);
    return res.status(500).json({ message: "Unable to start monitoring session" });
  }
};

/*
------------------------------------------------
STOP MONITORING SESSION
------------------------------------------------
*/
const stopSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentApp } = req.body;

    const activeSessionRes = await pool.query(
      `SELECT * FROM monitoring_sessions WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (activeSessionRes.rows.length === 0) {
      return res.status(400).json({ message: "No active monitoring session found to stop" });
    }

    const activeSession = activeSessionRes.rows[0];
    const sessionId = activeSession.id;
    const now = new Date();

    // Save active foreground application session if present
    if (currentApp && currentApp.app_name && currentApp.start_time) {
      const startTime = new Date(currentApp.start_time);
      const durationSeconds = Math.max(1, Math.floor((now - startTime) / 1000));

      await pool.query(
        `INSERT INTO activity_logs (user_id, monitoring_session_id, process_name, app_name, window_title, started_at, ended_at, duration_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          sessionId,
          currentApp.process_name || null,
          currentApp.app_name,
          currentApp.window_title || null,
          startTime.toISOString(),
          now.toISOString(),
          durationSeconds,
        ]
      );
    }

    // Calculate session totals
    const startTimestamp = new Date(activeSession.started_at);
    const totalDurationSeconds = Math.max(0, Math.floor((now - startTimestamp) / 1000));

    const activeSumRes = await pool.query(
      `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS active_secs FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    const activeDurationSeconds = activeSumRes.rows[0]?.active_secs || 0;

    const idleSumRes = await pool.query(
      `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS idle_secs FROM idle_events WHERE monitoring_session_id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    const idleDurationSeconds = idleSumRes.rows[0]?.idle_secs || 0;

    // Update monitoring session status to completed
    const updatedSessionRes = await pool.query(
      `UPDATE monitoring_sessions
       SET status = 'completed', ended_at = $1, total_duration_seconds = $2, active_duration_seconds = $3, idle_duration_seconds = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [now.toISOString(), totalDurationSeconds, activeDurationSeconds, idleDurationSeconds, sessionId, userId]
    );

    // Calculate real session statistics for completed session
    const analytics = await calculateSessionAnalytics(userId, sessionId);

    return res.json({
      message: "Monitoring session stopped",
      session: updatedSessionRes.rows[0],
      analytics,
    });
  } catch (error) {
    console.error("Stop session error:", error);
    return res.status(500).json({ message: "Unable to stop monitoring session" });
  }
};

/*
------------------------------------------------
GET CURRENT ACTIVE SESSION & STATUS
------------------------------------------------
*/
const getCurrentSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM monitoring_sessions WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ active: false, session: null, stats: null });
    }

    const session = result.rows[0];
    const stats = await calculateLiveSessionStats(userId, session.id, session.started_at);

    return res.json({
      active: true,
      session,
      stats,
    });
  } catch (error) {
    console.error("Get current session error:", error);
    return res.status(500).json({ message: "Unable to retrieve current session" });
  }
};

/*
------------------------------------------------
GET SPECIFIC SESSION BY ID
------------------------------------------------
*/
const getSessionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT * FROM monitoring_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Monitoring session not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Get session by id error:", error);
    return res.status(500).json({ message: "Unable to fetch session" });
  }
};

/*
------------------------------------------------
GET ACTIVITY LOGS FOR A SESSION
------------------------------------------------
*/
const getSessionLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT id, process_name, app_name, window_title, started_at, ended_at, duration_seconds, created_at
       FROM activity_logs
       WHERE monitoring_session_id = $1 AND user_id = $2
       ORDER BY started_at DESC`,
      [sessionId, userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Get session logs error:", error);
    return res.status(500).json({ message: "Unable to fetch activity logs" });
  }
};

/*
------------------------------------------------
GET TASK SWITCHES FOR A SESSION
------------------------------------------------
*/
const getSessionSwitches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT id, from_app, to_app, switched_at, previous_session_duration_seconds, created_at
       FROM task_switches
       WHERE monitoring_session_id = $1 AND user_id = $2
       ORDER BY switched_at DESC`,
      [sessionId, userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Get session switches error:", error);
    return res.status(500).json({ message: "Unable to fetch task switches" });
  }
};

/*
------------------------------------------------
DATABASE WRITERS FOR MONITORING AGENT EVENTS
------------------------------------------------
*/
const recordActivitySwitch = async (userId, sessionId, activityData) => {
  const {
    process_name,
    app_name,
    window_title,
    start_time,
    end_time,
    duration_seconds,
    from_app,
    to_app,
  } = activityData;

  if (!userId || !sessionId || !app_name) return null;

  // Insert activity log
  const logResult = await pool.query(
    `INSERT INTO activity_logs (user_id, monitoring_session_id, process_name, app_name, window_title, started_at, ended_at, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      sessionId,
      process_name || null,
      app_name,
      window_title || null,
      start_time,
      end_time,
      Math.max(1, Math.floor(duration_seconds)),
    ]
  );

  // Insert task switch if transition occurred between distinct apps
  if (from_app && to_app && from_app !== to_app) {
    await pool.query(
      `INSERT INTO task_switches (user_id, monitoring_session_id, from_app, to_app, switched_at, previous_session_duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        sessionId,
        from_app,
        to_app,
        end_time,
        Math.max(1, Math.floor(duration_seconds)),
      ]
    );
  }

  return logResult.rows[0];
};

const recordIdleEvent = async (userId, sessionId, idleData) => {
  const { started_at, ended_at, duration_seconds } = idleData;

  if (!userId || !sessionId || !started_at || !ended_at) return null;

  const duration = Math.max(1, Math.floor(duration_seconds || 0));

  const result = await pool.query(
    `INSERT INTO idle_events (user_id, monitoring_session_id, started_at, ended_at, duration_seconds)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, sessionId, started_at, ended_at, duration]
  );

  return result.rows[0];
};

/*
------------------------------------------------
LIVE DASHBOARD METRICS CALCULATOR
------------------------------------------------
*/
const calculateLiveSessionStats = async (userId, sessionId, startedAt) => {
  const now = new Date();
  const sessionStart = new Date(startedAt);
  const monitoredDuration = Math.max(0, Math.floor((now - sessionStart) / 1000));

  // Active time sum
  const activeSumRes = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS active_secs FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const activeTime = activeSumRes.rows[0]?.active_secs || 0;

  // Idle time sum
  const idleSumRes = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS idle_secs FROM idle_events WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const idleTime = idleSumRes.rows[0]?.idle_secs || 0;

  // Unique apps count
  const appsCountRes = await pool.query(
    `SELECT COUNT(DISTINCT app_name)::INTEGER AS unique_apps FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  // Task switches count
  const switchesRes = await pool.query(
    `SELECT COUNT(*)::INTEGER AS total_switches FROM task_switches WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  // Longest session duration
  const longestRes = await pool.query(
    `SELECT COALESCE(MAX(duration_seconds), 0)::INTEGER AS max_duration FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  // App usage list with session counts
  const usageRes = await pool.query(
    `SELECT app_name, SUM(duration_seconds)::INTEGER AS total_seconds, COUNT(*)::INTEGER AS session_count
     FROM activity_logs
     WHERE monitoring_session_id = $1 AND user_id = $2
     GROUP BY app_name
     ORDER BY total_seconds DESC`,
    [sessionId, userId]
  );

  // Timeline & recent activity
  const timelineRes = await pool.query(
    `SELECT id, process_name, app_name, window_title, started_at AS start_time, ended_at AS end_time, duration_seconds
     FROM activity_logs
     WHERE monitoring_session_id = $1 AND user_id = $2
     ORDER BY started_at DESC`,
    [sessionId, userId]
  );

  return {
    monitoredDuration,
    activeTime,
    idleTime,
    uniqueApps: appsCountRes.rows[0]?.unique_apps || 0,
    totalSwitches: switchesRes.rows[0]?.total_switches || 0,
    longestSessionSeconds: longestRes.rows[0]?.max_duration || 0,
    appUsage: usageRes.rows,
    recentActivity: timelineRes.rows,
  };
};

/*
------------------------------------------------
COMPLETED SESSION ANALYTICS CALCULATOR
------------------------------------------------
*/
const calculateSessionAnalytics = async (userId, sessionId) => {
  const sessionRes = await pool.query(
    `SELECT * FROM monitoring_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  if (sessionRes.rows.length === 0) return null;
  const session = sessionRes.rows[0];

  // Active duration stats
  const activeStatsRes = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS total_active_seconds,
            COUNT(*)::INTEGER AS total_sessions,
            COALESCE(MAX(duration_seconds), 0)::INTEGER AS max_duration,
            COALESCE(AVG(duration_seconds), 0)::INTEGER AS avg_duration
     FROM activity_logs
     WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const activeStats = activeStatsRes.rows[0];

  // Idle duration stats
  const idleStatsRes = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS total_idle_seconds
     FROM idle_events
     WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const totalIdleSeconds = idleStatsRes.rows[0]?.total_idle_seconds || 0;

  // App usage breakdown query
  const appUsageRes = await pool.query(
    `SELECT app_name, SUM(duration_seconds)::INTEGER AS total_seconds, COUNT(*)::INTEGER AS session_count
     FROM activity_logs
     WHERE monitoring_session_id = $1 AND user_id = $2
     GROUP BY app_name
     ORDER BY total_seconds DESC`,
    [sessionId, userId]
  );

  // Most common transition & switches count
  const switchesRes = await pool.query(
    `SELECT from_app, to_app, COUNT(*)::INTEGER AS transition_count
     FROM task_switches
     WHERE monitoring_session_id = $1 AND user_id = $2
     GROUP BY from_app, to_app
     ORDER BY transition_count DESC
     LIMIT 1`,
    [sessionId, userId]
  );

  const totalSwitchesRes = await pool.query(
    `SELECT COUNT(*)::INTEGER AS total_switches FROM task_switches WHERE monitoring_session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  // First and last detected app
  const firstAppRes = await pool.query(
    `SELECT app_name FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2 ORDER BY started_at ASC LIMIT 1`,
    [sessionId, userId]
  );
  const lastAppRes = await pool.query(
    `SELECT app_name FROM activity_logs WHERE monitoring_session_id = $1 AND user_id = $2 ORDER BY ended_at DESC LIMIT 1`,
    [sessionId, userId]
  );

  const mostUsedApp = appUsageRes.rows[0] || null;
  const mostCommonTransition = switchesRes.rows[0] || null;
  const totalSwitches = totalSwitchesRes.rows[0]?.total_switches || 0;
  const uniqueAppsCount = appUsageRes.rows.length;

  const totalMonitoredDuration = session.total_duration_seconds || 0;
  const formattedMonitored = formatDurationString(totalMonitoredDuration);
  const formattedIdle = formatDurationString(totalIdleSeconds);
  const formattedLongest = formatDurationString(activeStats.max_duration);

  // Build deterministic session summary paragraph
  let summaryText = "";
  if (mostUsedApp) {
    const formattedMostUsedDuration = formatDurationString(mostUsedApp.total_seconds);
    summaryText = `You monitored your activity for ${formattedMonitored}. ${mostUsedApp.app_name} was your most-used application at ${formattedMostUsedDuration}. You used ${uniqueAppsCount} application${uniqueAppsCount === 1 ? "" : "s"} and switched applications ${totalSwitches} time${totalSwitches === 1 ? "" : "s"}. Your longest continuous application session was ${formattedLongest}. You were idle for ${formattedIdle}.`;
  } else {
    summaryText = `You monitored your activity for ${formattedMonitored}. No application usage data was recorded during this session. You were idle for ${formattedIdle}.`;
  }

  return {
    sessionId,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    totalMonitoredDuration,
    totalActiveSeconds: activeStats.total_active_seconds,
    totalIdleSeconds,
    totalSessions: activeStats.total_sessions,
    uniqueAppsCount,
    longestSessionSeconds: activeStats.max_duration,
    avgSessionSeconds: activeStats.avg_duration,
    totalSwitches,
    mostUsedApp,
    mostCommonTransition,
    firstApp: firstAppRes.rows[0]?.app_name || null,
    lastApp: lastAppRes.rows[0]?.app_name || null,
    appUsage: appUsageRes.rows,
    summaryText,
  };
};

const getSessionAnalyticsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const analytics = await calculateSessionAnalytics(userId, sessionId);
    if (!analytics) {
      return res.status(404).json({ message: "Session analytics not found" });
    }
    return res.json(analytics);
  } catch (error) {
    console.error("Get session analytics error:", error);
    return res.status(500).json({ message: "Unable to fetch session analytics" });
  }
};

module.exports = {
  startSession,
  stopSession,
  getCurrentSession,
  getSessionById,
  getSessionLogs,
  getSessionSwitches,
  getSessionAnalyticsHandler,
  recordActivitySwitch,
  recordIdleEvent,
  calculateLiveSessionStats,
  calculateSessionAnalytics,
};
