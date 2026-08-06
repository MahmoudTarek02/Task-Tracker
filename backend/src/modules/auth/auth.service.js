"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../../database/models");
const email_1 = require("../../config/email");
class AuthService {
    async register(name, email, password) {
        email = email.toLowerCase();
        const existingUser = await models_1.User.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new Error("Email already exists");
        }
        const verificationToken = crypto_1.default.randomUUID();
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await models_1.User.create({
            name,
            email,
            password: hashedPassword,
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
        });
        // Send email verification link
        await (0, email_1.sendVerificationEmail)(email, verificationToken);
        return {
            id: user.getDataValue("id"),
            name: user.getDataValue("name"),
            email: user.getDataValue("email"),
        };
    }
    async verifyEmail(token) {
        const user = await models_1.User.findOne({
            where: { emailVerificationToken: token },
        });
        if (!user) {
            throw new Error("Invalid or expired verification token");
        }
        await user.update({
            isEmailVerified: true,
            emailVerificationToken: null,
        });
        return {
            id: user.getDataValue("id"),
            name: user.getDataValue("name"),
            email: user.getDataValue("email"),
            isEmailVerified: user.getDataValue("isEmailVerified"),
        };
    }
    async login(email, password) {
        email = email.toLowerCase();
        const user = await models_1.User.findOne({
            where: { email },
        });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.getDataValue("password"));
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }
        if (!user.getDataValue("isEmailVerified")) {
            throw new Error("Please verify your email address before logging in");
        }
        const secret = process.env.JWT_SECRET || "fallback_secret";
        const token = jsonwebtoken_1.default.sign({
            id: user.getDataValue("id"),
            email: user.getDataValue("email"),
            name: user.getDataValue("name"),
        }, secret, { expiresIn: "24h" });
        return {
            user: {
                id: user.getDataValue("id"),
                name: user.getDataValue("name"),
                email: user.getDataValue("email"),
            },
            token,
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map