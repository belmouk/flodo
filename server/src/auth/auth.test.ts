import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";

beforeEach(async () => await prisma.user.deleteMany());

describe("POST auth/signup", () => {
  const [username, email, password] = ["arman", "arman@gmail.com", "123456"];

  it("adds a new user", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username, email, password });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ username, email });
    expect(res.body).not.toHaveProperty("password");
  });

  it("rejects an existing user", async () => {
    await prisma.user.create({ data: { username, email, password } });

    const res = await request(app)
      .post("/auth/signup")
      .send({ username, email, password })
      .type("json");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserExistsError" });
  });

  it("rejects a bad request", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "", email: "", password: "" })
      .type("json");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "InvalidDataError" });
  });

  it("rejects an existing username", async () => {
    await prisma.user.create({ data: { username, password, email } });

    const res = await request(app)
      .post("/auth/signup")
      .send({ username, email: "random@b.com", password });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserExistsError" });
  });

  it("rejects an existing email", async () => {
    await prisma.user.create({ data: { username, password, email } });

    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "lola", email, password });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserExistsError" });
  });
});
