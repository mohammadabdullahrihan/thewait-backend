const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const { protect } = require("../middleware/auth");

// @route   GET /api/workout/:date
router.get("/:date", protect, async (req, res) => {
  try {
    const workouts = await Workout.find({
      userId: req.user.id,
      date: req.params.date,
    });
    res.json({ success: true, workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/workout
router.post("/", protect, async (req, res) => {
  try {
    const { date, type, exercises, totalDuration, caloriesBurned, notes } =
      req.body;
    const workout = await Workout.create({
      userId: req.user.id,
      date,
      type,
      exercises,
      totalDuration,
      caloriesBurned,
      notes,
    });
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
