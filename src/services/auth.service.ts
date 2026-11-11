import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "../database/db.js";
import { env } from "../config/env.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../errors/app.error.js";

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

// Hash bcrypt fictício pré-computado (10 rounds) para amortizar o tempo quando o usuário não existe,
// prevenindo enumeração de contas via análise de tempo (timing attacks).
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export class AuthService {
  private get db() {
    return getDatabase();
  }

  async register(data: RegisterDTO): Promise<Omit<User, "password">> {
    const existingUser = this.db
      .prepare<[string], User>("SELECT id, name, email, created_at FROM users WHERE email = ?")
      .get(data.email);

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const insertStmt = this.db.prepare<[string, string, string]>(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    );

    let userId: number;
    try {
      const result = insertStmt.run(data.name, data.email, hashedPassword);
      userId = Number(result.lastInsertRowid);
    } catch (err: unknown) {
      // Captura condição de corrida se dois registros com o mesmo e-mail ocorrerem simultaneamente
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        throw new ConflictError("Email already registered");
      }
      throw err;
    }

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

    // Sempre executa bcrypt.compare para garantir tempo de resposta uniforme (mitiga timing attacks)
    const passwordToCompare = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(credentials.password, passwordToCompare);

    if (!user || !isMatch) {
      throw new UnauthorizedError("Invalid email or password");
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

  async getProfile(userId: number): Promise<Omit<User, "password">> {
    const user = this.db
      .prepare<[number], Omit<User, "password">>(
        "SELECT id, name, email, created_at FROM users WHERE id = ?"
      )
      .get(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
