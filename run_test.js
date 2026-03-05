const request = require("supertest");
const app = require("./server");
const dbHandler = require("./tests/db-handler");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

(async () => {
  await dbHandler.connect();
  const user = await User.create({
    name: "Habit Warrior",
    email: "habit@test.com",
    password: "password123",
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "test");

  const habits = {
    wakeUp6am: true,
    workout: true,
    study: true,
    noFap: true,
    noCartoon: false,
    sleep10pm: false,
    journal: false,
  };
  const res = await request(app)
    .post("/api/habits/2026-03-06")
    .set("Authorization", "Bearer " + token)
    .send({ habits });

  console.log("Status Code:", res.statusCode);
  console.log("Response Body:", res.body);
  await dbHandler.closeDatabase();
})();
