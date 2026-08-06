"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").trim(),
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(100, "Password must not exceed 100 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    password: zod_1.z.string().min(1, "Password is required"),
});
//# sourceMappingURL=auth.validation.js.map