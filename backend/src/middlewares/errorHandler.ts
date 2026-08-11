import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Centralized Error Log:", err);

  if (err && typeof err.statusCode === "number") {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.details || undefined,
    });
  }

  if (err.name === "SequelizeValidationError") {
    const details = err.errors.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      message: "Validation failed",
      errors: details,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    const details = err.errors.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(409).json({
      message: err.message || "Conflict occurred",
      errors: details,
    });
  }

  return res.status(500).json({
    message: "Internal Server Error",
  });
};
