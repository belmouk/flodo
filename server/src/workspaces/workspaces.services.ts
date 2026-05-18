import { prisma } from "../lib/prisma.js";

export const getWorkSpaces = async () => {
  return await prisma.workspace.findMany();
};

export const getWorkspace = async (id: number) => {
  return await prisma.workspace.findFirst({ where: { id } });
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

export const update = async ({ name, id }: { name: string; id: number }) => {
  const workspace = await prisma.workspace.findFirst({ where: { id } });
  if (!workspace) return;
  return await prisma.workspace.update({ where: { id }, data: { name } });
};

export const hasUpdateRights = async (userId: number, workspaceId: number) => {
  const user = await prisma.workspaceUser.findFirst({
    where: { workspaceId, userId },
  });
  if (!user) return false;
  if (user.userRole === "MEMBER") return false;
  return true;
};

export const hasDeleteRights = async (userId: number, workspaceId: number) => {
  const user = await prisma.workspaceUser.findFirst({
    where: { workspaceId, userId },
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
  const record = await prisma.workspaceUser.findFirst({
    where: { userId, workspaceId },
  });
  return record ? true : false;
};
