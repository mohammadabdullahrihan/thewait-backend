const express = require("express");
const router = express.Router();
const Milestone = require("../models/Milestone");
const { protect } = require("../middleware/auth");

// @route   GET /api/milestones
// @desc    Get all milestones for user
router.get("/", protect, async (req, res) => {
  try {
    const milestones = await Milestone.find({ userId: req.user.id }).sort({
      startDate: 1,
    });
    res.json({ success: true, milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/milestones
// @desc    Add a new milestone
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      phase,
      startDate,
      endDate,
      status,
      category,
      tasks,
      priority,
    } = req.body;
    const milestone = await Milestone.create({
      userId: req.user.id,
      title,
      phase,
      startDate,
      endDate,
      status,
      category,
      tasks,
      priority,
    });
    res.json({ success: true, milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/milestones/:id
// @desc    Update a milestone
router.put("/:id", protect, async (req, res) => {
  try {
    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { returnDocument: "after" },
    );
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "মাইলস্টোন খুঁজে পাওয়া যায়নি" });
    }
    res.json({ success: true, milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/milestones/:id
// @desc    Delete a milestone
router.delete("/:id", protect, async (req, res) => {
  try {
    const milestone = await Milestone.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "মাইলস্টোন খুঁজে পাওয়া যায়নি" });
    }
    res.json({ success: true, message: "মাইলস্টোন মুছে ফেলা হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
