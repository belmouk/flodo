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

beforeEach(async () => {
  await prisma.$transaction([
    prisma.workspaceUser.deleteMany(),
    prisma.projectUser.deleteMany(),
    prisma.task.deleteMany(),
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
  const project = await prisma.project.create({
    data: { name: "aristo", workspaceId: workspace.id },
  });
  return { admin, member, random, workspace, project };
};

it("GET api/workspaces/:workspaceId/projects/:projectId/tasks", async () => {
  const { admin, member, project, workspace } = await seedDB();
  const tasks = await prisma.task.createManyAndReturn({
    data: [
      {
        projectId: project.id,
        content: "task1",
        dueAt: new Date(Date.now()),
        assignerId: admin.id,
        assigneeId: member.id,
      },
      {
        projectId: project.id,
        content: "task2",
        dueAt: new Date(Date.now()),
        assignerId: member.id,
        assigneeId: admin.id,
      },
    ],
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .get(`/api/workspaces/${workspace.id}/projects/${project.id}/tasks`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(tasks);
});

it("GET api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId", async () => {
  const { admin, member, project, workspace } = await seedDB();
  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      content: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .get(
      `/api/workspaces/${workspace.id}/projects/${project.id}/tasks/${task.id}`,
    )
    .set("Cookie", cookies);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(task);
});

it("POST api/workspaces/:workspaceId/projects/:projectId/tasks", async () => {
  const { admin, member, project, workspace } = await seedDB();
  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .post(`/api/workspaces/${workspace.id}/projects/${project.id}/tasks`)
    .send({
      content: "task1",
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

it("PUT api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId", async () => {
  const { admin, member, project, workspace } = await seedDB();
  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      content: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    omit: { createdAt: true, dueAt: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .put(
      `/api/workspaces/${workspace.id}/projects/${project.id}/tasks/${task.id}`,
    )
    .send({ content: "task10" })
    .set("Cookie", cookies);
  const expectedTask = await prisma.task.findUnique({
    where: { id: task.id },
    omit: { dueAt: true, createdAt: true },
  });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject(expectedTask!);
});

it("DELETE api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId", async () => {
  const { admin, member, project, workspace } = await seedDB();
  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      content: "task1",
      dueAt: new Date(Date.now()),
      assignerId: admin.id,
      assigneeId: member.id,
    },
    select: { id: true },
  });

  const cookies = await getAuthCookies(admin);
  const res = await request(app)
    .delete(
      `/api/workspaces/${workspace.id}/projects/${project.id}/tasks/${task.id}`,
    )
    .set("Cookie", cookies);
  const expectedTask = await prisma.task.findUnique({
    where: { id: task.id },
  });

  expect(res.status).toBe(204);
  expect(expectedTask).toBeNull();
});
