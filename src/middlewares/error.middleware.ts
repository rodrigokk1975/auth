import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app.error.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    res.status(400).json({ errors });
    return;
  }

  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
