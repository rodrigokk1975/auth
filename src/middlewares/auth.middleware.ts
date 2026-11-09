import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { TokenPayload } from "../types/auth.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization format. Format must be 'Bearer <token>'" });
    return;
  }

  const token = parts[1];
  if (!token) {
    res.status(401).json({ error: "Token not provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as TokenPayload;
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Invalid token" });
  }
}
