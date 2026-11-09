import bcrypt from "bcryptjs";
import { getDatabase } from "../database/db.js";

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
}

export const authService = new AuthService();
