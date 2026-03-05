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
    name: "Journal Warrior",
    email: "journal@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

afterEach(async () => await dbHandler.clearDatabase());

describe("Journal Endpoints", () => {
  const DATE = "2026-03-06";

  it("GET /api/journal/:date → returns empty default entry when none exists", async () => {
    const res = await request(app)
      .get(`/api/journal/${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.entry).toHaveProperty("goodThings");
    expect(res.body.entry).toHaveProperty("mood", 5);
  });

  it("POST /api/journal/:date → saves a journal entry", async () => {
    const payload = {
      goodThings: "আজকে ভালো পড়েছি",
      learned: "নতুন কিছু শিখেছি",
      improvements: "আরও মনোযোগ দিতে হবে",
      gratitude: "আল্লাহর শুকরিয়া",
      mood: 8,
      freeWrite: "আজকে একটা দারুণ দিন ছিল",
    };
    const res = await request(app)
      .post(`/api/journal/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.entry.mood).toBe(8);
    expect(res.body.entry.goodThings).toBe("আজকে ভালো পড়েছি");
  });

  it("POST /api/journal/:date → updates an existing entry", async () => {
    await request(app)
      .post(`/api/journal/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ goodThings: "First entry", mood: 5 });

    const res = await request(app)
      .post(`/api/journal/${DATE}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ goodThings: "Updated entry", mood: 9 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.entry.goodThings).toBe("Updated entry");
    expect(res.body.entry.mood).toBe(9);
  });

  it("GET /api/journal/list/:limit → returns array of journals", async () => {
    const res = await request(app)
      .get("/api/journal/list/5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it("GET /api/journal/mood/trend → returns mood trend data", async () => {
    const res = await request(app)
      .get("/api/journal/mood/trend")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.moodData)).toBe(true);
  });

  it("Unauthenticated request → 401", async () => {
    const res = await request(app).get(`/api/journal/${DATE}`);
    expect(res.statusCode).toEqual(401);
  });
});
