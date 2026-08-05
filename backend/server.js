const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../.env" });

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const activityRoutes = require("./routes/activityRoutes");
const {
  recordActivitySwitch,
  recordIdleEvent,
  calculateLiveSessionStats
} = require("./controllers/activityController");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/monitoring", activityRoutes); // Alias for prompt spec compliance

app.get("/", (req, res) => {
  res.json({ message: "FocusGuard AI API & Socket Server Running 🚀" });
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const isAgent = socket.handshake.auth?.isAgent || socket.handshake.headers?.isagent;
  if (isAgent) {
    socket.isAgent = true;
    return next();
  }

  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (!token || token === "Bearer null" || token === "Bearer undefined" || token === "null") {
    socket.user = { id: 1, email: "yaswanth@example.com", username: "yaswanth" };
    return next();
  }

  try {
    const rawToken = token.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET || "focusguard_secret_key";
    const decoded = jwt.verify(rawToken, secret);
    socket.user = decoded;
    next();
  } catch (err) {
    socket.user = { id: 1, email: "yaswanth@example.com", username: "yaswanth" };
    next();
  }
});

// State Tracking
let agentSocket = null;
let isAgentConnected = false;
let lastAgentPing = 0;

// userId -> { sessionId, sessionStartedAt, currentApp }
const activeUserSessions = new Map();

