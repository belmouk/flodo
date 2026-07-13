import ApiError from "../lib/ApiError.js";
import { prisma } from "../lib/prisma.js";
import { TaskStatus } from "../prisma/client.js";
import type { Location } from "./tasks.controller.js";

export const getAll = async (listId: number) => {
  return await prisma.task.findMany({
    where: { listId },
    orderBy: { position: "asc" },
  });
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
  const task = await prisma.task.aggregate({
    _max: { position: true },
    where: { listId },
  });
  let newPosition = 1000;
  if (task._max.position) {
    newPosition =
      task._max.position % 1000 === 0
        ? task._max.position + 1000
        : 1000 * (Math.floor(task._max.position / 1000) + 1);
  }
  return await prisma.task.create({
    data: {
      listId,
      description,
      title,
      dueAt,
      assigneeId,
      assignerId,
      position: newPosition,
    },
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
  location,
}: {
  id: number;
  title: string;
  description: string | null;
  dueAt: Date;
  status: TaskStatus;
  assigneeId: number;
  listId: number;
  location?: Location;
}) => {
  let data = {
    title,
    description,
    status,
    dueAt,
    assigneeId,
    completedAt: status === "DONE" ? new Date(Date.now()) : null,
    listId,
  };
  const INTERVAL_LIMIT = 10;
  const POSITION_INCREMENT = 1000;
  if (location) {
    const neighborBefore = location.before
      ? await getById(listId, location.before)
      : null;

    const neighborAfter = location.after
      ? await getById(listId, location.after)
      : null;
    if (neighborBefore && neighborAfter) {
      const InBetweenTaskExists =
        (await prisma.task.count({
          where: {
            listId,
            position: {
              lt: neighborAfter.position,
              gt: neighborBefore.position,
            },
          },
        })) > 0;
      if (InBetweenTaskExists)
        throw new ApiError(
          "An in-between task already exists ",
          400,
          "TaskPositionError"
        );
      let newPosition = Math.floor(
        (neighborAfter.position + neighborBefore.position) / 2
      );
      if (
        newPosition < INTERVAL_LIMIT ||
        newPosition === neighborBefore.position ||
        newPosition === neighborAfter.position
      ) {
        const newNeighborPositions = {
          before: 0,
          after: 0,
        };
        await prisma.$transaction(async (tx) => {
          const tasks = await tx.task.findMany({
            where: { listId },
            orderBy: { position: "asc" },
            select: { id: true, position: true, listId: true },
          });
          if (tasks.length > 0) {
            for (const [i, task] of tasks.entries()) {
              const newTask = await tx.task.update({
                where: { listId: task.listId, id: task.id },
                data: { position: POSITION_INCREMENT * (i + 1) },
                select: { position: true, id: true },
              });
              if (newTask.id === neighborBefore.id)
                newNeighborPositions.before = newTask.position;
              if (newTask.id === neighborAfter.id)
                newNeighborPositions.after = newTask.position;
            }
          }
        });
        newPosition = Math.floor(
          (newNeighborPositions.before + newNeighborPositions.after) / 2
        );
      }
      return await prisma.task.update({
        where: { id },
        data: { ...data, position: newPosition },
      });
    } else if (neighborBefore) {
      const afterTasksExist =
        (await prisma.task.count({
          where: { listId, position: { gt: neighborBefore.position } },
        })) > 0;
      if (afterTasksExist)
        throw new ApiError("An after task exists ", 400, "TaskPositionError");
      const currentMaxPosition = await prisma.task.aggregate({
        _max: { position: true },
        where: { listId },
      });
      return await prisma.task.update({
        where: { id },
        data: {
          ...data,
          position: currentMaxPosition._max.position
            ? currentMaxPosition._max.position + POSITION_INCREMENT
            : POSITION_INCREMENT,
        },
      });
    } else if (neighborAfter) {
      const beforeTasksExist =
        (await prisma.task.count({
          where: { listId, position: { lt: neighborAfter.position } },
        })) > 0;
      if (beforeTasksExist)
        throw new ApiError("A before task exists ", 400, "TaskPositionError");
      let newPosition = Math.floor(neighborAfter.position / 2);
      if (
        newPosition < INTERVAL_LIMIT ||
        newPosition === neighborAfter.position
      ) {
        newPosition = POSITION_INCREMENT;
        await prisma.$transaction(async (tx) => {
          const tasks = await tx.task.findMany({
            where: { listId },
            orderBy: { position: "asc" },
            select: { id: true, position: true, listId: true },
          });
          if (tasks.length > 0) {
            for (const [i, task] of tasks.entries()) {
              console.log(i);
              console.log(task);
              await tx.task.update({
                where: { listId: task.listId, id: task.id },
                data: { position: POSITION_INCREMENT * (i + 1) + 1000 },
              });
            }
          }
        });
      }
      return await prisma.task.update({
        where: { id },
        data: { ...data, position: newPosition },
      });
    } else {
      const tasksExist = (await prisma.task.count({ where: { listId } })) > 0;
      if (tasksExist)
        throw new ApiError(
          "Selected list already has tasks",
          400,
          "TaskPositionError"
        );
      return prisma.task.update({
        where: { id },
        data: { ...data, position: POSITION_INCREMENT },
      });
    }
  }
  return await prisma.task.update({
    where: { id },
    data,
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
