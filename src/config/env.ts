import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type NonUndefined<T> = T extends undefined ? never : T;

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_in_production",
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || "1h") as NonUndefined<SignOptions["expiresIn"]>,
};
