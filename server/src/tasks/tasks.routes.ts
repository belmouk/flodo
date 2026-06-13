import { Router } from "express";
import * as controller from "./tasks.controller.js";

const router = Router({ mergeParams: true });

router.param("taskId", controller.validateTaskRoute);

router.get("/", controller.index);
router.get("/:taskId", controller.show);
router.post("/", controller.validateTaskCreation, controller.create);
router.put("/:taskId", controller.validateTaskUpdate, controller.update);
router.delete("/:taskId", controller.destroy);

export default router;
