const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: {
      type: String,
      enum: [
        "Cardio",
        "Calisthenics",
        "Core",
        "Strength",
        "Yoga",
        "Sports",
        "Other",
      ],
      required: true,
    },
    muscleGroup: {
      type: String,
      enum: [
        "Chest",
        "Back",
        "Legs",
        "Shoulders",
        "Arms",
        "Core",
        "Full Body",
        "None",
      ],
      default: "None",
    },
    exercises: [
      {
        name: { type: String, required: true },
        sets: { type: Number },
        reps: { type: Number },
        duration: { type: Number }, // seconds
        notes: { type: String },
      },
    ],
    totalDuration: { type: Number, default: 0 }, // minutes
    caloriesBurned: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

workoutSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Workout", workoutSchema);
