import { Request, Response, NextFunction } from "express";
import * as services from "./tasks.services.js";
import z from "zod";
import ApiError from "../lib/ApiError.js";
import type { TaskStatus } from "../../generated/prisma/enums.js";

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
  req: Request<
    unknown,
    unknown,
    { title: string; description: string; dueAt: Date; assigneeId: number }
  >,
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
  const schema = z.object({
    title: z
      .string()
      .trim()
      .min(1, "Specify the task")
      .max(255, "Task title is too long"),
    dueAt: z.coerce.date("Due date should be of type date"),
    description: z
      .string()
      .trim()
      .max(5000, "Description content is too long")
      .optional(),
    assigneeId: z.coerce
      .number()
      .int()
      .positive("AssigneeId must be a positive integer"),
  });
  const result = schema.safeParse(req.body);
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
  const schema = z.object({
    title: z
      .string()
      .trim()
      .min(1, "Specify the task")
      .max(255, "Task title is too long")
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description content is too long")
      .optional(),
    dueAt: z.coerce.date("Due date should be of type date").optional(),
    assigneeId: z.coerce
      .number()
      .int()
      .positive("AssigneeId must be a positive integer")
      .optional(),
    status: z
      .enum(["WIP", "DONE", "OVERDUE"], "Task status not found")
      .optional(),
    listId: z.coerce
      .number()
      .int()
      .positive("listId must be a positive integer")
      .optional(),
    location: z
      .object({
        before: z.coerce
          .number()
          .int()
          .nonnegative("Position before must be a positive integer")
          .nullable(),
        after: z.coerce
          .number()
          .int()
          .nonnegative("Position after must be a positive integer")
          .nullable(),
      })
      .optional(),
  });
  const result = schema.safeParse(req.body);
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

export type Location = { before: number | null; after: number | null };

export const update = async (
  req: Request<
    unknown,
    unknown,
    {
      title?: string;
      description?: string;
      dueAt?: Date;
      assigneeId?: number;
      status?: TaskStatus;
      location?: Location;
      listId: number;
    }
  >,
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
