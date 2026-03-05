const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "নাম দিন"],
      trim: true,
      maxlength: [50, "নাম ৫০ অক্ষরের বেশি হতে পারবে না"],
    },
    email: {
      type: String,
      required: [true, "ইমেইল দিন"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "সঠিক ইমেইল দিন"],
    },
    password: {
      type: String,
      required: [true, "পাসওয়ার্ড দিন"],
      minlength: [6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"],
      select: false,
    },
    age: { type: Number },
    goal: { type: String, default: "নিজেকে জয় করা" },
    avatar: { type: String, default: "warrior" },
    joinDate: { type: Date, default: Date.now },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    totalBadges: { type: Number, default: 0 },
    badges: [
      {
        name: String,
        icon: String,
        earnedAt: Date,
        description: String,
      },
    ],
  },
  { timestamps: true },
);

// Password hash before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate level from XP
userSchema.methods.calculateLevel = function () {
  const xpPerLevel = 100;
  return Math.floor(this.experience / xpPerLevel) + 1;
};

module.exports = mongoose.model("User", userSchema);
