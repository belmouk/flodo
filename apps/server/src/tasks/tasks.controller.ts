import type { Request, Response, NextFunction } from "express";
import * as services from "./tasks.services.js";
import * as z from "zod";
import { ApiError } from "@repo/utils";
import { TaskCreationSchema, TaskUpdateSchema } from "@repo/types";
import type { TaskCreationInput, TaskUpdateInput } from "@repo/types";

export const index = async (req: Request, res: Response) => {
  const tasks = await services.getAll(req.listId);
  return res.json(tasks);
};

export const show = async (req: Request, res: Response) => {
  const result = await services.getById(req.taskId);
  if (!result) {
    throw new ApiError("Task was not found", 404, "TaskDoesNotExist");
  }
  return res.json(result);
};

export const validateTaskRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(req.params.taskId);

  if (!result.success) {
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  }
  const task = await services.getById(result.data);
  if (!task) throw new ApiError("Task does not exist", 404, "TaskDoesNotExist");
  req.taskId = result.data;
  return next();
};

export const create = async (
  req: Request<unknown, unknown, TaskCreationInput>,
  res: Response
) => {
  const task = await services.create({
    listId: req.listId,
    ...req.body,
    assignerId: req.userId,
  });
  return res.json(task);
};

export const validateTaskCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = TaskCreationSchema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError(
      "Invalid task creation input",
      400,
      "InputValidationError",
      errors
    );
  }
  req.body = result.data;
  return next();
};

export const validateTaskUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = TaskUpdateSchema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError(
      "Invalid task update input",
      400,
      "InputValidationError",
      errors
    );
  }
  req.body = result.data;
  return next();
};

export const update = async (
  req: Request<unknown, unknown, TaskUpdateInput>,
  res: Response
) => {
  const hasEditRights = await services.hasEditRights(req.userId, req.taskId);
  if (!hasEditRights) {
    throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
  }

  const updatedTask = await services.update({ ...req.body, id: req.taskId });
  return res.json(updatedTask);
};

export const destroy = async (req: Request, res: Response) => {
  const hasEditRights = await services.hasEditRights(req.userId, req.taskId);
  if (!hasEditRights) {
    throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
  }
  await services.destroy(req.taskId);
  return res.sendStatus(204);
};

export const ensureAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const access = await services.userHasAccess(req.taskId, req.userId);
  if (!access)
    throw new ApiError("Resource not accessible", 403, "UnAuthorizedAccess");
  return next();
};
