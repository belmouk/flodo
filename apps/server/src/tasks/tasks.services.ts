import { ApiError } from "@repo/utils";
import { prisma } from "@repo/db";
import type { TaskUpdateInput, TaskCreationInput } from "@repo/types";

export const getAll = async (listId: number) => {
  return await prisma.task.findMany({
    where: { listId },
    orderBy: { position: "asc" },
  });
};

export const getById = async (taskId: number) => {
  return await prisma.task.findUnique({
    where: { id: taskId },
  });
};

export const create = async ({
  listId,
  assignerId,
  description,
  title,
  dueAt,
  assigneeId,
}: TaskCreationInput & { listId: number; assignerId: number }) => {
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
      title,
      description: description || null,
      dueAt,
      assigneeId,
      assignerId,
      position: newPosition,
    },
  });
};

export const update = async (input: TaskUpdateInput & { id: number }) => {
  const cleanInput: Record<string, unknown> = {};
  const ignoredFields = new Set(["id", "location"]);
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && !ignoredFields.has(key)) {
      cleanInput[key] = value;
    }
    if (key === "status")
      cleanInput["completedAt"] = value === "DONE" ? new Date() : null;
  }

  const INTERVAL_LIMIT = 10;
  const POSITION_INCREMENT = 1000;
  if (input.location && input.listId) {
    const { location, listId, id } = input;
    const neighborBefore = location.before
      ? await getById(location.before)
      : null;

    const neighborAfter = location.after ? await getById(location.after) : null;
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

        const tasks = await prisma.task.findMany({
          where: { listId },
          orderBy: { position: "asc" },
          select: { id: true },
        });

        if (tasks.length > 0) {
          const updateOperations = tasks.map((task, i) => {
            const newPos = POSITION_INCREMENT * (i + 1);

            if (task.id === neighborBefore.id)
              newNeighborPositions.before = newPos;
            if (task.id === neighborAfter.id)
              newNeighborPositions.after = newPos;

            return prisma.task.update({
              where: { id: task.id },
              data: { position: newPos },
            });
          });

          await prisma.$transaction(updateOperations);
        }

        newPosition = Math.floor(
          (newNeighborPositions.before + newNeighborPositions.after) / 2
        );
      }
      return await prisma.task.update({
        where: { id },
        data: { ...cleanInput, position: newPosition },
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
          ...cleanInput,
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

        const tasks = await prisma.task.findMany({
          where: { listId },
          orderBy: { position: "asc" },
          select: { id: true },
        });

        if (tasks.length > 0) {
          const updateOperations = tasks.map((task, i) => {
            return prisma.task.update({
              where: { id: task.id },
              data: { position: POSITION_INCREMENT * (i + 1) + 1000 },
            });
          });

          await prisma.$transaction(updateOperations);
        }
      }
      return await prisma.task.update({
        where: { id },
        data: { ...cleanInput, position: newPosition },
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
        data: { ...cleanInput, position: POSITION_INCREMENT },
      });
    }
  }
  return await prisma.task.update({
    where: { id: input.id },
    data: cleanInput,
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

export const userHasAccess = async (taskId: number, userId: number) => {
  const count = await prisma.task.count({
    where: { id: taskId, list: { project: { members: { some: { userId } } } } },
  });
  return count > 0;
};

export const isValidEdit = async (newListId: number, taskId: number) => {
  const newListPromise = prisma.list.findUnique({
    where: { id: newListId },
    select: { projectId: true },
  });
  const originalListPromise = prisma.task.findUnique({
    where: { id: taskId },
    select: { list: { select: { projectId: true } } },
  });
  const [newList, originalList] = await Promise.all([
    newListPromise,
    originalListPromise,
  ]);
  if (!newList || !originalList) return false;
  return newList.projectId === originalList.list.projectId;
};
