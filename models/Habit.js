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
habitSchema.pre("save", function (next) {
  const h = this.habits;
  this.habitScore = Object.values(h).filter(Boolean).length;
  next();
});

module.exports = mongoose.model("Habit", habitSchema);
