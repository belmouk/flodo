import { prisma } from "../lib/prisma.js";

export const getWorkSpaces = async (userId: number) => {
  return await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
  });
};

export const getWorkspace = async (id: number, userId: number) => {
  return await prisma.workspace.findUnique({
    where: { id, members: { some: { userId } } },
  });
};

export const create = async ({
  name,
  userId,
}: {
  name: string;
  userId: number;
}) => {
  const workspace = await prisma.workspace.create({ data: { name } });
  // add a check for if the user is Team member or admin when implementing teams later on
  await prisma.workspaceUser.create({
    data: { userId, workspaceId: workspace.id, userRole: "ADMIN" },
  });
  return workspace;
};

export const update = async ({
  name,
  id,
  userId,
}: {
  name: string;
  id: number;
  userId: number;
}) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
  });
  if (!workspace) return;
  return await prisma.workspace.update({ where: { id }, data: { name } });
};

export const hasUpdateRights = async (userId: number, workspaceId: number) => {
  const user = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { workspaceId, userId } },
  });
  if (!user) return false;
  if (user.userRole === "MEMBER") return false;
  return true;
};

export const hasDeleteRights = async (userId: number, workspaceId: number) => {
  const user = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { workspaceId, userId } },
  });
  if (!user) return false;
  if (user.userRole === "MEMBER") return false;
  return true;
};

export const destroy = async (workspaceId: number) => {
  await prisma.$transaction([
    prisma.workspaceUser.deleteMany({ where: { workspaceId } }),
    prisma.workspace.deleteMany({ where: { id: workspaceId } }),
  ]);
};

export const isWorkspaceMember = async (
  userId: number,
  workspaceId: number,
) => {
  const record = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return record ? true : false;
};
