import { Router } from "express";
import * as controller from "./projects.controller.js";
import listsRouter from "../lists/lists.routes.js";

const router = Router({ mergeParams: true });

router.param("projectId", controller.validateProjectRoute);

router.get("/", controller.index);
router.get("/:projectId", controller.show);
router.post("/", controller.validateProjectInput, controller.create);
router.put("/:projectId", controller.validateProjectInput, controller.update);
router.delete("/:projectId", controller.destroy);

router.use(
  "/:projectId/lists",
  controller.ensureProjectMembership,
  listsRouter
);

export default router;
