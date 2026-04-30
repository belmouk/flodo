import { Router } from "express";
import * as controller from "./auth.controller.js";
import { validateUserSignup } from "../middleware/user.validation.js";

const router = Router();

router.post("/signup", validateUserSignup, controller.signup);

export default router;
