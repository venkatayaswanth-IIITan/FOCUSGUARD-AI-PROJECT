const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const possibleEnvPaths = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "focusguard_db",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

async function seedData() {
  console.log("🌱 Starting FocusGuard AI Synthetic Data Seeding for PostgreSQL...");

  try {
    // 0. Ensure schema migrations run
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT 'Swarup Chandane';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Coding & Software Engineering';

      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Application';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Coding';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS productivity_status VARCHAR(20) DEFAULT 'Productive';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS device_name VARCHAR(100) DEFAULT 'MacBook Pro 16';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS operating_system VARCHAR(50) DEFAULT 'Windows 11 Pro';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS switch_count INTEGER DEFAULT 0;
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

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
    `);

    // 1. Clear tables and ensure user 1: Swarup Chandane (swarup@focusguard.ai / test123)
    await pool.query(`TRUNCATE TABLE users, monitoring_sessions, distraction_events, activity_logs, daily_reports, recommendations, focus_sessions RESTART IDENTITY CASCADE`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("test123", salt);

    const userRes = await pool.query(
      `INSERT INTO users (id, username, email, password, full_name, role)
       VALUES (1, 'swarup', 'swarup@focusguard.ai', $1, 'Swarup Chandane', 'Coding & Software Engineering')
       RETURNING id, username, email, full_name`,
      [hashedPassword]
    );
    console.log(`✅ User ready: ${userRes.rows[0].full_name} (${userRes.rows[0].email} / test123) (ID: ${userRes.rows[0].id})`);

    // 2. Ensure an active monitoring session exists
    const sessionRes = await pool.query(
      `INSERT INTO monitoring_sessions (user_id, status, started_at, total_duration_seconds, active_duration_seconds, idle_duration_seconds)
       VALUES (1, 'active', NOW() - INTERVAL '5 hours 32 minutes', 19920, 17460, 2460)
       RETURNING id`
    );
    const sessionId = sessionRes.rows[0].id;
    console.log(`✅ Active Monitoring Session ID: ${sessionId}`);

    // 4. Generate Synthetic Activity Logs matching Screenshot 2 & pgAdmin image exactly starting at ID = 1
    console.log("⏳ Generating 1057 Activity Logs matching telemetry images (starting at ID 1)...");

    const exactScreenshotRows = [
      { app: "Google Chrome", type: "Website", url: "https://udemy.com", start: "22:16", end: "23:35", durSec: 4680, category: "Learning", prod: "Productive", switches: 3 },
      { app: "Google Chrome", type: "Website", url: "https://stackoverflow.com", start: "21:28", end: "22:10", durSec: 2520, category: "Research", prod: "Productive", switches: 3 },
      { app: "PowerPoint", type: "Application", url: "-", start: "21:08", end: "21:23", durSec: 900, category: "Office", prod: "Productive", switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://twitter.com", start: "20:25", end: "21:03", durSec: 2220, category: "Social Media", prod: "Non-Productive", switches: 2 },
      { app: "Discord", type: "Application", url: "-", start: "19:01", end: "20:17", durSec: 4560, category: "Communication", prod: "Non-Productive", switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://chat.openai.com", start: "18:17", end: "18:56", durSec: 2280, category: "Research", prod: "Productive", switches: 1 },
      { app: "Spotify", type: "Application", url: "-", start: "16:59", end: "18:09", durSec: 4140, category: "Entertainment", prod: "Non-Productive", switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://linkedin.com", start: "15:50", end: "16:56", durSec: 3900, category: "Office", prod: "Productive", switches: 0 },
      { app: "Google Chrome", type: "Website", url: "https://facebook.com", start: "14:30", end: "15:43", durSec: 4380, category: "Social Media", prod: "Non-Productive", switches: 0 },
      { app: "Google Chrome", type: "Website", url: "https://facebook.com", start: "22:57", end: "23:45", durSec: 2880, category: "Social Media", prod: "Non-Productive", switches: 4 },
      { app: "PowerPoint", type: "Application", url: "-", start: "21:30", end: "22:48", durSec: 4620, category: "Office", prod: "Productive", switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://github.com", start: "20:20", end: "21:27", durSec: 4020, category: "Coding", prod: "Productive", switches: 3 },
      { app: "IntelliJ IDEA", type: "Application", url: "-", start: "18:55", end: "20:16", durSec: 4860, category: "Coding", prod: "Productive", switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://codechef.com", start: "17:31", end: "18:47", durSec: 4500, category: "Coding", prod: "Productive", switches: 2 },
      { app: "Discord", type: "Application", url: "-", start: "16:24", end: "17:27", durSec: 3780, category: "Communication", prod: "Non-Productive", switches: 1 },
    ];

    const logsToInsert = [];
    const baseDate = new Date("2026-08-12T00:00:00.000Z");

    // Add exact 15 screenshot rows first (IDs 1 to 15)
    exactScreenshotRows.forEach((r) => {
      const [sh, sm] = r.start.split(":").map(Number);
      const [eh, em] = r.end.split(":").map(Number);
      const sDate = new Date(baseDate);
      sDate.setUTCHours(sh, sm, 0);
      const eDate = new Date(baseDate);
      eDate.setUTCHours(eh, em, 0);

      logsToInsert.push([
        1,
        sessionId,
        r.app === "Google Chrome" ? "chrome.exe" : `${r.app.toLowerCase().replace(/ /g, "_")}.exe`,
        r.app,
        `${r.app} - ${r.url !== "-" ? r.url : "Workspace"}`,
        r.url,
        r.type,
        sDate.toISOString(),
        eDate.toISOString(),
        r.durSec,
        r.category,
        r.prod,
        "MacBook Pro 16",
        "Windows 11 Pro",
        r.switches,
        sDate.toISOString(),
      ]);
    });

    // Fill remaining rows up to 1057
    const appProfiles = [
      { app: "Google Chrome", type: "Website", url: "https://udemy.com", category: "Learning", prod: "Productive", baseDur: 4680, switches: 3 },
      { app: "Google Chrome", type: "Website", url: "https://stackoverflow.com", category: "Research", prod: "Productive", baseDur: 2520, switches: 3 },
      { app: "PowerPoint", type: "Application", url: "-", category: "Office", prod: "Productive", baseDur: 900, switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://twitter.com", category: "Social Media", prod: "Non-Productive", baseDur: 2220, switches: 2 },
      { app: "Discord", type: "Application", url: "-", category: "Communication", prod: "Non-Productive", baseDur: 4560, switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://chat.openai.com", category: "Research", prod: "Productive", baseDur: 2280, switches: 1 },
      { app: "Spotify", type: "Application", url: "-", category: "Entertainment", prod: "Non-Productive", baseDur: 4140, switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://linkedin.com", category: "Office", prod: "Productive", baseDur: 3900, switches: 0 },
      { app: "Google Chrome", type: "Website", url: "https://facebook.com", category: "Social Media", prod: "Non-Productive", baseDur: 4380, switches: 0 },
      { app: "Google Chrome", type: "Website", url: "https://github.com", category: "Coding", prod: "Productive", baseDur: 4020, switches: 3 },
      { app: "IntelliJ IDEA", type: "Application", url: "-", category: "Coding", prod: "Productive", baseDur: 4860, switches: 1 },
      { app: "Google Chrome", type: "Website", url: "https://codechef.com", category: "Coding", prod: "Productive", baseDur: 4500, switches: 2 },
    ];

    for (let i = 15; i < 1057; i++) {
      const profile = appProfiles[i % appProfiles.length];
      const logStart = new Date(baseDate.getTime() + i * 3600 * 1000);
      const jitterDur = Math.max(300, Math.floor(profile.baseDur * (0.7 + Math.random() * 0.6)));
      const logEnd = new Date(logStart.getTime() + jitterDur * 1000);
      const switchCount = (profile.switches + Math.floor(Math.random() * 2)) % 5;

      logsToInsert.push([
        1,
        sessionId,
        profile.app === "Google Chrome" ? "chrome.exe" : `${profile.app.toLowerCase().replace(/ /g, "_")}.exe`,
        profile.app,
        `${profile.app} - ${profile.url !== "-" ? profile.url : "Workspace"}`,
        profile.url,
        profile.type,
        logStart.toISOString(),
        logEnd.toISOString(),
        jitterDur,
        profile.category,
        profile.prod,
        "MacBook Pro 16",
        "Windows 11 Pro",
        switchCount,
        logStart.toISOString(),
      ]);
    }

    // Bulk insert activity logs
    let insertedLogsCount = 0;
    const chunkSize = 100;
    for (let i = 0; i < logsToInsert.length; i += chunkSize) {
      const chunk = logsToInsert.slice(i, i + chunkSize);
      let query = `INSERT INTO activity_logs (user_id, monitoring_session_id, process_name, app_name, window_title, website_url, type, started_at, ended_at, duration_seconds, category, productivity_status, device_name, operating_system, switch_count, created_at) VALUES `;
      
      const values = [];
      const valueStrings = chunk.map((row, rIdx) => {
        const offset = rIdx * 16;
        values.push(...row);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`;
      });

      query += valueStrings.join(", ");
      const res = await pool.query(query, values);
      insertedLogsCount += res.rowCount;
    }
    console.log(`✅ Seeded ${insertedLogsCount} Activity Logs into PostgreSQL (IDs 1 through ${insertedLogsCount})!`);

    // 5. Generate 96 Distraction Events (matching pgAdmin Screenshot 5)
    console.log("⏳ Generating 96 Distraction Events matching pgAdmin image...");
    const distractionTypes = [
      "Social Media Interruption",
      "Social Media Switch",
      "Idle time detected",
      "YouTube distraction",
      "Frequent Alt-Tab detected",
    ];

    const distractionDescriptions = [
      "Navigated to Twitter timeline while working on documentation...",
      "Switched from VS Code to Instagram during deep work session...",
      "No mouse or keyboard Input recorded for over 15 minutes.",
      "Switched to YouTube entertainment video for 25 minutes.",
      "Context switching: swapped windows 18 times within 5 minutes...",
    ];

    const distractionsToInsert = [];
    const now = new Date();
    for (let i = 0; i < 96; i++) {
      const dType = distractionTypes[i % distractionTypes.length];
      const dDesc = distractionDescriptions[i % distractionDescriptions.length];
      const dTime = new Date(now.getTime() - Math.floor(Math.random() * 25 * 24 * 60 * 60 * 1000));

      distractionsToInsert.push([1, dType, dDesc, dTime.toISOString()]);
    }

    for (const [uId, dType, dDesc, dTime] of distractionsToInsert) {
      await pool.query(
        `INSERT INTO distraction_events (user_id, distraction_type, description, timestamp)
         VALUES ($1, $2, $3, $4)`,
        [uId, dType, dDesc, dTime]
      );
    }
    console.log("✅ Seeded 96 Distraction Events into PostgreSQL!");

    // 6. Generate 14-Day Performance History (Daily Focus Scores for Chart in Screenshot 1)
    console.log("⏳ Generating 14-Day Performance History...");
    const dailyScores = [88.0, 91.2, 79.5, 87.8, 86.4, 90.9, 80.1, 72.3, 93.0, 75.8, 89.2, 90.1, 74.9, 89.11];
    
    for (let i = 0; i < 14; i++) {
      const reportDate = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const score = dailyScores[i];
      const prodMins = Math.floor(300 + Math.random() * 100);
      const nonProdMins = Math.floor(40 + Math.random() * 50);

      await pool.query(
        `INSERT INTO daily_reports (user_id, report_date, focus_score, productive_minutes, non_productive_minutes, total_minutes, total_switches, distraction_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, report_date) DO UPDATE
         SET focus_score = $3, productive_minutes = $4, non_productive_minutes = $5, total_minutes = $6`,
        [1, reportDate, score, prodMins, nonProdMins, prodMins + nonProdMins, Math.floor(80 + Math.random() * 40), Math.floor(5 + Math.random() * 10)]
      );
    }
    console.log("✅ Seeded 14-Day Daily Reports into PostgreSQL!");

    // 7. Generate AI Focus Recommendations (Matching Screenshot 3)
    const recommendations = [
      {
        priority: "HIGH PRIORITY",
        category: "App Blocker",
        message: "Social Media Leak Alert: Instagram accounted for 24 minutes of non-productive activity during work hours.",
      },
      {
        priority: "LOW PRIORITY",
        category: "Habit Optimizer",
        message: "Great Progress: Your productive time increased by 12% compared with yesterday!",
      },
      {
        priority: "HIGH PRIORITY",
        category: "Context Switch Reduction",
        message: "High Context Switching Detected: You switched applications 24 times today. Try using 45-minute uninterrupted focus blocks.",
      },
    ];

    for (const rec of recommendations) {
      await pool.query(
        `INSERT INTO recommendations (user_id, priority, category, message)
         VALUES ($1, $2, $3, $4)`,
        [1, rec.priority, rec.category, rec.message]
      );
    }
    console.log("✅ Seeded AI Focus Recommendations!");

    // 8. Generate Focus Sessions
    for (let i = 1; i <= 6; i++) {
      await pool.query(
        `INSERT INTO focus_sessions (user_id, session_name, target_duration_minutes, actual_duration_minutes, status, started_at, ended_at)
         VALUES (1, $1, 45, $2, 'completed', NOW() - INTERVAL '${i * 2} hours', NOW() - INTERVAL '${i * 2 - 1} hours')`,
        [`Deep Coding Session #${i}`, Math.floor(40 + Math.random() * 10)]
      );
    }
    console.log("✅ Seeded Focus Sessions!");

    console.log("\n🎉 ALL SYNTHETIC DATA SUCCESSFULLY GENERATED AND STORED IN POSTGRESQL!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await pool.end();
  }
}

seedData();
