const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");
const Routine = require("../models/Routine");
const Workout = require("../models/Workout");
const Journal = require("../models/Journal");
const StudyProgress = require("../models/StudyProgress");
const { protect } = require("../middleware/auth");

// @route   GET /api/analytics/dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const startDate = last30Days.toISOString().split("T")[0];

    // Fetch all data in parallel
    const [habits, routines, workouts, journals, studyProgress] =
      await Promise.all([
        Habit.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
        Routine.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
        Workout.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
        Journal.find({ userId, date: { $gte: startDate } })
          .sort({ date: 1 })
          .select("date mood"),
        StudyProgress.find({ userId }),
      ]);

    // Calculate stats
    const avgHabitScore = habits.length
      ? (
          habits.reduce((sum, h) => sum + h.habitScore, 0) / habits.length
        ).toFixed(1)
      : 0;
    const avgRoutineCompletion = routines.length
      ? (
          routines.reduce((sum, r) => sum + r.completionRate, 0) /
          routines.length
        ).toFixed(1)
      : 0;
    const totalWorkouts = workouts.length;
    const totalStudyHours = studyProgress
      .reduce((sum, s) => sum + s.totalHours, 0)
      .toFixed(1);
    const avgMood = journals.length
      ? (
          journals.reduce((sum, j) => sum + j.mood, 0) / journals.length
        ).toFixed(1)
      : 0;

    // Weekly data for charts
    const weeklyHabitData = habits
      .slice(-7)
      .map((h) => ({ date: h.date, score: h.habitScore }));
    const weeklyRoutineData = routines
      .slice(-7)
      .map((r) => ({ date: r.date, completion: r.completionRate }));
    const moodTrend = journals
      .slice(-14)
      .map((j) => ({ date: j.date, mood: j.mood }));

    res.json({
      success: true,
      stats: {
        avgHabitScore,
        avgRoutineCompletion,
        totalWorkouts,
        totalStudyHours,
        avgMood,
        daysTracked: habits.length,
      },
      charts: { weeklyHabitData, weeklyRoutineData, moodTrend },
      studyProgress: studyProgress.map((s) => ({
        subject: s.subject,
        totalHours: s.totalHours.toFixed(1),
        completedTopics: s.topics.filter((t) => t.completed).length,
        totalTopics: s.topics.length,
        lastScore: s.testScores.length
          ? s.testScores[s.testScores.length - 1]
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/heatmap
router.get("/heatmap", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const habits = await Habit.find({
      userId,
      date: { $gte: startDate.toISOString().split("T")[0] },
    }).select("date habitScore");
    const heatmapData = habits.map((h) => ({
      date: h.date,
      count: h.habitScore,
    }));
    res.json({ success: true, heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
