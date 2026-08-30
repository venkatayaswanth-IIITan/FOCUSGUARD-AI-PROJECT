const pool = require("../config/db");

/*
------------------------------------------------
GET ALL USER GOALS WITH REAL PROGRESS COMPUTATION
------------------------------------------------
*/
const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;

    const goalsRes = await pool.query(
      `SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    let goals = goalsRes.rows;

    // If user has no goals yet, seed initial default goals
    if (goals.length === 0) {
      const defaultGoals = [
        { title: "4 Hours Active Deep Work", type: "active_time", target_value: 240, period: "daily" },
        { title: "Limit Idle Time to < 30 Minutes", type: "idle_limit", target_value: 30, period: "daily" },
        { title: "Low Context Switch Target (< 20 Switches)", type: "task_switches_limit", target_value: 20, period: "daily" },
        { title: "Monitored Session Goal (6 Hours)", type: "monitored_time", target_value: 360, period: "daily" },
      ];

      for (const g of defaultGoals) {
        await pool.query(
          `INSERT INTO user_goals (user_id, title, type, target_value, period, status)
           VALUES ($1, $2, $3, $4, $5, 'active')`,
          [userId, g.title, g.type, g.target_value, g.period]
        );
      }

      const reFetch = await pool.query(
        `SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      goals = reFetch.rows;
    }

    // Calculate today's active metrics to compute live progress for each goal
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeSecsRes = await pool.query(
      `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS active_secs
       FROM activity_logs
       WHERE user_id = $1 AND started_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todayActiveMins = Math.floor((activeSecsRes.rows[0]?.active_secs || 0) / 60);

    const idleSecsRes = await pool.query(
      `SELECT COALESCE(SUM(duration_seconds), 0)::INTEGER AS idle_secs
       FROM idle_events
       WHERE user_id = $1 AND started_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todayIdleMins = Math.floor((idleSecsRes.rows[0]?.idle_secs || 0) / 60);

    const switchesRes = await pool.query(
      `SELECT COUNT(*)::INTEGER AS total_switches
       FROM task_switches
       WHERE user_id = $1 AND switched_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todaySwitches = switchesRes.rows[0]?.total_switches || 0;

    const monitoredSecsRes = await pool.query(
      `SELECT COALESCE(SUM(total_duration_seconds), 0)::INTEGER AS monitored_secs
       FROM monitoring_sessions
       WHERE user_id = $1 AND started_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todayMonitoredMins = Math.floor((monitoredSecsRes.rows[0]?.monitored_secs || 0) / 60);

    const enrichedGoals = goals.map((goal) => {
      let current_value = 0;
      let is_limit = false;

      switch (goal.type) {
        case "active_time":
          current_value = todayActiveMins;
          break;
        case "idle_limit":
          current_value = todayIdleMins;
          is_limit = true;
          break;
        case "task_switches_limit":
          current_value = todaySwitches;
          is_limit = true;
          break;
        case "monitored_time":
        default:
          current_value = todayMonitoredMins;
          break;
      }

      let percentage = 0;
      if (is_limit) {
        // For limit goals (e.g. idle < 30m), percentage starts at 100% and drops if exceeded
        if (current_value <= goal.target_value) {
          percentage = Math.round(100 - (current_value / goal.target_value) * 50);
        } else {
          percentage = Math.max(0, Math.round(50 - ((current_value - goal.target_value) / goal.target_value) * 50));
        }
      } else {
        percentage = Math.min(100, Math.round((current_value / (goal.target_value || 1)) * 100));
      }

      const is_completed = !is_limit && percentage >= 100;
      const is_exceeded = is_limit && current_value > goal.target_value;

      return {
        ...goal,
        current_value,
        percentage,
        is_limit,
        is_completed,
        is_exceeded,
      };
    });

    return res.json(enrichedGoals);
  } catch (error) {
    console.error("Get goals error:", error);
    return res.status(500).json({ message: "Unable to fetch focus goals" });
  }
};

/*
------------------------------------------------
CREATE A NEW GOAL
------------------------------------------------
*/
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, type, target_value, period = "daily" } = req.body;

    if (!title || !type || !target_value) {
      return res.status(400).json({ message: "Title, type, and target_value are required" });
    }

    const result = await pool.query(
      `INSERT INTO user_goals (user_id, title, type, target_value, period, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [userId, title, type, parseInt(target_value, 10), period]
    );

    return res.status(201).json({ message: "Goal created successfully", goal: result.rows[0] });
  } catch (error) {
    console.error("Create goal error:", error);
    return res.status(500).json({ message: "Unable to create goal" });
  }
};

/*
------------------------------------------------
UPDATE AN EXISTING GOAL (STATUS OR TARGET)
------------------------------------------------
*/
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;
    const { status, target_value, title } = req.body;

    const existingRes = await pool.query(
      `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const goal = existingRes.rows[0];
    const newStatus = status || goal.status;
    const newTarget = target_value !== undefined ? parseInt(target_value, 10) : goal.target_value;
    const newTitle = title || goal.title;

    const updateRes = await pool.query(
      `UPDATE user_goals
       SET status = $1, target_value = $2, title = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [newStatus, newTarget, newTitle, goalId, userId]
    );

    return res.json({ message: "Goal updated successfully", goal: updateRes.rows[0] });
  } catch (error) {
    console.error("Update goal error:", error);
    return res.status(500).json({ message: "Unable to update goal" });
  }
};

/*
------------------------------------------------
DELETE A GOAL
------------------------------------------------
*/
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;

    const result = await pool.query(
      `DELETE FROM user_goals WHERE id = $1 AND user_id = $2 RETURNING *`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete goal error:", error);
    return res.status(500).json({ message: "Unable to delete goal" });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
