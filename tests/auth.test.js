const request = require("supertest");
const app = require("../server");
const dbHandler = require("./db-handler");
const User = require("../models/User");

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

jest.setTimeout(30000);

describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Warrior",
      email: "test@warrior.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("test@warrior.com");
  });

  it("should login an existing user", async () => {
    // Register first
    await request(app).post("/api/auth/register").send({
      name: "Test Warrior",
      email: "test@warrior.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "test@warrior.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
  });

  it("should fail login with wrong password", async () => {
    await User.create({
      name: "Test Warrior",
      email: "test@warrior.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "test@warrior.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
