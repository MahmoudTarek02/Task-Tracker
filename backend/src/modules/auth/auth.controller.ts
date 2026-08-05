import { Request, Response } from "express";
import authService from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";

class AuthController {
  async register(req: Request, res: Response) {
    const result = registerSchema.safeParse(req.body);

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
      const user = await authService.register(name, email, password);

      return res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Registration failed",
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    try {
      const user = await authService.verifyEmail(token);

      return res.status(200).json({
        message: "Email verified successfully",
        user,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Email verification failed",
      });
    }
  }

  async login(req: Request, res: Response) {
    const result = loginSchema.safeParse(req.body);

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
      const { user, token } = await authService.login(email, password);

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
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Login failed",
      });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({
      message: "Sign out successful",
    });
  }

  async me(req: Request, res: Response) {
    // so typescript doesn't show error if user is not in req
    const authReq = req as any;
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

export default new AuthController();