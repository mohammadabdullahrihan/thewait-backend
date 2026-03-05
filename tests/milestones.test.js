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
    name: "Milestone Warrior",
    email: "milestone@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

afterEach(async () => await dbHandler.clearDatabase());

describe("Milestone Endpoints", () => {
  const milestonePayload = {
    title: "Crack SSC Exam",
    phase: "Phase 1",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    status: "active",
    category: "education",
    priority: 1,
    tasks: ["Finish Math syllabus"],
  };

  it("GET /api/milestones → returns empty array initially", async () => {
    const res = await request(app)
      .get("/api/milestones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.milestones)).toBe(true);
    expect(res.body.milestones.length).toBe(0);
  });

  it("POST /api/milestones → creates a milestone", async () => {
    const res = await request(app)
      .post("/api/milestones")
      .set("Authorization", `Bearer ${token}`)
      .send(milestonePayload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.milestone.title).toBe("Crack SSC Exam");
    expect(res.body.milestone.status).toBe("active");
  });

  it("GET /api/milestones → returns created milestone", async () => {
    await request(app)
      .post("/api/milestones")
      .set("Authorization", `Bearer ${token}`)
      .send(milestonePayload);

    const res = await request(app)
      .get("/api/milestones")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.milestones.length).toBe(1);
    expect(res.body.milestones[0].title).toBe("Crack SSC Exam");
  });

  it("PUT /api/milestones/:id → updates a milestone", async () => {
    const createRes = await request(app)
      .post("/api/milestones")
      .set("Authorization", `Bearer ${token}`)
      .send(milestonePayload);

    const id = createRes.body.milestone._id;
    const res = await request(app)
      .put(`/api/milestones/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.milestone.status).toBe("completed");
  });

  it("PUT /api/milestones/:id → 404 for non-existent milestone", async () => {
    const fakeId = "000000000000000000000001";
    const res = await request(app)
      .put(`/api/milestones/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  it("DELETE /api/milestones/:id → deletes a milestone", async () => {
    const createRes = await request(app)
      .post("/api/milestones")
      .set("Authorization", `Bearer ${token}`)
      .send(milestonePayload);

    const id = createRes.body.milestone._id;
    const res = await request(app)
      .delete(`/api/milestones/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/milestones/:id → 404 for non-existent milestone", async () => {
    const fakeId = "000000000000000000000001";
    const res = await request(app)
      .delete(`/api/milestones/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  it("Unauthenticated request → 401", async () => {
    const res = await request(app).get("/api/milestones");
    expect(res.statusCode).toEqual(401);
  });
});
