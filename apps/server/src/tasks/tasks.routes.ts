import { Router } from "express";
import * as controller from "./tasks.controller.js";

const router = Router();

router.use("/:taskId", controller.validateTaskRoute);
router.use("/:taskId", controller.ensureAccess);

router.get("/:taskId", controller.show);
router.patch("/:taskId", controller.validateTaskUpdate, controller.update);
router.delete("/:taskId", controller.destroy);

export default router;
