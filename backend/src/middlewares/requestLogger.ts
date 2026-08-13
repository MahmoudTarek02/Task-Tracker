import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now(); // time when the request starts

  // when request is finished, and sent back to client
  // the finish event is emitted when the response has been sent
  // here we log the request and response info
  // and calculate the duration of the request
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2); // request duration in milliseconds
    // log request method, url, status code, and duration
    logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: parseFloat(duration),
    });
  });

  // call the next middleware or route handler
  next();
};
