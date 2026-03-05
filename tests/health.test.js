const request = require("supertest");
const app = require("../server");

describe("Health Check", () => {
  it("GET /api/health → 200 with success flag", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("timestamp");
  });

  it("Unknown route → 404", async () => {
    const res = await request(app).get("/api/unknown-route-xyz");
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
