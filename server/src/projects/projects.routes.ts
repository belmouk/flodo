import { Router } from "express";
import * as controller from "./projects.controller.js";

const router = Router();

router.use("/:projectId", controller.validateProjectRoute);

router.use("/:projectId", controller.ensureProjectMembership);

router.get("/:projectId", controller.show);
router.put("/:projectId", controller.validateProjectInput, controller.update);
router.delete("/:projectId", controller.destroy);

export default router;
