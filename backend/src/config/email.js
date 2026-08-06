"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587 or other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
async function sendVerificationEmail(to, token) {
    const PORT = process.env.PORT || 3000;
    const verificationLink = `http://localhost:${PORT}/auth/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: "Verify your email address - TaskTrack",
        text: `Please verify your email address by clicking the link: ${verificationLink}`,
        html: `<p>Please verify your email address by clicking the link below:</p>
           <p><a href="${verificationLink}">${verificationLink}</a></p>`,
    };
    await transporter.sendMail(mailOptions);
}
//# sourceMappingURL=email.js.map