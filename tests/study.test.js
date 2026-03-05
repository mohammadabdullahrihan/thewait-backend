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
    name: "Study Warrior",
    email: "study@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

afterEach(async () => await dbHandler.clearDatabase());

describe("Study Endpoints", () => {
  const SUBJECT = "Science";

  it("GET /api/study → returns empty array initially", async () => {
    const res = await request(app)
      .get("/api/study")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.progress)).toBe(true);
    expect(res.body.progress.length).toBe(0);
  });

  it("GET /api/study/:subject → returns default shape for new subject", async () => {
    const res = await request(app)
      .get(`/api/study/${SUBJECT}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.progress.subject).toBe(SUBJECT);
    expect(res.body.progress.totalHours).toBe(0);
    expect(Array.isArray(res.body.progress.topics)).toBe(true);
  });

  it("POST /api/study/:subject/session → logs a study session", async () => {
    const res = await request(app)
      .post(`/api/study/${SUBJECT}/session`)
      .set("Authorization", `Bearer ${token}`)
      .send({ duration: 90, topic: "Mechanics", date: "2026-03-06" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.progress.totalHours).toBeCloseTo(1.5, 1);
    expect(res.body.progress.sessionsLog).toHaveLength(1);
    expect(res.body.progress.sessionsLog[0].topic).toBe("Mechanics");
  });

  it("POST /api/study/:subject/score → logs a test score", async () => {
    const res = await request(app)
      .post(`/api/study/${SUBJECT}/score`)
      .set("Authorization", `Bearer ${token}`)
      .send({ testName: "Chapter 1 Test", score: 85, maxScore: 100 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.progress.testScores).toHaveLength(1);
    expect(res.body.progress.testScores[0].score).toBe(85);
  });

  it("POST /api/study/:subject/topic → adds a topic", async () => {
    const res = await request(app)
      .post(`/api/study/${SUBJECT}/topic`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Newton's Laws" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.progress.topics).toHaveLength(1);
    expect(res.body.progress.topics[0].name).toBe("Newton's Laws");
    expect(res.body.progress.topics[0].completed).toBe(false);
  });

  it("PUT /api/study/:subject/topic/:topicId → marks topic as completed", async () => {
    const addRes = await request(app)
      .post(`/api/study/${SUBJECT}/topic`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Thermodynamics" });

    const topicId = addRes.body.progress.topics[0]._id;

    const res = await request(app)
      .put(`/api/study/${SUBJECT}/topic/${topicId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ completed: true });

    expect(res.statusCode).toEqual(200);
    expect(res.body.progress.topics[0].completed).toBe(true);
  });

  it("PUT /api/study/:subject/topic/:topicId → 404 for missing progress", async () => {
    const fakeId = "000000000000000000000001";
    const res = await request(app)
      .put(`/api/study/UnknownSubject/topic/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ completed: true });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  it("Unauthenticated request → 401", async () => {
    const res = await request(app).get("/api/study");
    expect(res.statusCode).toEqual(401);
  });
});
