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
  const user = await createUser(user1Data);

  await prisma.$transaction(async (tx) => {
    const createdWorkspaces = await tx.workspace.createManyAndReturn({
      data: [{ name: "hello world" }, { name: "bye world" }],
      select: { id: true },
    });
    await tx.workspaceUser.createMany({
      data: createdWorkspaces.map((w) => ({
        userId: user.id,
        workspaceId: w.id,
        userRole: "ADMIN",
      })),
    });
  });

  const expectedWorkspaces = await prisma.workspace.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
    where: { members: { some: { userId: user.id } } },
  });

  const cookies = await getAuthCookies(user);

  const res = await request(app).get("/api/workspaces").set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(expectedWorkspaces.length);
  expect(res.body[0]).toMatchObject(expectedWorkspaces[0]);
  expect(res.body[1]).toMatchObject(expectedWorkspaces[1]);
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

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name: "fizz" } });

      await tx.workspaceUser.create({
        data: {
          userId: admin.id,
          userRole: "ADMIN",
          workspaceId: ws.id,
        },
      });
      return ws;
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
    const [admin, member] = await Promise.all([
      prisma.user.create({ data: user1Data }),
      prisma.user.create({ data: user2Data }),
    ]);

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name: "hey" } });
      await tx.workspaceUser.createMany({
        data: [
          { userId: admin.id, workspaceId: ws.id, userRole: "ADMIN" },
          { userId: member.id, workspaceId: ws.id, userRole: "MEMBER" },
        ],
      });
      return ws;
    });

    const cookies = await getAuthCookies(member);

    const res2 = await request(app)
      .put(`/api/workspaces/${workspace.id}`)
      .send({ name: "bye" })
      .set("Cookie", cookies);

    expect(res2.status).toBe(403);
    expect(res2.body).toMatchObject({ code: "UnAuthorizedUser" });

    const expectedWorkspace = await prisma.workspace.findUnique({
      where: { id: workspace.id },
    });
    expect(expectedWorkspace).toMatchObject({ name: "hey" });
  });
});

describe("DELETE workplaces", () => {
  it("accepts if admin", async () => {
    const admin = await createUser(user1Data);

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name: "fuzz" } });
      await tx.workspaceUser.create({
        data: { userId: admin.id, workspaceId: ws.id, userRole: "ADMIN" },
      });
      return ws;
    });

    const cookies = await getAuthCookies(admin);

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(204);
    const [deletedWorkspace, deletedWorkspaceUser] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspace.id } }),
      prisma.workspaceUser.findUnique({
        where: {
          userId_workspaceId: { workspaceId: workspace.id, userId: admin.id },
        },
      }),
    ]);
    expect(deletedWorkspace).toBeNull();
    expect(deletedWorkspaceUser).toBeNull();
  });

  it("rejects if member", async () => {
    const [admin, member] = await Promise.all([
      prisma.user.create({ data: user1Data }),
      prisma.user.create({ data: user2Data }),
    ]);

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name: "hey" } });
      await tx.workspaceUser.createMany({
        data: [
          { userId: admin.id, workspaceId: ws.id, userRole: "ADMIN" },
          { userId: member.id, workspaceId: ws.id, userRole: "MEMBER" },
        ],
      });
      return ws;
    });

    const cookies = await getAuthCookies(member);

    const res = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: "UnAuthorizedUser" });

    const expectedWorkspace = await prisma.workspace.findUnique({
      where: { id: workspace.id },
    });
    expect(expectedWorkspace).toMatchObject({ name: "hey" });
  });
});
