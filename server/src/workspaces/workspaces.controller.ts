import { Request, Response } from "express";
import * as services from "./workspaces.services.js";
import ApiError from "../lib/ApiError.js";

export const index = async (req: Request, res: Response) => {
  const workspaces = await services.getWorkSpaces();
  return res.json(workspaces);
};

export const show = async (
  req: Request<{ id: string }, any, any>,
  res: Response,
) => {
  const id = parseInt(req.params.id, 10);
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
  req: Request<{ id: string }, any, { name: string; userId: number }>,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.id, 10);
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
  req: Request<{ id: string }, any, any>,
  res: Response,
) => {
  const userId = req.body.userId;
  const workspaceId = parseInt(req.params.id, 10);
  const hasDeleteRights = await services.hasDeleteRights(userId, workspaceId);
  if (!hasDeleteRights) {
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  }
  await services.destroy(workspaceId);
  return res.sendStatus(204);
};
