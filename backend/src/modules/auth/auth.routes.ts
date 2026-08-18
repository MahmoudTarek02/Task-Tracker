import { Router } from "express";
import authController from "./auth.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { registerSchema, loginSchema, verifyEmailSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.get("/verify-email", validate(verifyEmailSchema, "query"), authController.verifyEmail);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.me);

export default router;