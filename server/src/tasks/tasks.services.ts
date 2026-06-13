import { prisma } from "../lib/prisma.js";
import { Task, TaskStatus } from "../prisma/client.js";

export const getAll = async (listId: number) => {
  return await prisma.task.findMany({ where: { listId } });
};

export const getById = async (listId: number, taskId: number) => {
  return await prisma.task.findUnique({
    where: { listId, id: taskId },
  });
};

export const create = async ({
  listId,
  description,
  title,
  dueAt,
  assignerId,
  assigneeId,
}: {
  listId: number;
  description: string | null;
  title: string;
  dueAt: Date;
  assignerId: number;
  assigneeId: number;
}) => {
  return await prisma.task.create({
    data: { listId, description, title, dueAt, assigneeId, assignerId },
  });
};

export const update = async ({
  id,
  title,
  description,
  dueAt,
  status,
  assigneeId,
  listId,
}: {
  id: number;
  title: string;
  description: string | null;
  dueAt: Date;
  status: TaskStatus;
  assigneeId: number;
  listId: number;
}) => {
  return await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      status,
      dueAt,
      assigneeId,
      completedAt: status === "DONE" ? new Date(Date.now()) : null,
      listId,
    },
  });
};

export const getByAssignerId = async (userId: number, taskId: number) => {
  return await prisma.task.findUnique({
    where: { id: taskId, assignerId: userId },
  });
};

export const hasEditRights = async (userId: number, taskId: number) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, assignerId: true },
  });
  return task?.assigneeId === userId || task?.assignerId === userId;
};

export const destroy = async (taskId: number) => {
  await prisma.task.delete({ where: { id: taskId } });
};
