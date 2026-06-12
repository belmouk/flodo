import { Router } from "express";
import * as controller from "./lists.controller.js";

const router = Router({ mergeParams: true });

router.param("listId", controller.validateListRoute);

router.get("/", controller.index);
// router.get("/:listId");

export default router;
