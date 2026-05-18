import { NextFunction, Request, Response } from "express";
import * as services from "./projects.services.js";
import ApiError from "../lib/ApiError.js";
import z from "zod";

export const index = async (
  req: Request<{ workspaceId: string }>,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const projects = await services.index(workspaceId);
  return res.json(projects);
};

export const show = async (
  req: Request<{ workspaceId: string; projectId: string }>,
  res: Response,
) => {
  const id = parseInt(req.params.projectId, 10);
  const result = await services.show(id);
  if (result.success) {
    return res.json(result.data);
  } else {
    throw new ApiError("Project was not found", 404, result.error);
  }
};

export const create = async (
  req: Request<
    { workspaceId: string; projectId: string },
    any,
    { name: string; userId: number }
  >,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const { name, userId } = req.body;
  const project = await services.create({ workspaceId, name, userId });
  return res.json(project);
};

export const update = async (
  req: Request<
    { workspaceId: string; projectId: string },
    any,
    { name: string; userId: number }
  >,
  res: Response,
) => {
  const { name, userId } = req.body;
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const projectId = parseInt(req.params.projectId, 10);
  const result = await services.checkWorkspaceHasProject(
    workspaceId,
    projectId,
  );
  if (result.success) {
    const UserHasEditRights = await services.hasEditRights(projectId, userId);
    if (UserHasEditRights) {
      const project = await services.update(projectId, name);
      return res.json(project);
    } else {
      throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
    }
  } else {
    throw new ApiError("Project does not exist", 404, result.error);
  }
};

export const destroy = async (
  req: Request<
    { workspaceId: string; projectId: string },
    any,
    { userId: number }
  >,
  res: Response,
) => {
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const projectId = parseInt(req.params.projectId, 10);
  const result = await services.checkWorkspaceHasProject(
    workspaceId,
    projectId,
  );
  if (result.success) {
    const UserHasEditRights = await services.hasEditRights(
      projectId,
      req.body.userId,
    );
    if (UserHasEditRights) {
      await services.destroy(projectId);
      return res.sendStatus(204);
    } else {
      throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
    }
  } else {
    throw new ApiError("Project does not exist", 404, result.error);
  }
};

export const validateProjectRoute = async (
  req: Request<{ workspaceId: string; projectId: string }>,
  res: Response,
  next: NextFunction,
) => {
  const ParamsSchema = z.object({
    workspaceId: z.coerce.number().int().positive(),
    projectId: z.coerce.number().int().positive(),
  });
  const result = ParamsSchema.safeParse(req.params);
  if (!result.success) {
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");
  }
  return next();
};
