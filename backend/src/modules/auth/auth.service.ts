import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../database/models/user.model";
import { sendVerificationEmail } from "../../config/email";

class AuthService {
  async register(name: string, email: string, password: string) {
    email = email.toLowerCase();
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const verificationToken = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });

    // Send email verification link
    await sendVerificationEmail(email, verificationToken);

    return {
      id: user.getDataValue("id"),
      name: user.getDataValue("name"),
      email: user.getDataValue("email"),
    };
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({
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
}

export default new AuthService();