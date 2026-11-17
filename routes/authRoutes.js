import { Router } from "express";
import * as controller from "../controllers/authController.js";

const router = Router();

router.get("/signup", controller.showSignUp);
router.post("/signup", controller.signUp);
router.get("/login", controller.showLogin);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", controller.me);

export default router;
