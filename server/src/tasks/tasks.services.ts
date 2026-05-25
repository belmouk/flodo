import { prisma } from "../lib/prisma.js";
import { Task, TaskStatus } from "../prisma/client.js";

export const index = async (projectId: number) => {
  return await prisma.task.findMany({ where: { projectId } });
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const show = async (
  projectId: number,
  taskId: number,
): Promise<Result<Task>> => {
  const result = await prisma.task.findUnique({
    where: { projectId, id: taskId },
  });
  if (!result) {
    return { success: false, error: "TaskDoesNotExist" };
  }
  return { success: true, data: result };
};

export const create = async ({
  projectId,
  content,
  dueAt,
  assignerId,
  assigneeId,
}: {
  projectId: number;
  content: string;
  dueAt: Date;
  assignerId: number;
  assigneeId: number;
}) => {
  return await prisma.task.create({
    data: { projectId, content, dueAt, assigneeId, assignerId },
  });
};

export const update = async ({
  id,
  content,
  dueAt,
  status,
  assigneeId,
}: {
  id: number;
  content: string;
  dueAt: Date;
  status: TaskStatus;
  assigneeId: number;
}) => {
  return await prisma.task.update({
    where: { id },
    data: {
      content,
      status,
      dueAt,
      assigneeId,
      completedAt: status === "DONE" ? new Date(Date.now()) : null,
    },
  });
};

export const hasEditRights = async (userId: number, taskId: number) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId, assignerId: userId },
  });
  if (!task) return false;
  return true;
};

export const hasDeleteRights = async (userId: number, taskId: number) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId, assignerId: userId },
  });
  if (!task) return false;
  return true;
};

export const destroy = async (taskId: number) => {
  await prisma.task.delete({ where: { id: taskId } });
};
