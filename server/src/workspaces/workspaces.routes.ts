import { Router } from "express";
import * as controller from "./workspaces.controller.js";

const router = Router();

router.get("/", controller.index);
router.post("/", controller.create);
router.get("/:id", controller.show);
router.put("/:id", controller.update);
router.delete("/:id", controller.destroy);

export default router;
