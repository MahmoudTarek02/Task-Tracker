import { Request, Response } from "express";
import authService from "./auth.service";
import { UnauthorizedError } from "../../utils/errors";

class AuthController {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const user = await authService.register(name, email, password);
    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.query as { token: string };
    const user = await authService.verifyEmail(token);
    return res.status(200).json({
      message: "Email verified successfully",
      user,
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user,
    });
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
    const authReq = req as any;
    if (!authReq.user) {
      throw new UnauthorizedError("Not authenticated");
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