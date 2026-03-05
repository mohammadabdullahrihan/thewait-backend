const request = require("supertest");
const app = require("../server");
const dbHandler = require("./db-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

jest.setTimeout(30000);

let token;
let user;

beforeAll(async () => {
  await dbHandler.connect();
  user = await User.create({
    name: "Test Warrior",
    email: "routine@test.com",
    password: "password123",
  });
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
});

afterAll(async () => await dbHandler.closeDatabase());

describe("Routine Endpoints", () => {
  it("should get default routine template when no routine exists", async () => {
    const res = await request(app)
      .get("/api/routines/2026-03-06")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.routine.tasks.length).toBeGreaterThan(0);
    expect(res.body.routine.tasks[0].time).toBe("6:00 AM");
  });

  it("should save/update a routine", async () => {
    const tasks = [
      {
        time: "10:00 AM",
        task: "Test Task",
        category: "Study",
        completed: false,
      },
    ];

    const res = await request(app)
      .post("/api/routines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-03-06",
        tasks: tasks,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.routine.tasks[0].task).toBe("Test Task");
  });

  it("should toggle a task status", async () => {
    // First save a routine
    const saveRes = await request(app)
      .post("/api/routines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-03-06",
        tasks: [
          {
            time: "10:00 AM",
            task: "Toggle Task",
            category: "Study",
            completed: false,
          },
        ],
      });

    const taskId = saveRes.body.routine.tasks[0]._id;

    const res = await request(app)
      .put(`/api/routines/2026-03-06/task/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        completed: true,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.routine.tasks[0].completed).toBe(true);
  });

  it("should delete a task", async () => {
    const saveRes = await request(app)
      .post("/api/routines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        date: "2026-03-06",
        tasks: [
          {
            time: "Deletable",
            task: "Delete Me",
            category: "Other",
            completed: false,
          },
        ],
      });

    const taskId = saveRes.body.routine.tasks[0]._id;

    const res = await request(app)
      .delete(`/api/routines/2026-03-06/task/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.routine.tasks.length).toBe(0);
  });
});
