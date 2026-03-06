const express = require("express");
const router = express.Router();
const StudyProgress = require("../models/StudyProgress");
const { protect } = require("../middleware/auth");
const { syncTaskFromAction } = require("../utils/routineSync");

// @route   GET /api/study
router.get("/", protect, async (req, res) => {
  try {
    const progress = await StudyProgress.find({ userId: req.user.id });
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/study/:subject
router.get("/:subject", protect, async (req, res) => {
  try {
    let progress = await StudyProgress.findOne({
      userId: req.user.id,
      subject: req.params.subject,
    });
    if (!progress) {
      progress = {
        subject: req.params.subject,
        topics: [],
        totalHours: 0,
        testScores: [],
        sessionsLog: [],
      };
    }
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/study/:subject/session
router.post("/:subject/session", protect, async (req, res) => {
  try {
    const { duration, topic, date } = req.body;
    let progress = await StudyProgress.findOne({
      userId: req.user.id,
      subject: req.params.subject,
    });
    if (!progress) {
      progress = await StudyProgress.create({
        userId: req.user.id,
        subject: req.params.subject,
        topics: [],
        totalHours: 0,
      });
    }
    progress.sessionsLog.push({
      date: date || new Date().toISOString().split("T")[0],
      duration,
      topic,
    });
    progress.totalHours += duration / 60;
    await progress.save();

    // Auto-sync with Routine (Mark 'Study' tasks as completed)
    const sessionDate = date || new Date().toISOString().split("T")[0];
    await syncTaskFromAction(req.user.id, sessionDate, "Study");

    res.json({
      success: true,
      progress,
      message: `✅ ${duration} মিনিট পড়াশোনা লগ করা হয়েছে`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/study/:subject/score
router.post("/:subject/score", protect, async (req, res) => {
  try {
    const { testName, score, maxScore, notes } = req.body;
    let progress = await StudyProgress.findOne({
      userId: req.user.id,
      subject: req.params.subject,
    });
    if (!progress) {
      progress = await StudyProgress.create({
        userId: req.user.id,
        subject: req.params.subject,
        topics: [],
      });
    }
    progress.testScores.push({
      testName,
      score,
      maxScore: maxScore || 100,
      date: new Date(),
      notes,
    });
    await progress.save();
    res.json({ success: true, progress, message: "📊 স্কোর সংরক্ষিত হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/study/:subject/topic
router.post("/:subject/topic", protect, async (req, res) => {
  try {
    const { name } = req.body;
    let progress = await StudyProgress.findOne({
      userId: req.user.id,
      subject: req.params.subject,
    });
    if (!progress) {
      progress = await StudyProgress.create({
        userId: req.user.id,
        subject: req.params.subject,
        topics: [],
      });
    }
    progress.topics.push({ name, completed: false });
    await progress.save();
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/study/:subject/topic/:topicId
router.put("/:subject/topic/:topicId", protect, async (req, res) => {
  try {
    const { completed } = req.body;
    const progress = await StudyProgress.findOne({
      userId: req.user.id,
      subject: req.params.subject,
    });
    if (!progress)
      return res
        .status(404)
        .json({ success: false, message: "প্রোগ্রেস পাওয়া যায়নি" });
    const topic = progress.topics.id(req.params.topicId);
    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "টপিক পাওয়া যায়নি" });
    topic.completed = completed;
    topic.completedAt = completed ? new Date() : null;
    await progress.save();
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
