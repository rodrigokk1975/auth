import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rate-limit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, (req, res) => authController.register(req, res));
router.post("/login", authRateLimiter, (req, res) => authController.login(req, res));
router.get("/me", authMiddleware, (req, res) => authController.profile(req, res));

export default router;
