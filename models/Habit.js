const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    habits: {
      wakeUp6am: { type: Boolean, default: false },
      workout: { type: Boolean, default: false },
      study: { type: Boolean, default: false },
      noFap: { type: Boolean, default: false },
      noCartoon: { type: Boolean, default: false },
      sleep10pm: { type: Boolean, default: false },
      journal: { type: Boolean, default: false },
    },
    habitScore: { type: Number, default: 0 }, // 0-7 how many habits completed
    notes: { type: String },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, date: 1 }, { unique: true });

// Calculate habit score middleware
habitSchema.pre("save", function () {
  const h = this.habits || {};
  const values = [
    h.wakeUp6am,
    h.workout,
    h.study,
    h.noFap,
    h.noCartoon,
    h.sleep10pm,
    h.journal,
  ];
  this.habitScore = values.filter(Boolean).length;
});

module.exports = mongoose.model("Habit", habitSchema);
