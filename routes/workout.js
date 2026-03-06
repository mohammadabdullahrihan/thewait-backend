const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const { protect } = require("../middleware/auth");
const { syncTaskFromAction } = require("../utils/routineSync");

// @route   GET /api/workout/:date
router.get("/:date", protect, async (req, res) => {
  if (req.params.date === "history") {
    return res
      .status(400)
      .json({ success: false, message: "Use /history/:days route" });
  }
  try {
    const workouts = await Workout.find({
      userId: req.user.id,
      date: req.params.date,
    });
    // For dashboard compat - return first as .workout too
    res.json({ success: true, workouts, workout: workouts[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/workout
router.post("/", protect, async (req, res) => {
  try {
    const {
      date,
      type,
      muscleGroup,
      exercises,
      totalDuration,
      caloriesBurned,
      notes,
    } = req.body;
    const workout = await Workout.create({
      userId: req.user.id,
      date,
      type,
      muscleGroup: muscleGroup || "None",
      exercises,
      totalDuration,
      caloriesBurned,
      notes,
    });

    // Auto-sync with Routine (Mark 'Health' tasks as completed)
    await syncTaskFromAction(req.user.id, date, "Health");

    res
      .status(201)
      .json({ success: true, workout, message: "💪 ওয়ার্কআউট লগ করা হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/workout/history/:days
router.get("/history/:days", protect, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const workouts = await Workout.find({
      userId: req.user.id,
      date: { $gte: startDate.toISOString().split("T")[0] },
    }).sort({ date: -1 });
    res.json({ success: true, workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/workout/muscle/stats - Muscle group weekly stats
router.get("/muscle/stats", protect, async (req, res) => {
  try {
    const days = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const workouts = await Workout.find({
      userId: req.user.id,
      date: { $gte: startDate.toISOString().split("T")[0] },
    }).select("muscleGroup totalDuration date");

    const stats = {};
    workouts.forEach((w) => {
      const group = w.muscleGroup || "None";
      if (!stats[group]) stats[group] = { count: 0, minutes: 0 };
      stats[group].count += 1;
      stats[group].minutes += w.totalDuration || 0;
    });

    const result = Object.entries(stats).map(([group, data]) => ({
      group,
      sessions: data.count,
      minutes: data.minutes,
    }));

    res.json({ success: true, muscleStats: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/workout/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!workout)
      return res
        .status(404)
        .json({ success: false, message: "ওয়ার্কআউট পাওয়া যায়নি" });
    res.json({ success: true, message: "ওয়ার্কআউট মুছে ফেলা হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
