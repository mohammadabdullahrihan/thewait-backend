const mongoose = require("mongoose");

const studyProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      enum: [
        "Math",
        "Science",
        "Social Studies",
        "Language Arts",
        "IELTS",
        "Other",
      ],
      required: true,
    },
    topics: [
      {
        name: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        notes: { type: String },
      },
    ],
    totalHours: { type: Number, default: 0 },
    sessionsLog: [
      {
        date: { type: String }, // YYYY-MM-DD
        duration: { type: Number }, // minutes
        topic: { type: String },
      },
    ],
    testScores: [
      {
        testName: { type: String },
        score: { type: Number },
        maxScore: { type: Number, default: 100 },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true },
);

studyProgressSchema.index({ userId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("StudyProgress", studyProgressSchema);
