import { Router } from "express";
import * as controller from "./lists.controller.js";
import tasksRouter from "../tasks/tasks.routes.js";

const router = Router();

router.use("/:listId", controller.validateListRoute);
router.use("/:listId", controller.ensureAccess);

router.get("/:listId", controller.show);
router.put("/:listId", controller.validateListInput, controller.update);
router.delete("/:listId", controller.destroy);

router.use("/:listId/tasks", tasksRouter);
export default router;
