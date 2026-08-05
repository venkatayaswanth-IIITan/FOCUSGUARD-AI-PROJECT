const express = require("express");
const verifyToken = require("../middleware/authMiddleware");

const {
  startSession,
  stopSession,
  getCurrentSession,
  getSessionById,
  getSessionLogs,
  getSessionSwitches,
  getSessionAnalyticsHandler,
} = require("../controllers/activityController");

const router = express.Router();

// Session control endpoints
router.post("/start", verifyToken, startSession);
router.post("/stop", verifyToken, stopSession);
router.get("/status", verifyToken, getCurrentSession);
router.get("/current", verifyToken, getCurrentSession);

// Backward compatibility routes for /session/...
router.post("/session/start", verifyToken, startSession);
router.post("/session/stop", verifyToken, stopSession);
router.get("/session/current", verifyToken, getCurrentSession);
router.get("/session/:sessionId", verifyToken, getSessionById);

// Specific data and analytics endpoints
router.get("/session/:sessionId/logs", verifyToken, getSessionLogs);
router.get("/session/:sessionId/switches", verifyToken, getSessionSwitches);
router.get("/session/:sessionId/analytics", verifyToken, getSessionAnalyticsHandler);

module.exports = router;
