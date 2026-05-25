import { Router } from "express";
import * as controller from "./tasks.controller.js";

const router = Router({ mergeParams: true });

router.get("/", controller.index);
router.get("/:taskId", controller.validateTaskRoute, controller.show);
router.post("/", controller.validateTaskCreation, controller.create);
router.put(
  "/:taskId",
  controller.validateTaskRoute,
  controller.validateTaskUpdate,
  controller.update,
);
router.delete("/:taskId", controller.validateTaskRoute, controller.destroy);

export default router;
