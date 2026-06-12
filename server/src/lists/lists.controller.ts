import { NextFunction, Request, Response } from "express";
import * as services from "./lists.services.js";
import z from "zod";
import ApiError from "../lib/ApiError.js";

export const index = async (req: Request, res: Response) => {
  const result = await services.index(req.projectId);
  return res.json(result);
};

export const validateListRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
  listId: string,
) => {
  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(listId);
  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  req.listId = result.data;
  return next();
};

const show = async (req: Request, res: Response) => {};
