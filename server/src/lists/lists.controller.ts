import { NextFunction, Request, Response } from "express";
import * as services from "./lists.services.js";
import z from "zod";
import ApiError from "../lib/ApiError.js";

export const validateListRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
  listId: string
) => {
  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(listId);
  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  const list = await services.getById(req.projectId, result.data);
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

export const show = async (req: Request, res: Response) => {
  const result = await services.getById(req.projectId, req.listId);
  if (!result)
    throw new ApiError("List was not found", 404, "ListDoesNotExist");
  return res.json(result);
};

export const update = async (req: Request, res: Response) => {
  const isMember = await services.userIsProjectMember(
    req.userId,
    req.projectId
  );
  if (!isMember)
    throw new ApiError("Unauthorized action", 403, "UnAuthorizedAction");
  const updatedList = await services.update(
    req.listId,
    req.body.name,
    req.body.position
  );
  return res.json(updatedList);
};

export const create = async (req: Request, res: Response) => {
  const newList = await services.create(req.projectId, req.body.name);
  return res.json(newList);
};

export const destroy = async (req: Request, res: Response) => {
  const isMember = await services.userIsProjectMember(
    req.userId,
    req.projectId
  );
  if (!isMember)
    throw new ApiError("Unauthorized action", 403, "UnAuthorizedAction");
  await services.destroy(req.listId);
  return res.sendStatus(204);
};
