const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");
const Routine = require("../models/Routine");
const Workout = require("../models/Workout");
const Journal = require("../models/Journal");
const StudyProgress = require("../models/StudyProgress");
const Milestone = require("../models/Milestone");
const { protect } = require("../middleware/auth");

// @route   GET /api/analytics/dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const startDate = last30Days.toISOString().split("T")[0];
    const prevStartDate = last60Days.toISOString().split("T")[0];

    // Fetch all data in parallel
    const [
      habits,
      prevHabits,
      routines,
      workouts,
      journals,
      studyProgress,
      milestones,
    ] = await Promise.all([
      Habit.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
      Habit.find({ userId, date: { $gte: prevStartDate, $lt: startDate } }),
      Routine.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
      Workout.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
      Journal.find({ userId, date: { $gte: startDate } })
        .sort({ date: 1 })
        .select("date mood"),
      StudyProgress.find({ userId }),
      Milestone.find({ userId }),
    ]);

    // Calculate stats
    const avgHabitScore = habits.length
      ? (
          habits.reduce((sum, h) => sum + h.habitScore, 0) / habits.length
        ).toFixed(1)
      : 0;

    const prevAvgHabitScore = prevHabits.length
      ? (
          prevHabits.reduce((sum, h) => sum + h.habitScore, 0) /
          prevHabits.length
        ).toFixed(1)
      : 0;

    const habitTrend =
      prevAvgHabitScore > 0
        ? (
            ((avgHabitScore - prevAvgHabitScore) / prevAvgHabitScore) *
            100
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

    // Milestone stats
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      (m) => m.status === "completed",
    ).length;
    const activeMilestones = milestones.filter(
      (m) => m.status === "active",
    ).length;

    // Weekly data for charts
    const weeklyHabitData = habits.slice(-7).map((h) => ({
      date: h.date,
      score: h.habitScore,
    }));

    const moodTrend = journals.slice(-14).map((j) => ({
      date: j.date,
      mood: j.mood,
    }));

    // Routine consistency (daily completion over 30 days)
    const routineTrend = routines.map((r) => ({
      date: r.date,
      completion: r.completionRate,
    }));

    res.json({
      success: true,
      stats: {
        avgHabitScore,
        habitTrend,
        avgRoutineCompletion,
        totalWorkouts,
        totalStudyHours,
        avgMood,
        daysTracked: habits.length,
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          active: activeMilestones,
          progress: totalMilestones
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0,
        },
      },
      charts: {
        weeklyHabitData,
        moodTrend,
        routineTrend,
      },
      studyProgress: studyProgress.map((s) => ({
        subject: s.subject,
        totalHours: s.totalHours.toFixed(1),
        completedTopics: s.topics.filter((t) => t.completed).length,
        totalTopics: s.topics.length,
        lastScore: s.testScores.length
          ? s.testScores[s.testScores.length - 1]
          : null,
      })),
      recentWorkouts: workouts.slice(-5).map((w) => ({
        date: w.date,
        type: w.type,
        duration: w.duration,
        intensity: w.intensity,
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

// @route   GET /api/analytics/ai-insights
router.get("/ai-insights", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const routines = await Routine.find({ userId, date: { $gte: last7Days } });
    const habits = await Habit.find({ userId, date: { $gte: last7Days } });

    let insights = [];

    const avgCompletion = routines.length
      ? routines.reduce((acc, r) => acc + r.completionRate, 0) / routines.length
      : 0;
    if (avgCompletion < 50) {
      insights.push(
        "আপনার রুটিন কমপ্লিশন রেট ৫০% এর নিচে। হয়তো আপনি একসাথে অনেক বেশি টাস্ক রাখছেন, প্রায়োরিটিতে ফোকাস করুন।",
      );
    } else if (avgCompletion >= 80) {
      insights.push(
        "দারুণ! আপনার রুটিন ফলো করার রেট খুব ভালো। এভাবেই চালিয়ে যান।",
      );
    }

    const avgHabit = habits.length
      ? habits.reduce((acc, h) => acc + h.habitScore, 0) / habits.length
      : 0;
    if (avgHabit < 3) {
      insights.push(
        "গত কয়েকদিন ধরে আপনার হ্যাবিট স্কোর কম। কোন হ্যাবিটগুলো মিস হচ্ছে সেগুলো বের করে কাজ করুন।",
      );
    } else if (avgHabit >= 5) {
      insights.push(
        "আপনার হ্যাবিটগুলো খুব সুন্দরভাবে মেইনটেইন হচ্ছে। এটি আপনাকে লং-টার্মে অনেক এগিয়ে নিবে!",
      );
    }

    if (insights.length === 0) {
      insights.push("তুমি সঠিক পথে আছো ওয়ারিয়র! নিজের শৃঙ্খলায় অটুট থাকো।");
    }

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];

    res.json({ success: true, insight: randomInsight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
