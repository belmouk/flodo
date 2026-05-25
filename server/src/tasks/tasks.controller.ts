import { Request, Response, NextFunction, application } from "express";
import * as services from "./tasks.services.js";
import z from "zod";
import ApiError from "../lib/ApiError.js";
import formatErrorDetails from "../lib/formatErrorDetails.js";
import { TaskStatus } from "../prisma/enums.js";

export const index = async (
  req: Request<{ workspaceId: string; projectId: string }>,
  res: Response,
) => {
  const projectId = parseInt(req.params.projectId, 10);
  const tasks = await services.index(projectId);
  return res.json(tasks);
};

export const show = async (
  req: Request<{ workspaceId: string; projectId: string; taskId: string }>,
  res: Response,
) => {
  const taskId = parseInt(req.params.taskId, 10);
  const projectId = parseInt(req.params.projectId, 10);
  const result = await services.show(projectId, taskId);
  if (!result.success) {
    throw new ApiError("Task was not found", 404, result.error);
  }
  return res.json(result.data);
};

export const validateTaskRoute = async (
  req: Request<{ workspaceId: string; projectId: string; taskId: string }>,
  res: Response,
  next: NextFunction,
) => {
  const ParamsSchema = z.object({
    workspaceId: z.coerce.number().int().positive(),
    projectId: z.coerce.number().int().positive(),
    taskId: z.coerce.number().int().positive(),
  });
  const result = ParamsSchema.safeParse(req.params);
  if (!result.success) {
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  }

  return next();
};

export const create = async (
  req: Request<
    { projectId: string },
    any,
    { content: string; dueAt: Date; assigneeId: number }
  >,
  res: Response,
) => {
  const projectId = parseInt(req.params.projectId, 10);
  const task = await services.create({
    projectId,
    ...req.body,
    assignerId: req.userId,
  });
  return res.json(task);
};

export const validateTaskCreation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = z.object({
    content: z
      .string()
      .trim()
      .min(1, "Specify the task")
      .max(255, "Task content is too long"),
    dueAt: z.coerce.date("Due date should be of type date"),
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
      formatErrorDetails(errors),
    );
  }
  req.body = result.data;
  return next();
};

export const validateTaskUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const schema = z.object({
    content: z
      .string()
      .trim()
      .min(1, "Specify the task")
      .max(255, "Task content is too long")
      .optional(),
    dueAt: z.coerce.date("Due date should be of type date").optional(),
    assigneeId: z.coerce
      .number()
      .int()
      .positive("AssigneeId must be a positive integer")
      .optional(),
    status: z
      .literal(["WIP", "DONE", "OVERDUE"], "Task status not found")
      .optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError(
      "Invalid task update input",
      400,
      "InputValidationError",
      formatErrorDetails(errors),
    );
  }
  req.body = result.data;
  return next();
};

export const update = async (
  req: Request<
    { projectId: string; taskId: string },
    any,
    {
      content?: string;
      dueAt?: Date;
      assigneeId?: number;
      status?: TaskStatus;
    }
  >,
  res: Response,
) => {
  const projectId = parseInt(req.params.projectId, 10);
  const taskId = parseInt(req.params.taskId, 10);
  const result = await services.show(projectId, taskId);
  if (!result.success) {
    throw new ApiError("Task was not found", 404, result.error);
  }
  const userHasEditRights = await services.hasEditRights(req.userId, taskId);
  if (!userHasEditRights) {
    throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
  }
  const updateData = { ...result.data, ...req.body };
  const task = await services.update(updateData);
  return res.json(task);
};

export const destroy = async (
  req: Request<{ projectId: string; taskId: string }>,
  res: Response,
) => {
  const projectId = parseInt(req.params.projectId, 10);
  const taskId = parseInt(req.params.taskId, 10);
  const result = await services.show(projectId, taskId);
  if (!result.success) {
    throw new ApiError("Task was not found", 404, result.error);
  }
  const userHasDeleteRights = await services.hasDeleteRights(
    req.userId,
    taskId,
  );
  if (!userHasDeleteRights) {
    throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
  }
  await services.destroy(taskId);
  return res.sendStatus(204);
};
