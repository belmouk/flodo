import { Router } from "express";
import * as controller from "./auth.controller.js";
import { validateUserSignup } from "../middleware/user.validation.js";

const router = Router();

router.get("/signup", controller.signup);
router.post("/signup", validateUserSignup);

export default router;
