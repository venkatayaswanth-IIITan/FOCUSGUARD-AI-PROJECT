const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const result = await pool.query(
      `SELECT id, username, full_name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching profile",
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, full_name, role, email } = req.body;
    const userId = req.user?.id || 1;

    const result = await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           email = COALESCE($4, email)
       WHERE id = $5
       RETURNING id, username, full_name, email, role, created_at`,
      [username, full_name, role, email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully in PostgreSQL",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Server error updating profile",
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

