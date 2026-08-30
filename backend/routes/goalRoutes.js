const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

const router = express.Router();

router.get("/", verifyToken, getGoals);
router.post("/", verifyToken, createGoal);
router.patch("/:goalId", verifyToken, updateGoal);
router.put("/:goalId", verifyToken, updateGoal);
router.delete("/:goalId", verifyToken, deleteGoal);

module.exports = router;
