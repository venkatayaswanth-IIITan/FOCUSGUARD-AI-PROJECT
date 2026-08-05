-- FocusGuard AI Database Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
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

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_sessions_user ON monitoring_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_session ON activity_logs(monitoring_session_id);
CREATE INDEX IF NOT EXISTS idx_switches_session ON task_switches(monitoring_session_id);
CREATE INDEX IF NOT EXISTS idx_idle_session ON idle_events(monitoring_session_id);
