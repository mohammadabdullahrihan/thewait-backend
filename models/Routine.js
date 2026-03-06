const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD format
    name: { type: String, default: "Daily" },
    tasks: [
      {
        time: { type: String },
        task: { type: String, required: true },
        category: {
          type: String,
          enum: [
            "Discipline",
            "Study",
            "Health",
            "Mindfulness",
            "Ibadat",
            "Other",
          ],
          default: "Other",
        },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
    completionRate: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

routineSchema.index({ userId: 1, date: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Routine", routineSchema);
