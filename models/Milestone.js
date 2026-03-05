const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    phase: { type: String, default: "" }, // e.g. Phase 1, Phase 2
    startDate: { type: String, required: true }, // YYYY-MM-DD or Month Year
    endDate: { type: String }, // YYYY-MM-DD or Month Year
    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming",
    },
    category: {
      type: String,
      enum: ["education", "career", "personal", "finance", "travel"],
      default: "personal",
    },
    tasks: [{ type: String }],
    priority: { type: Number, default: 2 }, // 1: High, 2: Medium, 3: Low
  },
  { timestamps: true },
);

module.exports = mongoose.model("Milestone", milestoneSchema);
