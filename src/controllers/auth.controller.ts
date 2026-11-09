import { type Request, type Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service.js";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const parsedBody = registerSchema.safeParse(req.body);

      if (!parsedBody.success) {
        const errors = parsedBody.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({ errors });
        return;
      }

      const user = await authService.register(parsedBody.data);
      res.status(201).json({ user });
    } catch (err: unknown) {
      const errorWithStatus = err as Error & { statusCode?: number };
      const statusCode = errorWithStatus.statusCode ?? 500;
      res.status(statusCode).json({ error: errorWithStatus.message ?? "Internal server error" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const parsedBody = loginSchema.safeParse(req.body);

      if (!parsedBody.success) {
        const errors = parsedBody.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({ errors });
        return;
      }

      const result = await authService.login(parsedBody.data);
      res.status(200).json(result);
    } catch (err: unknown) {
      const errorWithStatus = err as Error & { statusCode?: number };
      const statusCode = errorWithStatus.statusCode ?? 500;
      res.status(statusCode).json({ error: errorWithStatus.message ?? "Internal server error" });
    }
  }

  async profile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await authService.getProfile(req.user.sub);
      res.status(200).json({ user });
    } catch (err: unknown) {
      const errorWithStatus = err as Error & { statusCode?: number };
      const statusCode = errorWithStatus.statusCode ?? 500;
      res.status(statusCode).json({ error: errorWithStatus.message ?? "Internal server error" });
    }
  }
}

export const authController = new AuthController();
