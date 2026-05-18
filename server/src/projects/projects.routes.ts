import { Router } from "express";
import * as controller from "./projects.controller.js";

const router = Router({ mergeParams: true });

router.get("/", controller.index);
router.get("/:projectId", controller.show);
router.post("/", controller.create);
router.put("/:projectId", controller.update);
router.delete("/:projectId", controller.destroy);

export default router;
