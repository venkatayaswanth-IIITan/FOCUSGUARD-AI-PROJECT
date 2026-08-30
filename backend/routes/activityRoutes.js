const express = require("express");
const verifyToken = require("../middleware/authMiddleware");

const {
  startSession,
  stopSession,
  getCurrentSession,
  getSessionById,
  getSessionLogs,
  getRecentTelemetry,
  getSessionSwitches,
  getSessionAnalyticsHandler,
  getUserSessions,
  deleteSession,
  getMLMetrics,
  getFocusScoreAnalytics,
  getSwitchMatrixAnalytics,
  getDashboardOverview,
  chatWithAssistant,
} = require("../controllers/activityController");

const router = express.Router();

// Personal Assistant Chatbot endpoint powered by Groq API
router.post("/chat", chatWithAssistant);

// Dashboard Overview route
router.get("/dashboard-overview", verifyToken, getDashboardOverview);

// Recent Telemetry Logs across sessions
router.get("/recent-telemetry", verifyToken, getRecentTelemetry);

// Session control endpoints
router.post("/start", verifyToken, startSession);
router.post("/stop", verifyToken, stopSession);
router.get("/status", verifyToken, getCurrentSession);
router.get("/current", verifyToken, getCurrentSession);
router.get("/sessions", verifyToken, getUserSessions);
router.delete("/session/:sessionId", verifyToken, deleteSession);
router.get("/ml-metrics", getMLMetrics);

// Analytics — Focus Score & Switch Matrix
router.get("/analytics/focus-score", verifyToken, getFocusScoreAnalytics);
router.get("/analytics/switch-matrix", verifyToken, getSwitchMatrixAnalytics);

// Backward compatibility routes for /session/...
router.post("/session/start", verifyToken, startSession);
router.post("/session/stop", verifyToken, stopSession);
router.get("/session/current", verifyToken, getCurrentSession);
router.get("/session/ml-metrics", getMLMetrics);
router.get("/session/:sessionId", verifyToken, getSessionById);

// Specific data and analytics endpoints
router.get("/session/:sessionId/logs", verifyToken, getSessionLogs);
router.get("/session/:sessionId/switches", verifyToken, getSessionSwitches);
router.get("/session/:sessionId/analytics", verifyToken, getSessionAnalyticsHandler);

module.exports = router;

