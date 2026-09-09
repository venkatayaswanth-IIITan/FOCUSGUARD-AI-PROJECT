const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Check empty fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check username
    const usernameExists = await pool.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
      [username.trim()]
    );

    if (usernameExists.rows.length > 0) {
      return res.status(400).json({
        message: "Username already exists. Please pick another one.",
      });
    }

    // Check email
    const emailExists = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({
        message: "Email already registered. Please login instead.",
      });
    }

    // Format full_name
    const displayName = full_name?.trim() || username.trim();
    const userRole = role?.trim() || "Coding & Software Engineering";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role`,
      [username.trim(), email.trim(), hashedPassword, displayName, userRole]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: error.message || "Server error during registration",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, username, name, full_name, password } = req.body;
    const loginInput = (email || username || name || full_name || "").trim();
    const explicitName = (full_name || name || "").trim();

    if (!loginInput || !password) {
      return res.status(400).json({
        message: "Email/Username/Name and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) OR LOWER(full_name) = LOWER($1)",
      [loginInput]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials. User not found.",
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email/username or password",
      });
    }

    let finalFullName = user.full_name || user.username;
    if (explicitName && explicitName.toLowerCase() !== (user.full_name || "").toLowerCase()) {
      try {
        await pool.query("UPDATE users SET full_name = $1 WHERE id = $2", [explicitName, user.id]);
        finalFullName = explicitName;
      } catch (err) {
        console.warn("Could not update full_name on login:", err.message);
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET || "focusguard_secret_key",
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: finalFullName,
        role: user.role || "Coding & Software Engineering",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: error.message || "Server error during login",
    });
  }
};

module.exports = {
  register,
  login,
};