import { Router } from "express";
import * as controller from "./auth.controller.js";
import {
  validateUserLogin,
  validateUserSignup,
} from "../middleware/user.validation.js";

const router = Router();

router.post("/signup", validateUserSignup, controller.signup);
router.post("/login", validateUserLogin, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", controller.me);

export default router;
