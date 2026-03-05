const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// @route   GET /api/habits/:date
router.get("/:date", protect, async (req, res) => {
  try {
    let habit = await Habit.findOne({
      userId: req.user.id,
      date: req.params.date,
    });
    if (!habit) {
      habit = {
        date: req.params.date,
        habits: {
          wakeUp6am: false,
          workout: false,
          study: false,
          noFap: false,
          noCartoon: false,
          sleep10pm: false,
          journal: false,
        },
        habitScore: 0,
      };
    }
    res.json({ success: true, habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST/PUT /api/habits/:date
router.post("/:date", protect, async (req, res) => {
  try {
    const { habits, notes } = req.body;
    let habit = await Habit.findOne({
      userId: req.user.id,
      date: req.params.date,
    });
    if (habit) {
      habit.habits = habits;
      habit.notes = notes;
      await habit.save();
    } else {
      habit = await Habit.create({
        userId: req.user.id,
        date: req.params.date,
        habits,
        notes,
      });
    }
    // Award XP based on habit score
    const xpEarned = habit.habitScore * 10;
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { experience: xpEarned },
    });

    // Check and update streak
    await updateStreak(req.user.id);
    // Check for badge awards
    await checkBadges(req.user.id);

    res.json({ success: true, habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/habits/streak/info
router.get("/streak/info", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      streak: user.streak,
      level: user.level,
      experience: user.experience,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/habits/history/:days
router.get("/history/:days", protect, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    const habits = await Habit.find({
      userId: req.user.id,
      date: { $gte: startDate.toISOString().split("T")[0] },
    }).sort({ date: -1 });
    res.json({ success: true, habits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: Update user streak
async function updateStreak(userId) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  const todayHabit = await Habit.findOne({ userId, date: today });
  const yesterdayHabit = await Habit.findOne({ userId, date: yDate });

  const user = await User.findById(userId);
  if (todayHabit && todayHabit.habitScore >= 5) {
    if (
      !user.streak.lastUpdated ||
      user.streak.lastUpdated.toISOString().split("T")[0] !== today
    ) {
      let newStreak = 1;
      if (yesterdayHabit && yesterdayHabit.habitScore >= 5) {
        newStreak = user.streak.current + 1;
      }
      user.streak.current = newStreak;
      user.streak.longest = Math.max(user.streak.longest, newStreak);
      user.streak.lastUpdated = new Date();
      await user.save();
    }
  }
}

// Helper: Check and award badges
async function checkBadges(userId) {
  const user = await User.findById(userId);
  const badges = user.badges.map((b) => b.name);

  const badgeDefinitions = [
    {
      name: "Bronze Warrior",
      days: 7,
      icon: "🥉",
      description: "৭ দিন ধরে রুটিন ফলো করেছ",
    },
    {
      name: "Silver Warrior",
      days: 30,
      icon: "🥈",
      description: "৩০ দিন ধরে রুটিন ফলো করেছ",
    },
    {
      name: "Gold Warrior",
      days: 90,
      icon: "🥇",
      description: "৯০ দিন ধরে রুটিন ফলো করেছ",
    },
    {
      name: "Streak Master",
      days: 30,
      icon: "⚡",
      description: "৩০ দিন নো-ফ্যাপ স্ট্রিক",
    },
  ];

  for (const badge of badgeDefinitions) {
    if (!badges.includes(badge.name) && user.streak.current >= badge.days) {
      user.badges.push({
        name: badge.name,
        icon: badge.icon,
        earnedAt: new Date(),
        description: badge.description,
      });
    }
  }
  user.level = user.calculateLevel();
  await user.save();
}

module.exports = router;
