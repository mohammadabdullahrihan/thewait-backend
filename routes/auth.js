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

// @route   POST /api/auth/register
// @desc    Register new user
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
        return res
          .status(400)
          .json({
            success: false,
            message: "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে",
          });
      }
      const user = await User.create({ name, email, password, age, goal });
      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        message: "🎉 স্বাগতম সাধক! তোমার যাত্রা শুরু হলো",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          level: user.level,
          experience: user.experience,
          streak: user.streak,
          badges: user.badges,
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
        message: "✅ লগইন সফল হয়েছে",
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
    const { name, age, goal } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, age, goal },
      { new: true, runValidators: true },
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
