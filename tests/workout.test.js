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
    name: "Workout Warrior",
    email: "workout@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
});

afterEach(async () => await dbHandler.clearDatabase());

describe("Workout Endpoints", () => {
  const DATE = "2026-03-06";
  const workoutPayload = {
    date: DATE,
    type: "Strength",
    exercises: [{ name: "Push-ups", sets: 3, reps: 20, weight: 0 }],
    totalDuration: 45,
    caloriesBurned: 250,
    notes: "Solid workout",
  };

  it("GET /api/workout/:date → returns empty array for new date", async () => {
    const res = await request(app)
      .get(`/api/workout/${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.workouts)).toBe(true);
    expect(res.body.workouts.length).toBe(0);
  });

  it("POST /api/workout → creates a new workout log", async () => {
    const res = await request(app)
      .post("/api/workout")
      .set("Authorization", `Bearer ${token}`)
      .send(workoutPayload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.workout.type).toBe("Strength");
    expect(res.body.workout.caloriesBurned).toBe(250);
  });

  it("GET /api/workout/:date → returns workout after save", async () => {
    await request(app)
      .post("/api/workout")
      .set("Authorization", `Bearer ${token}`)
      .send(workoutPayload);

    const res = await request(app)
      .get(`/api/workout/${DATE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.workouts.length).toBe(1);
    expect(res.body.workouts[0].type).toBe("Strength");
  });

  it("GET /api/workout/history/:days → returns history array", async () => {
    const res = await request(app)
      .get("/api/workout/history/30")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.workouts)).toBe(true);
  });

  it("DELETE /api/workout/:id → deletes a workout", async () => {
    const createRes = await request(app)
      .post("/api/workout")
      .set("Authorization", `Bearer ${token}`)
      .send(workoutPayload);

    const workoutId = createRes.body.workout._id;
    const res = await request(app)
      .delete(`/api/workout/${workoutId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/workout/:id → 404 for non-existent workout", async () => {
    const fakeId = "000000000000000000000001";
    const res = await request(app)
      .delete(`/api/workout/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  it("Unauthenticated request → 401", async () => {
    const res = await request(app).get(`/api/workout/${DATE}`);
    expect(res.statusCode).toEqual(401);
  });
});
