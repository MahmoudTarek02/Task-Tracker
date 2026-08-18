import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../../database/models";
import { sendVerificationEmail } from "../../config/email";
import { ConflictError, BadRequestError, UnauthorizedError } from "../../utils/errors";

class AuthService {
  async register(name: string, email: string, password: string) {
    email = email.toLowerCase();
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("Email already exists");
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
      throw new BadRequestError("Invalid or expired verification token");
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

  async login(email: string, password: string) {
    email = email.toLowerCase();
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.getDataValue("password"));
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign(
      {
        id: user.getDataValue("id"),
        email: user.getDataValue("email"),
        name: user.getDataValue("name"),
      },
      secret,
      { expiresIn: "24h" }
    );

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

export default new AuthService();