const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Badge definitions for gamification
const BADGE_CATALOG = [
  {
    id: "first_entry",
    name: "প্রথম পদক্ষেপ",
    icon: "🚀",
    description: "প্রথম রুটিন বা জার্নাল এন্ট্রি",
    rarity: "common",
  },
  {
    id: "streak_7",
    name: "Elite Warrior",
    icon: "🔥",
    description: "টানা ৭ দিন সব কাজ সম্পন্ন",
    rarity: "rare",
  },
  {
    id: "streak_30",
    name: "Iron Discipline",
    icon: "⚔️",
    description: "টানা ৩০ দিনের স্ট্রিক",
    rarity: "epic",
  },
  {
    id: "study_10h",
    name: "Scholar",
    icon: "📚",
    description: "মোট ১০ ঘণ্টা পড়াশোনা",
    rarity: "common",
  },
  {
    id: "study_50h",
    name: "Grand Scholar",
    icon: "🎓",
    description: "মোট ৫০ ঘণ্টা পড়াশোনা",
    rarity: "rare",
  },
  {
    id: "workout_10",
    name: "Warrior Body",
    icon: "💪",
    description: "১০টি ওয়ার্কআউট সম্পন্ন",
    rarity: "common",
  },
  {
    id: "journal_7",
    name: "Mindful One",
    icon: "🧘",
    description: "টানা ৭ দিন জার্নাল করা",
    rarity: "rare",
  },
  {
    id: "level_5",
    name: "Rising Star",
    icon: "⭐",
    description: "লেভেল ৫ অর্জন",
    rarity: "common",
  },
  {
    id: "level_10",
    name: "Champion",
    icon: "🏆",
    description: "লেভেল ১০ অর্জন",
    rarity: "epic",
  },
  {
    id: "level_20",
    name: "Supreme Overlord",
    icon: "👑",
    description: "লেভেল ২০ অর্জন",
    rarity: "legendary",
  },
];

// @route   POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("নাম দিন"),
    body("email").isEmail().withMessage("সঠিক ইমেইল দিন").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { name, email, password, age, goal } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে",
        });
      }
      const user = await User.create({ name, email, password, age, goal });
      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        message: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। স্বাগতম!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          level: user.level,
          experience: user.experience,
          streak: user.streak,
          badges: user.badges,
          focusMode: user.focusMode,
          totalFocusMinutes: user.totalFocusMinutes,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// @route   POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("সঠিক ইমেইল দিন").normalizeEmail(),
    body("password").notEmpty().withMessage("পাসওয়ার্ড দিন"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res
          .status(401)
          .json({ success: false, message: "ইমেইল বা পাসওয়ার্ড ভুল" });
      }
      const token = generateToken(user._id);
      res.json({
        success: true,
        message: "সফলভাবে লগইন করা হয়েছে",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          level: user.level,
          experience: user.experience,
          streak: user.streak,
          badges: user.badges,
          goal: user.goal,
          age: user.age,
          focusMode: user.focusMode,
          totalFocusMinutes: user.totalFocusMinutes,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
});

// @route   PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, age, goal, activeRoutineName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, age, goal, activeRoutineName },
      { returnDocument: "after", runValidators: true },
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/focus-mode - Toggle Warrior Focus Mode
router.post("/focus-mode", protect, async (req, res) => {
  try {
    const { active, minutes } = req.body;
    const user = await User.findById(req.user.id);
    user.focusMode = active;
    if (!active && minutes > 0) {
      user.totalFocusMinutes = (user.totalFocusMinutes || 0) + minutes;
      // Award XP for focus session
      user.experience = (user.experience || 0) + Math.floor(minutes / 5);
      user.level = user.calculateLevel();
    }
    await user.save();
    res.json({
      success: true,
      focusMode: user.focusMode,
      totalFocusMinutes: user.totalFocusMinutes,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/award-badge - Award a badge to the user
router.post("/award-badge", protect, async (req, res) => {
  try {
    const { badgeId } = req.body;
    const badge = BADGE_CATALOG.find((b) => b.id === badgeId);
    if (!badge)
      return res
        .status(404)
        .json({ success: false, message: "ব্যাজ পাওয়া যায়নি" });

    const user = await User.findById(req.user.id);
    // Check if already awarded
    const alreadyHas = user.badges.some((b) => b.id === badgeId);
    if (alreadyHas)
      return res.json({ success: true, alreadyOwned: true, user });

    user.badges.push({ ...badge, earnedAt: new Date() });
    user.totalBadges = user.badges.length;
    // XP bonus for badge
    const xpBonus =
      badge.rarity === "legendary"
        ? 500
        : badge.rarity === "epic"
          ? 200
          : badge.rarity === "rare"
            ? 100
            : 50;
    user.experience = (user.experience || 0) + xpBonus;
    user.level = user.calculateLevel();
    await user.save();

    res.json({
      success: true,
      badge,
      user,
      message: `🏆 "${badge.name}" ব্যাজ অর্জিত হয়েছে!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/badges - Get all badge catalog
router.get("/badges", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const catalog = BADGE_CATALOG.map((badge) => ({
      ...badge,
      owned: user.badges.some((b) => b.id === badge.id),
      earnedAt: user.badges.find((b) => b.id === badge.id)?.earnedAt || null,
    }));
    res.json({ success: true, catalog, userBadges: user.badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
