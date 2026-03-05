const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    const email = "admin@thewait.com";
    const password = "thewaitadmin123";

    await mongoose.connect(process.env.MONGO_URI);

    // Define schema locally to avoid middleware context issues in script
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: { type: String, select: false },
      age: Number,
      goal: String,
    });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists");
      process.exit(0);
    }

    // Manual hash because we are bypassing model middleware for the script context
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name: "Admin",
      email: email,
      password: hashedPassword,
      age: 25,
      goal: "Manage the Wait",
    });

    console.log("✅ Admin user created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating user:", err.message);
    process.exit(1);
  }
};

createAdminUser();
