import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req[source]);
    if (!result.success) {
      return next(new ValidationError(result.error));
    }
    
    if (source === "body") {
      req.body = result.data;
    } else {
      const target = req[source] as any;
      for (const key in target) {
        delete target[key];
      }
      Object.assign(target, result.data);
    }
    
    next();
  };
};
