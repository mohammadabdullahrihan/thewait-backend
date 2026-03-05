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

beforeEach(async () => {
  user = await User.create({
    name: "Analytics Warrior",
    email: "analytics@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

afterEach(async () => await dbHandler.clearDatabase());

describe("Analytics Endpoints", () => {
  it("GET /api/analytics/dashboard → returns structured stats object with empty data", async () => {
    const res = await request(app)
      .get("/api/analytics/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("stats");
    expect(res.body).toHaveProperty("charts");
    expect(res.body.stats).toHaveProperty("avgHabitScore");
    expect(res.body.stats).toHaveProperty("totalWorkouts");
    expect(res.body.stats).toHaveProperty("avgMood");
    expect(res.body.stats).toHaveProperty("milestones");
    expect(res.body.charts).toHaveProperty("weeklyHabitData");
    expect(res.body.charts).toHaveProperty("moodTrend");
    expect(res.body.charts).toHaveProperty("routineTrend");
  });

  it("GET /api/analytics/heatmap → returns heatmap data array", async () => {
    const res = await request(app)
      .get("/api/analytics/heatmap")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.heatmapData)).toBe(true);
  });

  it("Unauthenticated request → 401", async () => {
    const res = await request(app).get("/api/analytics/dashboard");
    expect(res.statusCode).toEqual(401);
  });
});
