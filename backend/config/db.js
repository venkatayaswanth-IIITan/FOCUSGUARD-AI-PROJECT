const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const possibleEnvPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env")
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const dbConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "focusguard_db",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
};

const pool = new Pool(dbConfig);

pool.on("error", (err) => {
  console.error("❌ Unexpected database pool error:", err.message);
});

pool.on("connect", () => {
  console.log("PostgreSQL client connected successfully");
});

const initTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) DEFAULT 'Swarup Chandane',
          role VARCHAR(100) DEFAULT 'Coding & Software Engineering',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monitoring_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMPTZ,
          status VARCHAR(50) DEFAULT 'active',
          total_duration_seconds INTEGER DEFAULT 0,
          active_duration_seconds INTEGER DEFAULT 0,
          idle_duration_seconds INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          monitoring_session_id INTEGER REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
          process_name VARCHAR(255),
          app_name VARCHAR(255) NOT NULL,
          window_title TEXT,
          website_url VARCHAR(255),
          type VARCHAR(50) DEFAULT 'Application',
          started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
          category VARCHAR(50) DEFAULT 'Coding',
          productivity_status VARCHAR(20) DEFAULT 'Productive',
          device_name VARCHAR(100) DEFAULT 'MacBook Pro 16',
          operating_system VARCHAR(50) DEFAULT 'Windows 11 Pro',
          switch_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_switches (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          monitoring_session_id INTEGER REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
          from_app VARCHAR(255) NOT NULL,
          to_app VARCHAR(255) NOT NULL,
          switched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          previous_session_duration_seconds INTEGER,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS idle_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          monitoring_session_id INTEGER REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
          started_at TIMESTAMPTZ NOT NULL,
          ended_at TIMESTAMPTZ NOT NULL,
          duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS distraction_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          activity_log_id INTEGER REFERENCES activity_logs(id) ON DELETE CASCADE,
          distraction_type VARCHAR(100) NOT NULL,
          description TEXT,
          timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_reports (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          report_date DATE NOT NULL,
          focus_score NUMERIC(5,2) DEFAULT 0,
          productive_minutes INTEGER DEFAULT 0,
          non_productive_minutes INTEGER DEFAULT 0,
          total_minutes INTEGER DEFAULT 0,
          total_switches INTEGER DEFAULT 0,
          distraction_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, report_date)
      );

      CREATE TABLE IF NOT EXISTS focus_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_name VARCHAR(255) DEFAULT 'Deep Work',
          target_duration_minutes INTEGER DEFAULT 45,
          actual_duration_minutes INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'completed',
          started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recommendations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          priority VARCHAR(50) DEFAULT 'HIGH PRIORITY',
          category VARCHAR(100) DEFAULT 'App Blocker',
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          target_value INTEGER NOT NULL,
          period VARCHAR(50) DEFAULT 'daily',
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Add missing columns to existing tables safely
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT 'Swarup Chandane';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Coding & Software Engineering';

      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Application';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Coding';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS productivity_status VARCHAR(20) DEFAULT 'Productive';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS device_name VARCHAR(100) DEFAULT 'MacBook Pro 16';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS operating_system VARCHAR(50) DEFAULT 'Windows 11 Pro';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS switch_count INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON monitoring_sessions(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_activity_session ON activity_logs(monitoring_session_id);
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_switches_session ON task_switches(monitoring_session_id);
      CREATE INDEX IF NOT EXISTS idx_idle_session ON idle_events(monitoring_session_id);
      CREATE INDEX IF NOT EXISTS idx_goals_user ON user_goals(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_distraction_user ON distraction_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_reports(user_id, report_date);

      -- Reset sequence counters to prevent duplicate key violations on registration & inserts
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
      SELECT setval(pg_get_serial_sequence('monitoring_sessions', 'id'), COALESCE((SELECT MAX(id) FROM monitoring_sessions), 1));
      SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), COALESCE((SELECT MAX(id) FROM activity_logs), 1));
      SELECT setval(pg_get_serial_sequence('task_switches', 'id'), COALESCE((SELECT MAX(id) FROM task_switches), 1));
      SELECT setval(pg_get_serial_sequence('idle_events', 'id'), COALESCE((SELECT MAX(id) FROM idle_events), 1));
      SELECT setval(pg_get_serial_sequence('user_goals', 'id'), COALESCE((SELECT MAX(id) FROM user_goals), 1));
      SELECT setval(pg_get_serial_sequence('distraction_events', 'id'), COALESCE((SELECT MAX(id) FROM distraction_events), 1));
      SELECT setval(pg_get_serial_sequence('daily_reports', 'id'), COALESCE((SELECT MAX(id) FROM daily_reports), 1));
      SELECT setval(pg_get_serial_sequence('focus_sessions', 'id'), COALESCE((SELECT MAX(id) FROM focus_sessions), 1));
      SELECT setval(pg_get_serial_sequence('recommendations', 'id'), COALESCE((SELECT MAX(id) FROM recommendations), 1));
    `);
    console.log("✅ PostgreSQL schema initialized and sequence counters synchronized.");
  } catch (error) {
    console.error("Error creating database tables:", error.message);
  }
};

initTables();

module.exports = pool;
