import { Request, Response } from "express";
import authService from "./auth.service";

class AuthController {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;

    const user = await authService.register(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  }
}

export default new AuthController();