const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    goodThings: { type: String, default: "" },
    learned: { type: String, default: "" },
    improvements: { type: String, default: "" },
    gratitude: { type: String, default: "" },
    mood: { type: Number, min: 1, max: 10, default: 5 },
    freeWrite: { type: String, default: "" },
  },
  { timestamps: true },
);

journalSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Journal", journalSchema);
