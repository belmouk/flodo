import { NextFunction, Request, Response } from "express";
import * as services from "./projects.services.js";
import ApiError from "../lib/ApiError.js";
import z from "zod";

export const index = async (req: Request, res: Response) => {
  const projects = await services.getAll(req.workspaceId);
  return res.json(projects);
};

export const show = async (req: Request, res: Response) => {
  let includes = { lists: false, members: false, tasks: false };
  if (req.query.includes && typeof req.query.includes === "string") {
    const availableResources = new Set(Object.keys(includes));
    const requestedResources = new Set(req.query.includes.split(","));
    const validResources = requestedResources.intersection(availableResources);
    for (const resource of validResources) {
      includes[resource as keyof typeof includes] = true;
    }
  }
  const project = await services.getById(
    req.projectId,
    req.workspaceId,
    includes
  );
  if (!project)
    throw new ApiError("Project was not found", 404, "ProjectDoesNotExist");
  return res.json(project);
};

export const create = async (
  req: Request<any, any, { name: string }>,
  res: Response
) => {
  const project = await services.create({
    workspaceId: req.workspaceId,
    name: req.body.name,
    userId: req.userId,
  });
  return res.json(project);
};

export const update = async (
  req: Request<any, any, { name: string }>,
  res: Response
) => {
  const UserHasEditRights = await services.hasEditRights(
    req.projectId,
    req.userId
  );
  if (UserHasEditRights) {
    const project = await services.update(req.projectId, req.body.name);
    return res.json(project);
  } else {
    throw new ApiError("Unauthorized action", 403, "UnAuthorizedAction");
  }
};

export const destroy = async (req: Request, res: Response) => {
  const UserHasEditRights = await services.hasEditRights(
    req.projectId,
    req.userId
  );
  if (UserHasEditRights) {
    await services.destroy(req.projectId);
    return res.sendStatus(204);
  } else {
    throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
  }
};

export const validateProjectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
  projectId: string
) => {
  const schema = z.coerce.number().int().positive();

  const result = schema.safeParse(projectId);

  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");

  const project = await services.getById(result.data, req.workspaceId);
  if (!project)
    throw new ApiError("Project was not found", 404, "ProjectNotFound");
  req.projectId = result.data;
  return next();
};

export const validateProjectInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = z.object({
    name: z
      .string()
      .min(1, "Project name is required")
      .max(150, "Project name is too long"),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors;
    throw new ApiError("Invalid project data", 400, "InvalidDataError", errors);
  }
  req.body = result.data;
  return next();
};

export const ensureProjectMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(await services.userIsProjectMember(req.userId, req.projectId)))
    throw new ApiError("Resource not accessible", 403, "UnAuthorizedAccess");
  return next();
};
