import { NextFunction, Request, Response } from "express";
import * as services from "./workspaces.services.js";
import ApiError from "../lib/ApiError.js";
import * as z from "zod";
import formatErrorDetails from "../lib/formatErrorDetails.js";

export const index = async (req: Request, res: Response) => {
  const workspaces = await services.getWorkSpaces(req.userId);
  return res.json(workspaces);
};

export const show = async (
  req: Request<{ workspaceId: string }, any, any>,
  res: Response,
) => {
  const id = parseInt(req.params.workspaceId, 10);
  const workspace = await services.getWorkspace(id, req.userId);
  if (!workspace)
    throw new ApiError(
      "Workspace does not exist",
      404,
      "WorkspaceDoesNotExist",
    );
  return res.json(workspace);
};

export const create = async (
  req: Request<any, any, { name: string }>,
  res: Response,
) => {
  const workspace = await services.create({
    name: req.body.name,
    userId: req.userId,
  });
  return res.json(workspace);
};

export const update = async (
  req: Request<{ workspaceId: string }, any, { name: string }>,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const hasUpdateRights = await services.hasUpdateRights(
    req.userId,
    workspaceId,
  );
  if (!hasUpdateRights)
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  const workspace = await services.update({
    name: req.body.name,
    id: workspaceId,
    userId: req.userId,
  });
  return res.json(workspace);
};

export const destroy = async (
  req: Request<{ workspaceId: string }, any, any>,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const hasDeleteRights = await services.hasDeleteRights(
    req.userId,
    workspaceId,
  );
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
  const workspaceId = parseInt(req.params.workspaceId, 10);
  if (await services.isWorkspaceMember(req.userId, workspaceId)) {
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

export const validateWorkspaceInput = (
  req: Request<any, any, { name: string }>,
  res: Response,
  next: NextFunction,
) => {
  const schema = z.object({
    name: z
      .string()
      .min(1, "Workspace name is required")
      .max(150, "Workspace name is too long"),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;

    throw new ApiError(
      "Invalid workspace creation input",
      400,
      "InputValidationError",
      formatErrorDetails(errors),
    );
  }
  req.body = result.data;
};
