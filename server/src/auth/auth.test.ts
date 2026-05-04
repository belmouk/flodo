import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

describe("POST auth/signup", () => {
  const [firstName, lastName, email, password] = [
    "arman",
    "armanito",
    "arman@gmail.com",
    "123456",
  ];

  const capitalize = (name: string) => {
    return name[0].toUpperCase() + name.slice(1).toLowerCase();
  };

  it("adds a new user", async () => {
    const res = await request(app)
      .post("/auth/signup")
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
      .post("/auth/signup")
      .send({ firstName: "", lastName: "", email: "", password: "" })
      .type("json");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "InvalidDataError" });
  });

  it("rejects an existing user", async () => {
    await prisma.user.create({
      data: { firstName, lastName, email, password },
    });

    const res = await request(app)
      .post("/auth/signup")
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
      .post("/auth/signup")
      .send({ firstName, lastName, password, email });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password });

    expect(res.status).toBe(204);
  });

  it("rejects non existing user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "random@b.com", password: "randompass" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "UserDoesNotExist" });
  });

  it("rejects wrong password", async () => {
    await prisma.user.create({
      data: { firstName, lastName, email, password },
    });

    const res = await request(app)
      .post("/auth/login")
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

  const getJSONCookie = (name: string, cookie: Array<string>) => {
    const raw = cookie.find((c) => c.startsWith(`${name}=`));
    if (!raw) return null;
    let value = raw.split(";")[0].split("=")[1];
    if (value) {
      value = decodeURIComponent(value).substring(2);
    }
    return JSON.parse(value);
  };

  it("refreshes access and refresh tokens", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/signup")
      .send({ firstName, lastName, email, password });

    const res1 = await agent.post("/auth/login").send({ email, password });
    const firstCookies = res1.headers["set-cookie"];

    const res2 = await agent.post("/auth/refresh").withCredentials();
    const secondCookies = res2.headers["set-cookie"];

    const firstAccessToken = getJSONCookie(
      "accessToken",
      Array.isArray(firstCookies) ? firstCookies : [],
    );
    const firstRefreshToken = getJSONCookie(
      "refreshToken",
      Array.isArray(firstCookies) ? firstCookies : [],
    );

    const secondAccessToken = getJSONCookie(
      "accessToken",
      Array.isArray(secondCookies) ? secondCookies : [],
    );
    const secondRefreshToken = getJSONCookie(
      "refreshToken",
      Array.isArray(secondCookies) ? secondCookies : [],
    );

    expect(secondAccessToken.token).not.toBe(firstAccessToken.token);
    expect(secondRefreshToken.token).not.toBe(firstRefreshToken.token);
  });
});
