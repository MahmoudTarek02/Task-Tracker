import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticateToken } from "../middlewares/auth.middleware";
import { errorHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate.middleware";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";
import jwt from "jsonwebtoken";
import { z } from "zod";

// test cases:
// 1. UnauthorizedError
// 2. Success Path
// 3. ForbiddenError
describe("auth.middleware", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { cookies: {} };
    res = {};
    next = vi.fn();
  });

  it("should throw UnauthorizedError if no token cookie exists", () => {
    expect(() => authenticateToken(req, res, next)).toThrowError(
      new UnauthorizedError("Access denied. No token provided.")
    );
  });

  it("should verify a valid token and append decoded user to req", () => {
    req.cookies.token = "valid_token";
    const mockDecoded = { id: "user_123", email: "test@example.com" };
    vi.spyOn(jwt, "verify").mockReturnValue(mockDecoded as any);

    authenticateToken(req, res, next);

    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
  });

  it("should throw ForbiddenError if token verification fails", () => {
    req.cookies.token = "invalid_token";
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    expect(() => authenticateToken(req, res, next)).toThrowError(
      new ForbiddenError("Invalid or expired token.")
    );
  });
});

// test cases:
// 1. NotFoundError
// 2. ValidationError
// 3. SequelizeValidationError
// 4. SequelizeUniqueConstraintError
// 5. Internal Server Error
describe("errorHandler middleware", () => {
  let req: any;
  let res: any;
  let next: any;

  // creates new req, res, next for each test case
  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(), // mockReturnThis allows to chain methods like res.status(404).json(...) 
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn(); // do nothing
  });

  it("should format custom operational AppError", () => {
    const error = new NotFoundError("Resource not found");
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Resource not found",
      errors: undefined,
    });
  });

  it("should format custom ValidationError", () => {
    const zodError = z.string().email().safeParse("invalid-email").error!;
    const error = new ValidationError(zodError);
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenLastCalledWith({
      message: "Validation failed",
      errors: [
        {
          field: "",
          message: "Invalid email address",
        },
      ],
    });
  });

  it("should format SequelizeValidationError", () => {
    const error: any = new Error("Sequelize validation failed");
    error.name = "SequelizeValidationError";
    error.errors = [{ path: "email", message: "email is invalid" }];

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Validation failed",
      errors: [{ field: "email", message: "email is invalid" }],
    });
  });

  it("should format SequelizeUniqueConstraintError", () => {
    const error: any = new Error("Sequelize unique constraint failed");
    error.name = "SequelizeUniqueConstraintError";
    error.errors = [{ path: "email", message: "email must be unique" }];

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Sequelize unique constraint failed",
      errors: [{ field: "email", message: "email must be unique" }],
    });
  });

  it("should format general unhandled error as 500 Internal Server Error", () => {
    const error = new Error("Something went wrong");
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
  });
});

// test cases
// 1. Success Path
// 2. Validation Error
describe("validate middleware", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = vi.fn();
  });

  it("should call next() if schema parses successfully", async () => {
    const schema = z.object({ email: z.string().email() });
    req.body = { email: "test@example.com" };

    const middleware = validate(schema, "body");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: "test@example.com" });
  });

  it("should call next(ValidationError) if schema validation fails", async () => {
    const schema = z.object({ email: z.string().email() });
    req.body = { email: "invalid-email" };

    const middleware = validate(schema, "body");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
