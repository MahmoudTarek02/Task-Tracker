import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err && typeof err.statusCode === "number") {
    logger.warn(`Operational Error: ${err.message}`, { statusCode: err.statusCode, details: err.details });
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
    logger.warn(`Sequelize Validation Error: ${err.message}`, { details });
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
    logger.warn(`Sequelize Unique Constraint Error: ${err.message}`, { details });
    return res.status(409).json({
      message: err.message || "Conflict occurred",
      errors: details,
    });
  }

  logger.error("Unhandled Internal Server Error:", {
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    message: "Internal Server Error",
  });
};
