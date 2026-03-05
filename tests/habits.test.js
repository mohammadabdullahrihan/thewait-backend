const request = require("supertest");
const app = require("../server");
const dbHandler = require("./db-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

jest.setTimeout(30000);

let token;
let user;

beforeAll(async () => await dbHandler.connect());
afterAll(async () => await dbHandler.closeDatabase());
afterEach(async () => await dbHandler.clearDatabase());

// Re-create user after each clear so token still resolves
beforeEach(async () => {
  user = await User.create({
    name: "Habit Warrior",
    email: "habit@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

describe("Habit Endpoints", () => {
  const DATE = "2026-03-06";

  it("GET /api/habits/:date → returns default when no record exists", async () => {
    const res = await request(app)
      .get(`/api/habits/${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.habit).toHaveProperty("habits");
    expect(res.body.habit.habits).toHaveProperty("wakeUp6am", false);
  });

  it("POST /api/habits/:date → saves habits and returns updated record", async () => {
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
      .post(`/api/habits/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ habits });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.habit.habits.wakeUp6am).toBe(true);
    expect(res.body.habit.habits.workout).toBe(true);
  });

  it("POST /api/habits/:date → updates an existing record", async () => {
    const firstHabits = {
      wakeUp6am: true,
      workout: false,
      study: false,
      noFap: false,
      noCartoon: false,
      sleep10pm: false,
      journal: false,
    };
    await request(app)
      .post(`/api/habits/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ habits: firstHabits });

    const updatedHabits = { ...firstHabits, workout: true };
    const res = await request(app)
      .post(`/api/habits/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ habits: updatedHabits });

    expect(res.statusCode).toEqual(200);
    expect(res.body.habit.habits.workout).toBe(true);
  });

  it("GET /api/habits/streak/info → returns user streak info", async () => {
    const res = await request(app)
      .get("/api/habits/streak/info")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("streak");
    expect(res.body).toHaveProperty("level");
    expect(res.body).toHaveProperty("experience");
  });

  it("GET /api/habits/history/:days → returns habit history array", async () => {
    const res = await request(app)
      .get("/api/habits/history/30")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.habits)).toBe(true);
  });

  it("Unauthenticated request to habits → 401", async () => {
    const res = await request(app).get(`/api/habits/${DATE}`);
    expect(res.statusCode).toEqual(401);
  });
});
