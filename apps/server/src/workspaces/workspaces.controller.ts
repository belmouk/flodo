import { NextFunction, Request, Response } from "express";
import * as services from "./workspaces.services.js";
import { ApiError } from "@repo/utils";
import * as z from "zod";

export const index = async (req: Request, res: Response) => {
  const workspaces = await services.getWorkSpaces(req.userId);
  return res.json(workspaces);
};

export const show = async (req: Request, res: Response) => {
  const workspace = await services.getWorkspace(req.workspaceId, req.userId);
  if (!workspace)
    throw new ApiError(
      "Workspace does not exist",
      404,
      "WorkspaceDoesNotExist"
    );
  return res.json(workspace);
};

export const create = async (
  req: Request<unknown, unknown, { name: string }>,
  res: Response
) => {
  const workspace = await services.create({
    name: req.body.name,
    userId: req.userId,
  });
  return res.json(workspace);
};

export const update = async (
  req: Request<unknown, unknown, { name: string }>,
  res: Response
) => {
  const hasUpdateRights = await services.hasUpdateRights(
    req.userId,
    req.workspaceId
  );
  if (!hasUpdateRights)
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  const workspace = await services.update({
    name: req.body.name,
    id: req.workspaceId,
  });
  return res.json(workspace);
};

export const destroy = async (req: Request, res: Response) => {
  const hasDeleteRights = await services.hasDeleteRights(
    req.userId,
    req.workspaceId
  );
  if (!hasDeleteRights) {
    throw new ApiError("Action not permitted.", 403, "UnAuthorizedUser");
  }
  await services.destroy(req.workspaceId);
  return res.sendStatus(204);
};

export const ensureWorkspaceMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (await services.isWorkspaceMember(req.userId, req.workspaceId)) {
    next();
  } else {
    throw new ApiError("Resource not accessible", 403, "UnAuthorizedAccess");
  }
};

export const validateWorkspaceRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(req.params.workspaceId);
  if (!result.success) {
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  }
  req.workspaceId = result.data;
  return next();
};

export const validateWorkspaceInput = (
  req: Request<unknown, unknown, { name: string }>,
  res: Response,
  next: NextFunction
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
      errors
    );
  }
  req.body = result.data;
  return next();
};
