// Script to fix the duplicate index issue on routines collection
require("dotenv").config();
const mongoose = require("mongoose");

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("routines");

    // List existing indexes
    const indexes = await collection.indexes();
    console.log(
      "Current indexes:",
      JSON.stringify(
        indexes.map((i) => ({ name: i.name, key: i.key })),
        null,
        2,
      ),
    );

    // Drop the old userId+date only index (without name) if it exists
    for (const idx of indexes) {
      const keys = Object.keys(idx.key);
      if (
        keys.length === 2 &&
        keys.includes("userId") &&
        keys.includes("date") &&
        !keys.includes("name")
      ) {
        console.log("Dropping old index:", idx.name);
        await collection.dropIndex(idx.name);
        console.log("Old index dropped successfully!");
      }
    }

    // Recreate the correct index
    await collection.createIndex(
      { userId: 1, date: 1, name: 1 },
      { unique: true },
    );
    console.log("New correct index (userId+date+name) created!");

    await mongoose.disconnect();
    console.log("Done! Indexes fixed.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

fixIndex();
