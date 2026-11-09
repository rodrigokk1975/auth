import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "../database/db.js";
import { env } from "../config/env.js";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}

export class AuthService {
  private get db() {
    return getDatabase();
  }

  async register(data: RegisterDTO): Promise<Omit<User, "password">> {
    const existingUser = this.db
      .prepare<[string], User>("SELECT id, name, email, created_at FROM users WHERE email = ?")
      .get(data.email);

    if (existingUser) {
      const error = new Error("Email already registered");
      (error as Error & { statusCode: number }).statusCode = 409;
      throw error;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const insertStmt = this.db.prepare<[string, string, string]>(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    );

    const result = insertStmt.run(data.name, data.email, hashedPassword);
    const userId = Number(result.lastInsertRowid);

    const createdUser = this.db
      .prepare<[number], Omit<User, "password">>(
        "SELECT id, name, email, created_at FROM users WHERE id = ?"
      )
      .get(userId);

    if (!createdUser) {
      throw new Error("Failed to retrieve created user");
    }

    return createdUser;
  }

  async login(credentials: LoginDTO): Promise<AuthResponse> {
    const user = this.db
      .prepare<[string], User & { password: string }>(
        "SELECT id, name, email, password, created_at FROM users WHERE email = ?"
      )
      .get(credentials.email);

    if (!user) {
      const error = new Error("Invalid email or password");
      (error as Error & { statusCode: number }).statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(credentials.password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid email or password");
      (error as Error & { statusCode: number }).statusCode = 401;
      throw error;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, signOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }
}

export const authService = new AuthService();
