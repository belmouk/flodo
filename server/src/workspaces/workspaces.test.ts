import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";
import {
  createUser,
  createRefreshToken,
  createAccessToken,
} from "../auth/auth.services.js";

import { User } from "../users/users.schema.js";

const getAuthCookies = async (user: User) => {
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user.id),
    createRefreshToken(user.id),
  ]);

  return [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`];
};

const user1Data = {
  firstName: "arman",
  lastName: "armanito",
  email: "arman@gmail.com",
  password: "123456",
};

const user2Data = {
  firstName: "lola",
  lastName: "malola",
  email: "lola@gmail.com",
  password: "123456",
};

beforeEach(async () => {
  await prisma.$transaction([
    prisma.workspaceUser.deleteMany(),
    prisma.projectUser.deleteMany(),
    prisma.project.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

it("GET workspaces", async () => {
  await prisma.workspace.createMany({
    data: [{ name: "hello world" }, { name: "bye world" }],
  });
  const workspaces = await prisma.workspace.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  const user = await createUser(user1Data);
  const cookies = await getAuthCookies(user);

  const res = await request(app).get("/api/workspaces").set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(2);
  expect(res.body[0]).toMatchObject(workspaces[0]);
  expect(res.body[1]).toMatchObject(workspaces[1]);
});

it("POST workplaces", async () => {
  const user = await createUser(user1Data);

  const cookies = await getAuthCookies(user);

  const res = await request(app)
    .post("/api/workspaces")
    .send({ name: "hi" })
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ name: "hi" });
});

describe("PUT workplaces", () => {
  it("accepts if admin", async () => {
    const admin = await createUser(user1Data);
    const workspace = await prisma.workspace.create({ data: { name: "fizz" } });
    await prisma.workspaceUser.create({
      data: { userId: admin.id, userRole: "ADMIN", workspaceId: workspace.id },
    });

    const cookies = await getAuthCookies(admin);

    const res = await request(app)
      .put(`/api/workspaces/${workspace.id}`)
      .send({ name: "buzz" })
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "buzz" });
  });

  it("rejects if member", async () => {
    const admin = await prisma.user.create({ data: user1Data });
    const member = await prisma.user.create({ data: user2Data });
    const workspace = await prisma.workspace.create({ data: { name: "hey" } });
    await prisma.workspaceUser.createMany({
      data: [
        { userId: admin.id, workspaceId: workspace.id, userRole: "ADMIN" },
        { userId: member.id, workspaceId: workspace.id, userRole: "MEMBER" },
      ],
    });

    const cookies = await getAuthCookies(member);

    const res2 = await request(app)
      .put(`/api/workspaces/${workspace.id}`)
      .send({ name: "bye" })
      .set("Cookie", cookies);

    expect(res2.status).toBe(403);
    expect(res2.body).toMatchObject({ code: "UnAuthorizedUser" });
  });
});

describe("DELETE workplaces", () => {
  it("accepts if admin", async () => {
    const admin = await createUser(user1Data);

    const workspace = await prisma.workspace.create({ data: { name: "fuzz" } });
    await prisma.workspaceUser.create({
      data: { userId: admin.id, workspaceId: workspace.id, userRole: "ADMIN" },
    });

    const cookies = await getAuthCookies(admin);

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(204);
    expect(
      await prisma.workspace.findFirst({ where: { id: workspace.id } }),
    ).toBeNull();
    expect(
      await prisma.workspaceUser.findFirst({
        where: { workspaceId: workspace.id },
      }),
    ).toBeNull();
  });

  it("rejects if member", async () => {
    const admin = await prisma.user.create({ data: user1Data });
    const member = await prisma.user.create({ data: user2Data });
    const workspace = await prisma.workspace.create({ data: { name: "hey" } });
    await prisma.workspaceUser.createMany({
      data: [
        { userId: admin.id, workspaceId: workspace.id, userRole: "ADMIN" },
        { userId: member.id, workspaceId: workspace.id, userRole: "MEMBER" },
      ],
    });

    const cookies = await getAuthCookies(member);

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: "UnAuthorizedUser" });
  });
});