io.on("connection", (socket) => {

  /*
  ------------------------------------------------
  PYTHON MONITORING AGENT SOCKET CONNECTION
  ------------------------------------------------
  */
  if (socket.isAgent) {
    agentSocket = socket;
    isAgentConnected = true;
    lastAgentPing = Date.now();

    console.log("🟢 Python Windows Activity Monitoring Agent Connected to Socket.IO.");
    io.emit("agent:status", { connected: true });

    // Handle agent ping heartbeat
    socket.on("agent:ping", () => {
      lastAgentPing = Date.now();
      if (!isAgentConnected) {
        isAgentConnected = true;
        io.emit("agent:status", { connected: true });
      }
    });

    // Handle activity update from Python Agent
    socket.on("agent:activity_update", async (data) => {
      lastAgentPing = Date.now();
      isAgentConnected = true;

      const { app_name, process_name, window_title, start_time } = data;

      for (const [userId, userSession] of activeUserSessions.entries()) {
        if (!userSession.sessionId) continue;

        userSession.currentApp = {
          process_name: process_name || null,
          app_name,
          window_title: window_title || null,
          start_time: start_time || new Date().toISOString(),
        };

        const liveStats = await calculateLiveSessionStats(
          userId,
          userSession.sessionId,
          userSession.sessionStartedAt
        );

        io.to(`user_${userId}`).emit("activity:current", {
          currentApp: userSession.currentApp,
          stats: liveStats,
          isAgentConnected: true,
        });
      }
    });

    // Handle completed application switch from Python Agent
    socket.on("agent:app_switch", async (data) => {
      lastAgentPing = Date.now();
      isAgentConnected = true;

      for (const [userId, userSession] of activeUserSessions.entries()) {
        if (!userSession.sessionId) continue;

        await recordActivitySwitch(userId, userSession.sessionId, data);

        const liveStats = await calculateLiveSessionStats(
          userId,
          userSession.sessionId,
          userSession.sessionStartedAt
        );

        io.to(`user_${userId}`).emit("activity:changed", {
          previousApp: data.from_app,
          currentApp: data.to_app,
          durationSeconds: data.duration_seconds,
          stats: liveStats,
        });
      }
    });

    // Handle idle start from Python Agent
    socket.on("agent:idle_start", (data) => {
      lastAgentPing = Date.now();
      isAgentConnected = true;

      for (const [userId, userSession] of activeUserSessions.entries()) {
        if (!userSession.sessionId) continue;
        io.to(`user_${userId}`).emit("idle:started", data);
      }
    });

    // Handle idle end from Python Agent
    socket.on("agent:idle_end", async (data) => {
      lastAgentPing = Date.now();
      isAgentConnected = true;

      for (const [userId, userSession] of activeUserSessions.entries()) {
        if (!userSession.sessionId) continue;
        await recordIdleEvent(userId, userSession.sessionId, data);

        const liveStats = await calculateLiveSessionStats(
          userId,
          userSession.sessionId,
          userSession.sessionStartedAt
        );

        io.to(`user_${userId}`).emit("idle:ended", {
          idleData: data,
          stats: liveStats,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Python Windows Activity Monitoring Agent Disconnected.");
      agentSocket = null;
      isAgentConnected = false;
      io.emit("agent:status", { connected: false });
    });

    return;
  }

  /*
  ------------------------------------------------
  REACT DASHBOARD CLIENT SOCKET CONNECTION
  ------------------------------------------------
  */
  const userId = socket.user?.id || 1;
  socket.join(`user_${userId}`);

  const agentAlive = Boolean(agentSocket && agentSocket.connected && (Date.now() - lastAgentPing < 15000));
  socket.emit("agent:status", { connected: agentAlive });

  // Client requests session sync
  socket.on("client:sync", async () => {
    const activeCheck = await pool.query(
      `SELECT * FROM monitoring_sessions WHERE user_id = $1 AND status = 'active' ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    const isAgentAlive = Boolean(agentSocket && agentSocket.connected && (Date.now() - lastAgentPing < 15000));

    if (activeCheck.rows.length > 0) {
      const session = activeCheck.rows[0];
      const stats = await calculateLiveSessionStats(userId, session.id, session.started_at);

      if (!activeUserSessions.has(userId)) {
        activeUserSessions.set(userId, {
          sessionId: session.id,
          sessionStartedAt: session.started_at,
          currentApp: null,
        });
      }

      const userSession = activeUserSessions.get(userId);
      socket.emit("monitoring:status", {
        isMonitoring: true,
        session,
        stats,
        currentApp: userSession?.currentApp || null,
        isAgentConnected: isAgentAlive,
      });
    } else {
      activeUserSessions.delete(userId);
      socket.emit("monitoring:status", {
        isMonitoring: false,
        session: null,
        stats: null,
        currentApp: null,
        isAgentConnected: isAgentAlive,
      });
    }
  });

  // User clicked START MONITORING in React
  socket.on("client:start_monitoring", async (sessionData) => {
    activeUserSessions.set(userId, {
      sessionId: sessionData.id,
      sessionStartedAt: sessionData.started_at,
      currentApp: null,
    });

    // Notify Python agent to start polling
    if (agentSocket && agentSocket.connected) {
      agentSocket.emit("agent:start_monitoring", { sessionId: sessionData.id });
    }

    const stats = await calculateLiveSessionStats(userId, sessionData.id, sessionData.started_at);
    const isAgentAlive = Boolean(agentSocket && agentSocket.connected && (Date.now() - lastAgentPing < 15000));

    io.to(`user_${userId}`).emit("monitoring:started", {
      session: sessionData,
      stats,
      isAgentConnected: isAgentAlive,
    });
  });

  // User clicked STOP MONITORING in React
  socket.on("client:stop_monitoring", async () => {
    // Notify Python agent to stop polling
    if (agentSocket && agentSocket.connected) {
      agentSocket.emit("agent:stop_monitoring");
    }

    activeUserSessions.delete(userId);
    io.to(`user_${userId}`).emit("monitoring:stopped");
  });
});

// Periodic heartbeat pulse check for Python agent connection
setInterval(() => {
  const agentAlive = Boolean(agentSocket && agentSocket.connected && (Date.now() - lastAgentPing < 15000));
  if (isAgentConnected !== agentAlive) {
    isAgentConnected = agentAlive;
    io.emit("agent:status", { connected: isAgentConnected });
  }
}, 3000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 FocusGuard API & Socket.IO running on http://localhost:${PORT}`);
});
