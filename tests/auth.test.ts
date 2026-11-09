import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { getDatabase, closeDatabase } from "../src/database/db.js";

describe("Auth API - Integration Tests", () => {
  beforeAll(() => {
    // Inicializa banco em memória para isolar os testes
    closeDatabase();
    getDatabase(":memory:");
  });

  beforeEach(() => {
    // Limpa a tabela users antes de cada teste
    const db = getDatabase();
    db.exec("DELETE FROM users;");
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("GET /health", () => {
    it("deve responder com status 200 e status: ok", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("POST /auth/register", () => {
    it("deve cadastrar um novo usuário com sucesso e retornar 201", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "João Silva",
          email: "joao@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.name).toBe("João Silva");
      expect(response.body.user.email).toBe("joao@example.com");
      expect(response.body.user.created_at).toBeDefined();
      expect(response.body.user.password).toBeUndefined(); // Nunca deve expor a senha
    });

    it("deve retornar 400 se o email for inválido", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "João Silva",
          email: "email-invalido",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: { field: string }) => e.field === "email")).toBe(true);
    });

    it("deve retornar 400 se o nome tiver menos de 2 caracteres", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "J",
          email: "joao@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors.some((e: { field: string }) => e.field === "name")).toBe(true);
    });

    it("deve retornar 400 se a senha tiver menos de 6 caracteres", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          name: "João Silva",
          email: "joao@example.com",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors.some((e: { field: string }) => e.field === "password")).toBe(true);
    });

    it("deve retornar 409 ao tentar cadastrar o mesmo email duas vezes", async () => {
      const payload = {
        name: "João Silva",
        email: "joao@example.com",
        password: "password123",
      };

      await request(app).post("/auth/register").send(payload);
      const duplicateResponse = await request(app).post("/auth/register").send(payload);

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body).toEqual({ error: "Email already registered" });
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/register").send({
        name: "Maria Santos",
        email: "maria@example.com",
        password: "securepassword",
      });
    });

    it("deve autenticar com sucesso e retornar token JWT e dados do usuário", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "maria@example.com",
          password: "securepassword",
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTypeOf("string");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("maria@example.com");
      expect(response.body.user.password).toBeUndefined();
    });

    it("deve retornar 401 ao enviar senha incorreta", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "maria@example.com",
          password: "senhaincorreta",
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Invalid email or password" });
    });

    it("deve retornar 401 para email não cadastrado", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "naoexiste@example.com",
          password: "qualquersenha",
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Invalid email or password" });
    });

    it("deve retornar 400 se faltar campo obrigatório no login", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "maria@example.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /auth/me - Rota Protegida", () => {
    let validToken: string;

    beforeEach(async () => {
      await request(app).post("/auth/register").send({
        name: "Carlos Lima",
        email: "carlos@example.com",
        password: "mypassword123",
      });

      const loginRes = await request(app).post("/auth/login").send({
        email: "carlos@example.com",
        password: "mypassword123",
      });

      validToken = loginRes.body.token;
    });

    it("deve retornar os dados do perfil ao enviar token válido", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.name).toBe("Carlos Lima");
      expect(response.body.user.email).toBe("carlos@example.com");
      expect(response.body.user.password).toBeUndefined();
    });

    it("deve retornar 401 se o header Authorization não for fornecido", async () => {
      const response = await request(app).get("/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Authorization header missing" });
    });

    it("deve retornar 401 se o header Authorization não usar o prefixo Bearer", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Token ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Invalid authorization format. Format must be 'Bearer <token>'",
      });
    });

    it("deve retornar 401 para token inválido ou adulterado", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token_falso_adulterado");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Invalid token" });
    });
  });

  describe("Tratamento de Rota Inexistente (404)", () => {
    it("deve responder 404 Route not found para rotas não mapeadas", async () => {
      const response = await request(app).get("/rota-inexistente");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Route not found" });
    });
  });
});
