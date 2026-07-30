import { NextFunction, Request, Response } from "express";
import * as services from "./lists.services.js";
import z from "zod";
import { ApiError } from "@repo/utils";

export const validateListRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(req.params.listId);
  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  const list = await services.getById(result.data);
  if (!list) throw new ApiError("List was not found", 404, "ListNotFound");
  req.listId = result.data;
  return next();
};

export const validateListInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = z.object({
    name: z
      .string()
      .min(1, "List name is required")
      .max(255, "List name too long"),
    position: z.coerce
      .number()
      .int()
      .positive("List position must be positive integer.")
      .optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError("Invalid project data", 400, "InvalidDataError", errors);
  }
  req.body = result.data;
  return next();
};

export const index = async (req: Request, res: Response) => {
  const result = await services.getAll(req.projectId);
  return res.json(result);
};

export const create = async (
  req: Request<unknown, unknown, { name: string }>,
  res: Response
) => {
  const newList = await services.create(req.projectId, req.body.name);
  return res.json(newList);
};

export const show = async (req: Request, res: Response) => {
  const result = await services.getById(req.listId);
  if (!result)
    throw new ApiError("List was not found", 404, "ListDoesNotExist");
  return res.json(result);
};

export const update = async (
  req: Request<unknown, unknown, { name: string; position: number }>,
  res: Response
) => {
  const updatedList = await services.update(
    req.listId,
    req.body.name,
    req.body.position
  );
  return res.json(updatedList);
};

export const destroy = async (req: Request, res: Response) => {
  await services.destroy(req.listId);
  return res.sendStatus(204);
};

export const ensureAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const access = await services.userHasAccess(req.listId, req.userId);
  if (!access)
    throw new ApiError("Resource not accessible", 403, "UnAuthorizedAccess");
  return next();
};
