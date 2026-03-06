const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const { protect } = require("../middleware/auth");

// @route   GET /api/journal/:date
router.get("/:date", protect, async (req, res) => {
  // Prevent conflict with /list and /mood routes
  if (req.params.date === "list" || req.params.date === "mood") {
    return res.status(400).json({ success: false, message: "Invalid date" });
  }
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
        tags: [],
        photoUrl: "",
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
    const {
      goodThings,
      learned,
      improvements,
      gratitude,
      mood,
      freeWrite,
      tags,
      photoUrl,
    } = req.body;
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
      entry.tags = tags || [];
      if (photoUrl !== undefined) entry.photoUrl = photoUrl;
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
        tags: tags || [],
        photoUrl: photoUrl || "",
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

// @route   GET /api/journal/tags/popular - Get popular tags for autocomplete
router.get("/tags/popular", protect, async (req, res) => {
  try {
    const entries = await Journal.find({
      userId: req.user.id,
      "tags.0": { $exists: true },
    })
      .select("tags")
      .limit(100);
    const tagCount = {};
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
    res.json({ success: true, tags: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
