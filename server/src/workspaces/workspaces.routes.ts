import { Router } from "express";
import * as controller from "./workspaces.controller.js";
import projectsRouter from "../projects/projects.routes.js";
import { validateHeaderName } from "node:http";

const router = Router();

router.get("/", controller.index);
router.post("/", controller.create);
router.get("/:workspaceId", controller.validateWorkspaceRoute, controller.show);
router.put(
  "/:workspaceId",
  controller.validateWorkspaceRoute,
  controller.update,
);
router.delete(
  "/:workspaceId",
  controller.validateWorkspaceRoute,
  controller.destroy,
);

router.use(
  "/:workspaceId/projects",
  controller.validateWorkspaceRoute,
  controller.ensureWorkspaceMembership,
  projectsRouter,
);

export default router;
