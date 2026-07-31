import { Router } from "express";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/signup", controller.validateUserSignup, controller.signup);
router.post("/login", controller.validateUserLogin, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", controller.me);

export default router;
