import request from "supertest";
import app from "../app.js";
import { prisma } from "@repo/db";
import {
  createUser,
  createRefreshToken,
  createAccessToken,
} from "../auth/auth.services.js";
import { User } from "../users/users.schema.js";
import { it, expect, beforeEach } from "vitest";

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
  const project = await prisma.$transaction(async (tx) => {
    const pj = await tx.project.create({
      data: { name: "aristo", workspaceId: workspace.id },
    });
    await tx.projectUser.create({
      data: { projectId: pj.id, userId: admin.id, userRole: "OWNER" },
    });
    return pj;
  });
  const list = await prisma.list.create({
    data: { name: "todo", projectId: project.id },
  });
  return { admin, member, random, workspace, project, list };
};

it("GET api/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks", async () => {
  const { admin, member, project, workspace, list } = await seedDB();
  const tasks = await prisma.task.createManyAndReturn({
    data: [
      {
        listId: list.id,
        title: "task1",
        dueAt: new Date(Date.now()),
        assignerId: admin.id,
        assigneeId: member.id,
      },
      {
        listId: list.id,
        title: "task2",
        dueAt: new Date(Date.now()),
        assignerId: member.id,
        assigneeId: admin.id,
      },
    ],
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .get(
      `/api/workspaces/${workspace.id}/projects/${project.id}/lists/${list.id}/tasks`
    )
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(tasks);
});

it("GET api/tasks/:taskId", async () => {
  const { admin, member, list } = await seedDB();
  const task = await prisma.task.create({
    data: {
      listId: list.id,
      title: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .get(`/api/tasks/${task.id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(task);
});

it("POST api/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks", async () => {
  const { admin, member, project, list, workspace } = await seedDB();
  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .post(
      `/api/workspaces/${workspace.id}/projects/${project.id}/lists/${list.id}/tasks`
    )
    .send({
      title: "task1",
      dueAt: new Date(Date.now()),
      assigneeId: member.id,
    })
    .set("Cookie", cookies);
  const expectedTask = await prisma.task.findFirst({
    where: { assigneeId: member.id },
    omit: { createdAt: true, dueAt: true },
  });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(expectedTask!);
});

it("PATCH api/tasks/:taskId", async () => {
  const { admin, member, list } = await seedDB();
  const task = await prisma.task.create({
    data: {
      listId: list.id,
      title: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .patch(`/api/tasks/${task.id}`)
    .send({ title: "task10" })
    .set("Cookie", cookies);
  const expectedTask = await prisma.task.findUnique({
    where: { id: task.id },
    omit: { dueAt: true, createdAt: true },
  });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(expectedTask!);
});

it("DELETE api/tasks/:taskId", async () => {
  const { admin, member, list } = await seedDB();
  const task = await prisma.task.create({
    data: {
      listId: list.id,
      title: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    select: { id: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .delete(`/api/tasks/${task.id}`)
    .set("Cookie", cookies);
  const expectedTask = await prisma.task.findUnique({
    where: { id: task.id },
  });

  expect(res.status).toBe(204);
  expect(expectedTask).toBeNull();
});
