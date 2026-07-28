import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";
import {
  createUser,
  createRefreshToken,
  createAccessToken,
} from "../auth/auth.services.js";
import { User } from "../users/users.schema.js";
import { Project } from "../../generated/prisma/client.js";
import { describe, it, expect, beforeEach } from "vitest";

const getAuthCookies = async (user: User) => {
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user.id),
    createRefreshToken(user.id),
  ]);

  return [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`];
};

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

const seedDB = async () => {
  const adminUserPromise = createUser({
    firstName: "Mr",
    lastName: "Admin",
    password: "123456",
    email: "a@b.com",
  });
  const memberUserPromise = createUser({
    firstName: "Mr",
    lastName: "Member",
    password: "123456",
    email: "b@c.com",
  });
  const randomUserPromise = createUser({
    firstName: "Mr",
    lastName: "Random",
    password: "123456",
    email: "c@d.com",
  });
  const workspacePromise = prisma.workspace.create({
    data: { name: "my workspace" },
  });
  const [admin, member, random, workspace] = await Promise.all([
    adminUserPromise,
    memberUserPromise,
    randomUserPromise,
    workspacePromise,
  ]);
  await prisma.workspaceUser.createMany({
    data: [
      { workspaceId: workspace.id, userId: admin.id, userRole: "ADMIN" },
      { workspaceId: workspace.id, userId: member.id, userRole: "MEMBER" },
    ],
  });
  return { admin, member, random, workspace };
};

describe("projects bad routes", () => {
  it("rejects letters in workspaceId", async () => {
    const { member } = await seedDB();
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .get("/api/workspaces/lol/projects")
      .set("Cookie", cookies);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: "InvalidRouteParams" });
  });

  it("rejects empty workspaceId", async () => {
    const { member } = await seedDB();
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .get("/api/workspaces//projects")
      .set("Cookie", cookies);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: "ResourceNotFound" });
  });
});

it("rejects letters in projectId", async () => {
  const { member } = await seedDB();
  const cookies = await getAuthCookies(member);
  const res = await request(app)
    .get(`/api/projects/lol`)
    .set("Cookie", cookies);

  expect(res.status).toBe(400);
  expect(res.body).toMatchObject({ code: "InvalidRouteParams" });
});

it("serves only project members and admins", async () => {
  const { random, workspace } = await seedDB();

  const cookies = await getAuthCookies(random);
  const res = await request(app)
    .get(`/api/workspaces/${workspace.id}/projects`)
    .set("Cookie", cookies);

  expect(res.status).toBe(403);
  expect(res.body).toMatchObject({ code: "UnAuthorizedAccess" });
});

it("GET api/workspaces/:workspaceId/projects", async () => {
  const { member, workspace } = await seedDB();
  await prisma.project.createManyAndReturn({
    data: [
      { name: "first project", workspaceId: workspace.id },
      { name: "second project", workspaceId: workspace.id },
    ],
  });
  const cookies = await getAuthCookies(member);
  const res = await request(app)
    .get(`/api/workspaces/${workspace.id}/projects`)
    .set("Cookie", cookies);

  const body = res.body as Project[];
  expect(res.status).toBe(200);
  expect(body).toHaveLength(2);
  expect(body[0]).toMatchObject({
    name: "first project",
    workspaceId: workspace.id,
  });
  expect(body[1]).toMatchObject({
    name: "second project",
    workspaceId: workspace.id,
  });
});

it("GET api/projects/:id", async () => {
  const { member, workspace } = await seedDB();
  const project = await prisma.project.create({
    data: {
      name: "my project",
      workspaceId: workspace.id,
      members: { create: { userId: member.id, userRole: "MEMBER" } },
    },
    select: { id: true, name: true },
  });
  const cookies = await getAuthCookies(member);
  const res = await request(app)
    .get(`/api/projects/${project.id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(project);
});

it("POST api/workspaces/:workspaceId/projects", async () => {
  const { member, workspace } = await seedDB();

  const cookies = await getAuthCookies(member);
  const res = await request(app)
    .post(`/api/workspaces/${workspace.id}/projects`)
    .send({ name: "my project" })
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  const body = res.body as Project;

  const project = await prisma.project.findFirst({ where: { id: body.id } });
  expect(project).not.toBeNull();
});

describe("PUT api/projects/:id", () => {
  it("accepts updates from project owners", async () => {
    const { member, workspace } = await seedDB();
    const project = await prisma.project.create({
      data: { name: "my project", workspaceId: workspace.id },
      select: { id: true },
    });
    await prisma.projectUser.create({
      data: { userId: member.id, projectId: project.id, userRole: "OWNER" },
    });
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .put(`/api/projects/${project.id}`)
      .send({ name: "his project" })
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: project.id, name: "his project" });
  });
  it("rejects updates from non project owners", async () => {
    const { member, workspace } = await seedDB();
    const project = await prisma.project.create({
      data: { name: "my project", workspaceId: workspace.id },
      select: { id: true },
    });
    await prisma.projectUser.create({
      data: { userId: member.id, projectId: project.id, userRole: "MEMBER" },
    });
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .put(`/api/projects/${project.id}`)
      .send({ name: "his project" })
      .set("Cookie", cookies);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: "UnAuthorizedAction" });
  });
});

describe("DELETE api/projects/:id", () => {
  it("accepts deletes from project owners", async () => {
    const { member, workspace } = await seedDB();
    const project = await prisma.project.create({
      data: { name: "my project", workspaceId: workspace.id },
      select: { id: true },
    });
    await prisma.projectUser.create({
      data: { userId: member.id, projectId: project.id, userRole: "OWNER" },
    });
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .delete(`/api/projects/${project.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(204);
  });
  it("rejects deletes from non project owners", async () => {
    const { member, workspace } = await seedDB();
    const project = await prisma.project.create({
      data: { name: "my project", workspaceId: workspace.id },
      select: { id: true },
    });
    await prisma.projectUser.create({
      data: { userId: member.id, projectId: project.id, userRole: "MEMBER" },
    });
    const cookies = await getAuthCookies(member);
    const res = await request(app)
      .delete(`/api/projects/${project.id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: "UnAuthorizedAction" });
  });
});
