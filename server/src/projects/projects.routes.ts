import { Router } from "express";
import * as controller from "./projects.controller.js";
import tasksRouter from "../tasks/tasks.routes.js";

const router = Router({ mergeParams: true });

router.get("/", controller.index);
router.get("/:projectId", controller.validateProjectRoute, controller.show);
router.post("/", controller.validateProjectInput, controller.create);
router.put(
  "/:projectId",
  controller.validateProjectRoute,
  controller.validateProjectInput,
  controller.update,
);
router.delete(
  "/:projectId",
  controller.validateProjectRoute,
  controller.destroy,
);

router.use("/:projectId/tasks", controller.validateProjectRoute, tasksRouter);

export default router;
