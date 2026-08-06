"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("./auth.service"));
const auth_validation_1 = require("./auth.validation");
class AuthController {
    async register(req, res) {
        const result = auth_validation_1.registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        const { name, email, password } = result.data;
        try {
            const user = await auth_service_1.default.register(name, email, password);
            return res.status(201).json({
                message: "User registered successfully",
                user,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Registration failed",
            });
        }
    }
    async verifyEmail(req, res) {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            return res.status(400).json({
                message: "Verification token is required",
            });
        }
        try {
            const user = await auth_service_1.default.verifyEmail(token);
            return res.status(200).json({
                message: "Email verified successfully",
                user,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Email verification failed",
            });
        }
    }
    async login(req, res) {
        const result = auth_validation_1.loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        const { email, password } = result.data;
        try {
            const { user, token } = await auth_service_1.default.login(email, password);
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
            return res.status(200).json({
                message: "Login successful",
                user,
            });
        }
        catch (error) {
            return res.status(400).json({
                message: error.message || "Login failed",
            });
        }
    }
    async logout(req, res) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return res.status(200).json({
            message: "Sign out successful",
        });
    }
    async me(req, res) {
        // so typescript doesn't show error if user is not in req
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        return res.status(200).json({
            user: {
                id: authReq.user.id,
                name: authReq.user.name,
                email: authReq.user.email,
            },
        });
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map