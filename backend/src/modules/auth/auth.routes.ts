import { Router } from "express";
import authController from "./auth.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.me);

export default router;