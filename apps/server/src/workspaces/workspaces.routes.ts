import { Router } from "express";
import * as workspaceController from "./workspaces.controller.js";
import * as projectController from "../projects/projects.controller.js";
import * as listController from "../lists/lists.controller.js";
import * as taskController from "../tasks/tasks.controller.js";

const router = Router();

router.get("/", workspaceController.index);
router.post(
  "/",
  workspaceController.validateWorkspaceInput,
  workspaceController.create
);

router.use("/:workspaceId", workspaceController.validateWorkspaceRoute);

// Validate user membership for subsequent routes
router.use("/:workspaceId", workspaceController.ensureWorkspaceMembership);

router.get("/:workspaceId", workspaceController.show);
router.put(
  "/:workspaceId",
  workspaceController.validateWorkspaceInput,
  workspaceController.update
);
router.delete("/:workspaceId", workspaceController.destroy);

// Project routes

router.get("/:workspaceId/projects", projectController.index);
router.post(
  "/:workspaceId/projects",
  projectController.validateProjectInput,
  projectController.create
);

// List routes
router.param("projectId", projectController.validateProjectRoute);

router.get("/:workspaceId/projects/:projectId/lists", listController.index);
router.post(
  "/:workspaceId/projects/:projectId/lists",
  listController.validateListInput,
  listController.create
);

// Task routes
router.param("listId", listController.validateListRoute);

router.get(
  "/:workspaceId/projects/:projectId/lists/:listId/tasks",
  taskController.index
);
router.post(
  "/:workspaceId/projects/:projectId/lists/:listId/tasks",
  taskController.validateTaskCreation,
  taskController.create
);

export default router;
