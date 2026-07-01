import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";
import { createUser } from "./auth.services.js";
import { CookieAccessInfo } from "cookiejar";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.workspaceUser.deleteMany(),
    prisma.projectUser.deleteMany(),
    prisma.task.deleteMany(),
    prisma.list.deleteMany(),
    prisma.project.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

describe("POST auth/signup", () => {
  const [firstName, lastName, email, password] = [
    "arman",
    "armanito",
    "arman@gmail.com",
    "123456",
  ];

  const capitalize = (name: string) => {
    if (name[0]) return name[0].toUpperCase() + name.slice(1).toLowerCase();
  };

  it("adds a new user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ firstName, lastName, email, password });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      firstName: capitalize(firstName),
      lastName: capitalize(lastName),
      email,
    });
    expect(res.body).not.toHaveProperty("password");
  });

  it("rejects a bad request", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ firstName: "", lastName: "", email: "", password: "" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "InvalidDataError" });
  });

  it("rejects an existing user", async () => {
    await prisma.user.create({
      data: { firstName, lastName, email, password },
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ firstName, lastName, email, password });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserAlreadyExists" });
  });
});

describe("POST auth/login", () => {
  const [firstName, lastName, email, password] = [
    "arman",
    "armanito",
    "arman@gmail.com",
    "123456",
  ];

  it("logs existing user", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ firstName, lastName, password, email });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(204);
  });

  it("rejects non existing user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "random@b.com", password: "randompass" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserDoesNotExist" });
  });

  it("rejects wrong password", async () => {
    await prisma.user.create({
      data: { firstName, lastName, email, password },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "randompass" });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: "WrongPassword" });
  });
});

describe("POST auth/refresh", () => {
  const [firstName, lastName, email, password] = [
    "arman",
    "armanito",
    "arman@gmail.com",
    "123456",
  ];

  it("refreshes access and refresh tokens", async () => {
    const agent = request.agent(app);

    await agent
      .post("/api/auth/signup")
      .send({ firstName, lastName, email, password });

    await agent.post("/api/auth/login").send({ email, password });
    const firstAccessToken = agent.jar.getCookie(
      "accessToken",
      CookieAccessInfo.All
    );
    const firstRefreshToken = agent.jar.getCookie(
      "refreshToken",
      CookieAccessInfo.All
    );

    await agent.post("/api/auth/refresh");
    const secondAccessToken = agent.jar.getCookie(
      "accessToken",
      CookieAccessInfo.All
    );
    const secondRefreshToken = agent.jar.getCookie(
      "refreshToken",
      CookieAccessInfo.All
    );

    expect(secondAccessToken).not.toBe(firstAccessToken);
    expect(secondRefreshToken).not.toBe(firstRefreshToken);
  });
});

describe("protected routes", () => {
  it("rejects unauthenticated users", async () => {
    const agent = request.agent(app);
    const res = await agent.get("/api/workspaces");
    expect(res.body).toMatchObject({ code: "MissingAccessToken" });
  });
  it("accepts authenticated users", async () => {
    const [firstName, lastName, email, password] = [
      "arman",
      "armanito",
      "arman@gmail.com",
      "123456",
    ];
    const agent = request.agent(app);
    const res1 = await agent
      .post("/api/auth/signup")
      .send({ firstName, lastName, email, password });

    await agent.post("/api/auth/login").send({ email, password });
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name: "hello" },
        select: { name: true, id: true },
      });
      await tx.workspaceUser.create({
        data: { userId: res1.body.id, workspaceId: ws.id, userRole: "ADMIN" },
      });
      return ws;
    });

    const res = await agent.get("/api/workspaces");
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject(workspace);
  });
});

it("POST auth/logout", async () => {
  const userData = {
    firstName: "arman",
    lastName: "armanito",
    email: "arman@gmail.com",
    password: "123456",
  };

  await createUser(userData);

  const agent = request.agent(app);

  await agent
    .post("/api/auth/login")
    .send({ email: userData.email, password: userData.password });

  await agent.post("/api/auth/logout");

  expect(
    agent.jar.getCookie("refreshToken", CookieAccessInfo.All)
  ).toBeUndefined();
  expect(
    agent.jar.getCookie("accessToken", CookieAccessInfo.All)
  ).toBeUndefined();
});
