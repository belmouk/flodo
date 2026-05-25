import { NextFunction, Request, Response } from "express";
import * as services from "./projects.services.js";
import ApiError from "../lib/ApiError.js";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import formatErrorDetails from "../lib/formatErrorDetails.js";

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
  const workspaceId = parseInt(req.params.workspaceId, 10);
  const result = await services.show(id, workspaceId);
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
    { name: string }
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
      req.userId,
    );
    if (UserHasEditRights) {
      const project = await services.update(projectId, req.body.name);
      return res.json(project);
    } else {
      throw new ApiError("unauthorized action", 403, "UnAuthorizedAction");
    }
  } else {
    throw new ApiError("Project does not exist", 404, result.error);
  }
};

export const destroy = async (
  req: Request<{ workspaceId: string; projectId: string }, any, any>,
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
      req.userId,
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

  if (!result.success)
    throw new ApiError("Invalid route params", 400, "InvalidRouteParams");

  const project = await prisma.project.findUnique({
    where: {
      id: result.data.projectId,
      workspaceId: result.data.workspaceId,
    },
  });
  if (!project)
    throw new ApiError("Project was not found", 404, "ProjectNotFound");
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
