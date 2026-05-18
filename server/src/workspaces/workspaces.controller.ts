import { NextFunction, Request, Response } from "express";
import * as services from "./workspaces.services.js";
import ApiError from "../lib/ApiError.js";
import * as z from "zod";

export const index = async (req: Request, res: Response) => {
  const workspaces = await services.getWorkSpaces();
  return res.json(workspaces);
};

export const show = async (
  req: Request<{ workspaceId: string }, any, any>,
  res: Response,
) => {
  const id = parseInt(req.params.workspaceId, 10);
  const workspace = await services.getWorkspace(id);
  if (!workspace)
    throw new ApiError(
      "Workspace does not exist",
      404,
      "WorkspaceDoesNotExist",
    );
  return res.json(workspace);
};

export const create = async (
  req: Request<any, any, { name: string; userId: number }>,
  res: Response,
) => {
  const workspace = await services.create({
    name: req.body.name,
    userId: req.body.userId,
  });
  return res.json(workspace);
};

export const update = async (
  req: Request<{ workspaceId: string }, any, { name: string; userId: number }>,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const userId = req.body.userId;
  const hasUpdateRights = await services.hasUpdateRights(userId, workspaceId);
  if (!hasUpdateRights)
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  const workspace = await services.update({
    name: req.body.name,
    id: workspaceId,
  });
  return res.json(workspace);
};

export const destroy = async (
  req: Request<{ workspaceId: string }, any, any>,
  res: Response,
) => {
  const userId = req.body.userId;
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const hasDeleteRights = await services.hasDeleteRights(userId, workspaceId);
  if (!hasDeleteRights) {
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  }
  await services.destroy(workspaceId);
  return res.sendStatus(204);
};

export const ensureWorkspaceMembership = async (
  req: Request<{ workspaceId: string }, any, any>,
  res: Response,
  next: NextFunction,
) => {
  const userId: number = req.body.userId;
  const workspaceId = parseInt(req.params.workspaceId, 10);
  if (await services.isWorkspaceMember(userId, workspaceId)) {
    next();
  } else {
    throw new ApiError("Resource not accessible", 403, "UnAuthorizedAccess");
  }
};

export const validateWorkspaceRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ParamsSchema = z.object({
    workspaceId: z.coerce.number().int().positive(),
  });
  const result = ParamsSchema.safeParse(req.params);
  if (!result.success) {
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  }
  return next();
};
