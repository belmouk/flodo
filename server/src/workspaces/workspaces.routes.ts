import { Router } from "express";
import * as controller from "./workspaces.controller.js";
import projectsRouter from "../projects/projects.routes.js";

const router = Router();

router.param("workspaceId", controller.validateWorkspaceRoute);

router.get("/", controller.index);
router.post("/", controller.validateWorkspaceInput, controller.create);
router.get("/:workspaceId", controller.show);
router.put(
  "/:workspaceId",
  controller.validateWorkspaceInput,
  controller.update,
);
router.delete("/:workspaceId", controller.destroy);

router.use(
  "/:workspaceId/projects",
  controller.ensureWorkspaceMembership,
  projectsRouter,
);

export default router;
