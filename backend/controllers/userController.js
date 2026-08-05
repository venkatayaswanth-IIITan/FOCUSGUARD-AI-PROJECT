const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
};
