import { prisma } from "../lib/prisma.js";

export const getAll = async (projectId: number) => {
  return await prisma.list.findMany({ where: { projectId } });
};

export const getById = async (listId: number) => {
  return await prisma.list.findUnique({ where: { id: listId } });
};

export const update = async (id: number, name: string, position?: number) => {
  if (position) {
    return await prisma.list.update({
      where: { id },
      data: { name, position },
    });
  }
  return await prisma.list.update({ where: { id }, data: { name } });
};

export const userIsProjectMember = async (
  userId: number,
  projectId: number
) => {
  const user = await prisma.projectUser.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return !!user;
};

export const create = async (projectId: number, name: string) => {
  return await prisma.list.create({ data: { projectId, name } });
};

export const destroy = async (listId: number) => {
  await prisma.list.deleteMany({ where: { id: listId } });
};

export const userHasAccess = async (listId: number, userId: number) => {
  const count = await prisma.projectUser.count({
    where: { userId, project: { lists: { some: { id: listId } } } },
  });
  return count > 0;
};
