import express, { type Request, type Response } from "express";
import authRoutes from "./routes/auth.routes.js";
import { notFoundHandler, errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);

// Rota 404 para endpoints inexistentes
app.use(notFoundHandler);

// Middleware global de tratamento de erros
app.use(errorMiddleware);

export default app;
