import { prisma } from "../lib/prisma.js";
import { Project, ProjectUser } from "../prisma/client.js";

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const index = async (workspaceId: number) => {
  return await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
};

export const show = async (id: number): Promise<Result<Project>> => {
  const result = await prisma.project.findFirst({ where: { id } });
  if (result) {
    return { success: true, data: result };
  } else {
    return { success: false, error: "ProjectDoesNotExist" };
  }
};

interface CreateInput {
  workspaceId: number;
  name: string;
  userId: number;
}

export const create = async ({ workspaceId, name, userId }: CreateInput) => {
  const project = await prisma.project.create({ data: { name, workspaceId } });

  type Role = "OWNER" | "MEMBER";
  type Data = { userId: number; userRole: Role; projectId: number };

  const workspaceUsers = await prisma.workspaceUser.findMany({
    where: { workspaceId },
    select: { userId: true, userRole: true },
  });
  const projectUsers: Data[] = workspaceUsers.map((user) => {
    if (user.userRole === "ADMIN" || user.userId === userId) {
      return { userId: user.userId, userRole: "OWNER", projectId: project.id };
    } else {
      return { userId: user.userId, userRole: "MEMBER", projectId: project.id };
    }
  });

  await prisma.projectUser.createMany({
    data: projectUsers,
  });
  return project;
};

export const checkWorkspaceHasProject = async (
  workspaceId: number,
  projectId: number,
): Promise<Result<Project>> => {
  const result = await prisma.project.findUnique({
    where: { workspaceId, id: projectId },
  });
  if (result) {
    return { success: true, data: result };
  } else {
    return { success: false, error: "ProjectDoesNotExist" };
  }
};

export const update = async (projectId: number, name: string) => {
  return await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });
};

export const hasEditRights = async (projectId: number, userId: number) => {
  const user = await prisma.projectUser.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (user) {
    if (user.userRole === "OWNER") {
      return true;
    }
    return false;
  }
  return false;
};

export const destroy = async (projectId: number) => {
  return await prisma.$transaction([
    prisma.projectUser.deleteMany({ where: { projectId } }),
    prisma.project.deleteMany({ where: { id: projectId } }),
  ]);
};
