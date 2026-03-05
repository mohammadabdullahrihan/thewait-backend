const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const { protect } = require("../middleware/auth");

// @route   GET /api/journal/:date
router.get("/:date", protect, async (req, res) => {
  try {
    let entry = await Journal.findOne({
      userId: req.user.id,
      date: req.params.date,
    });
    if (!entry) {
      entry = {
        date: req.params.date,
        goodThings: "",
        learned: "",
        improvements: "",
        gratitude: "",
        mood: 5,
        freeWrite: "",
      };
    }
    res.json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/journal/:date
router.post("/:date", protect, async (req, res) => {
  try {
    const { goodThings, learned, improvements, gratitude, mood, freeWrite } =
      req.body;
    let entry = await Journal.findOne({
      userId: req.user.id,
      date: req.params.date,
    });
    if (entry) {
      entry.goodThings = goodThings;
      entry.learned = learned;
      entry.improvements = improvements;
      entry.gratitude = gratitude;
      entry.mood = mood;
      entry.freeWrite = freeWrite;
      await entry.save();
    } else {
      entry = await Journal.create({
        userId: req.user.id,
        date: req.params.date,
        goodThings,
        learned,
        improvements,
        gratitude,
        mood,
        freeWrite,
      });
    }
    res.json({ success: true, entry, message: "📔 ডায়েরি সংরক্ষিত হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/journal/list/:limit
router.get("/list/:limit", protect, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const entries = await Journal.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(limit);
    res.json({ success: true, entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/journal/mood/trend
router.get("/mood/trend", protect, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(30)
      .select("date mood");
    res.json({ success: true, moodData: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
