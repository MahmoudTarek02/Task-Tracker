import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../../database/models";
import { sendVerificationEmail } from "../../config/email";
import { ConflictError, BadRequestError, UnauthorizedError } from "../../utils/errors";
import { config } from "../../config/env";

class AuthService {
  async register(name: string, email: string, password: string) {
    email = email.toLowerCase();
    
    // when testing in auth.service.test.ts
    // testing: should successfully register a user, hash password, and send verification email

    // this line will not hit the real database
    // here spyOn(User, "findOne").mockResolvedValue(null); is called. so this line will not hit the real database
    // and it will return null, and the code will proceed
    const existingUser = await User.findOne({
      where: { email },
    });

    // existingUser will be null in this test case 
    if (existingUser) {
      throw new ConflictError("Email already exists");
    }

    // not mocked, will run normally
    const verificationToken = crypto.randomUUID();
    
    // mocked
    // will return "hashed_password" instead of actually hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // mocked 
    // User.create is mocked using vi.spyOn(User, "create").mockResolvedValue(mockUser as any);
    // so it will not hit the real database
    // instead it will return mockUser object

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

    // Normally, this will hit the real database, and update the user in the real database
    
    // but in testing, 
    // user object is mocked, and it will call the update() method on the mock user object
    // as specified in test case, mockUpdate is defined using vi.fn().mockResolvedValue(undefined)
    // which will just record the call and return undefined without actually updating any database
    // arguments passed here will also be tested later with expect(mockUpdate).toHaveBeenCalledWith({ ... })
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

    const token = jwt.sign(
      {
        id: user.getDataValue("id"),
        email: user.getDataValue("email"),
        name: user.getDataValue("name"),
      },
      config.jwtSecret,
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