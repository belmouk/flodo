import { NextFunction, Request, Response } from "express";
import * as services from "./projects.services.js";
import ApiError from "../lib/ApiError.js";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import formatErrorDetails from "../lib/formatErrorDetails.js";

export const index = async (req: Request, res: Response) => {
  const projects = await services.index(req.workspaceId);
  return res.json(projects);
};

export const show = async (req: Request, res: Response) => {
  const result = await services.show(req.projectId, req.workspaceId);
  if (result.success) {
    return res.json(result.data);
  } else {
    throw new ApiError("Project was not found", 404, result.error);
  }
};

export const create = async (
  req: Request<any, any, { name: string }>,
  res: Response,
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
  res: Response,
) => {
  const result = await services.checkWorkspaceHasProject(
    req.workspaceId,
    req.projectId,
  );
  if (result.success) {
    const UserHasEditRights = await services.hasEditRights(
      req.projectId,
      req.userId,
    );
    if (UserHasEditRights) {
      const project = await services.update(req.projectId, req.body.name);
      return res.json(project);
    } else {
      throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
    }
  } else {
    throw new ApiError("Project does not exist", 404, result.error);
  }
};

export const destroy = async (req: Request, res: Response) => {
  const result = await services.checkWorkspaceHasProject(
    req.workspaceId,
    req.projectId,
  );
  if (result.success) {
    const UserHasEditRights = await services.hasEditRights(
      req.projectId,
      req.userId,
    );
    if (UserHasEditRights) {
      await services.destroy(req.projectId);
      return res.sendStatus(204);
    } else {
      throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
    }
  } else {
    throw new ApiError("Project does not exist", 404, result.error);
  }
};

export const validateProjectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
  projectId: string,
) => {
  const schema = z.coerce.number().int().positive();

  const result = schema.safeParse(projectId);

  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");

  const project = await prisma.project.findUnique({
    where: {
      id: result.data,
      workspaceId: req.workspaceId,
    },
  });
  if (!project)
    throw new ApiError("Project was not found", 404, "ProjectNotFound");
  req.projectId = result.data;
  return next();
};

export const validateProjectInput = (
  req: Request,
  res: Response,
  next: NextFunction,
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
    throw new ApiError(
      "Invalid project data",
      400,
      "InvalidDataError",
      formatErrorDetails(errors),
    );
  }
  req.body = result.data;
  return next();
};
