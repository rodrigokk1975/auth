import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type NonUndefined<T> = T extends undefined ? never : T;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET. Please define it in your .env file.");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || "1h") as NonUndefined<SignOptions["expiresIn"]>,
};
