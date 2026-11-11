# Auth API 🔐

API RESTful completa de autenticação desenvolvida com **Node.js**, **Express**, **TypeScript**, **SQLite** e **JSON Web Tokens (JWT)**, focada em boas práticas de arquitetura, segurança e testes automatizados para portfólio.

---

## 🎯 Objetivo & Funcionalidades

O projeto implementa o ciclo completo de autenticação e proteção de rotas:

- **Cadastro de Usuários (`POST /auth/register`)**:
  - Validação estrita de dados com schemas do **Zod** (nome, formato de e-mail e tamanho mínimo de senha).
  - Criptografia irreversível de senhas com salting usando **bcryptjs** (10 salt rounds). Senhas puras nunca chegam ao banco.
  - Prevenção de e-mails duplicados com resposta semântica `409 Conflict`.
  - Retorno sanitizado do usuário cadastrado (campo `password` completamente omitido).
- **Autenticação & Login (`POST /auth/login`)**:
  - Verificação segura do hash da senha via `bcrypt.compare`.
  - Resposta unificada para credenciais inválidas (`401 Unauthorized`), impedindo enumeração maliciosa de e-mails.
  - Emissão de **JSON Web Token (JWT)** assinado digitalmente com payload customizado (`sub`, `email`, `name`) e tempo de expiração configurável.
- **Rota Protegida (`GET /auth/me`)**:
  - Middleware de autenticação que intercepta e valida o header `Authorization: Bearer <token>`.
  - Injeção tipada dos dados do usuário na requisição (`req.user`) via TypeScript Declaration Merging.
  - Bloqueio imediato de tokens inexistentes, malformatados, adulterados ou expirados.
- **Tratamento Centralizado de Erros**:
  - Hierarquia de classes de erro (`AppError`, `BadRequestError`, `UnauthorizedError`, `ConflictError`, `NotFoundError`).
  - Middleware global de erros interceptando exceções de forma assíncrona com **Express 5**.
  - Handler para rotas inexistentes (`404 Route not found`).
- **Testes Automatizados de Ponta a Ponta**:
  - 16 testes de integração cobrindo os cenários essenciais (sucesso, erros de validação, senhas inválidas, unicidade e tokens expirados/adulterados) com **Vitest** e **Supertest**.
  - Banco de dados em memória (`:memory:`) isolado a cada teste.

---

## 🛠️ Tecnologias e Decisões Técnicas

| Tecnologia | Finalidade | Por que foi escolhida? |
| :--- | :--- | :--- |
| **Node.js** (v18+) | Ambiente de execução | Plataforma moderna, não bloqueante e com suporte a ESM nativo. |
| **TypeScript** | Linguagem tipada | Tipagem estrita com `exactOptionalPropertyTypes` e verificação estática de tipos. |
| **Express 5** | Framework HTTP | Tratamento nativo de rejeições de Promises em middlewares e controllers sem boilerplate. |
| **better-sqlite3** | Banco de dados | Demonstração de **SQL puro** (DDL/DML) e prepared statements contra SQL Injection. |
| **Zod** | Validação de dados | Validação em runtime e inferência automática de tipos estáticos TypeScript. |
| **bcryptjs** | Hash de senhas | Criptografia com salting 100% JavaScript, sem dependência de ferramentas de build C++. |
| **jsonwebtoken** | Emissão de tokens | Padrão clássico da indústria para geração e verificação de tokens JWT. |
| **express-rate-limit** | Segurança contra força bruta | Proteção de endpoints sensíveis contra requisições excessivas por IP. |
| **Vitest + Supertest** | Testes automatizados | Execução de testes de integração sem necessidade de abrir portas reais de rede. |
| **tsx** | Execução em dev | Compilação ultrarrápida com esbuild e hot-reload integrado. |

---

## 📁 Estrutura de Pastas

```text
auth/
├── src/
│   ├── app.ts                  # Configuração do Express, rotas e middlewares
│   ├── server.ts               # Inicialização do listener HTTP e banco de dados
│   ├── config/
│   │   └── env.ts              # Validação e centralização das variáveis de ambiente
│   ├── database/
│   │   └── db.ts               # Conexão SQLite, pragmas WAL e tabela users em SQL
│   ├── errors/
│   │   └── app.error.ts        # Hierarquia de classes de erro customizadas
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # Validação do header Bearer JWT
│   │   ├── error.middleware.ts      # Tratamento global de erros e 404
│   │   └── rate-limit.middleware.ts # Proteção contra ataques de força bruta
│   ├── controllers/
│   │   └── auth.controller.ts  # Recebe requisições, valida esquemas e responde HTTP
│   ├── services/
│   │   └── auth.service.ts     # Regras de negócio, hash, queries e geração de token
│   ├── routes/
│   │   └── auth.routes.ts      # Definição das rotas e injeção dos middlewares
│   └── types/
│       ├── auth.ts             # Tipos do payload do JWT
│       └── express.d.ts        # Extensão da interface Request do Express
├── tests/
│   └── auth.test.ts            # Suíte de 16 testes de integração com Vitest
├── .env.example                # Modelo de variáveis de ambiente sem segredos reais
├── .gitignore                  # Arquivos ignorados (node_modules, .env, bancos SQLite)
├── LICENSE                     # Licença ISC do projeto
├── package.json                # Dependências e scripts do projeto
├── tsconfig.json               # Configuração do compilador TypeScript
└── README.md                   # Documentação completa do projeto
```

---

## 🚀 Como Instalar e Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior instalado.
- [Git](https://git-scm.com/) instalado.

### 1. Clonar o repositório
```bash
git clone https://github.com/rodrigokk1975/auth.git
cd auth
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as variáveis de ambiente
Copie o arquivo de exemplo para criar o seu `.env`:
```bash
cp .env.example .env
```

Conteúdo padrão do `.env`:
```ini
PORT=3000
JWT_SECRET=super_secret_jwt_key_for_development
JWT_EXPIRES_IN=1h
```

### 4. Executar o servidor em desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3000`.

### 5. Compilar e rodar a versão de produção
```bash
npm run build
npm start
```

---

## 🧪 Como Executar os Testes

Para executar a suíte completa de 15 testes automatizados de integração:

```bash
npm test
```

Os testes utilizam banco de dados em memória isolado (`:memory:`), executando em menos de 2 segundos sem alterar o banco de desenvolvimento.

---

## 📖 Documentação da API & Exemplos de Uso

### 1. Health Check
Verifica se a API está online e respondendo.

- **Rota:** `GET /health`
- **Exemplo de Requisição (curl):**
```bash
curl -X GET http://localhost:3000/health
```
- **Resposta Sucesso (`200 OK`):**
```json
{
  "status": "ok"
}
```

---

### 2. Cadastro de Usuário
Cria uma nova conta no sistema com validação e hash de senha.

- **Rota:** `POST /auth/register`
- **Cabeçalho:** `Content-Type: application/json`
- **Exemplo de Requisição (curl):**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rodrigo Silva",
    "email": "rodrigo@example.com",
    "password": "senha_segura_123"
  }'
```
- **Resposta Sucesso (`201 Created`):**
```json
{
  "user": {
    "id": 1,
    "name": "Rodrigo Silva",
    "email": "rodrigo@example.com",
    "created_at": "2026-11-09 15:30:00"
  }
}
```
- **Resposta Erro de Validação (`400 Bad Request`):**
```json
{
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 6 characters long" }
  ]
}
```
- **Resposta Conflito de E-mail (`409 Conflict`):**
```json
{
  "error": "Email already registered"
}
```

---

### 3. Login & Emissão de JWT
Autentica o usuário e retorna o token de acesso.

- **Rota:** `POST /auth/login`
- **Cabeçalho:** `Content-Type: application/json`
- **Exemplo de Requisição (curl):**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rodrigo@example.com",
    "password": "senha_segura_123"
  }'
```
- **Resposta Sucesso (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Rodrigo Silva",
    "email": "rodrigo@example.com",
    "created_at": "2026-11-09 15:30:00"
  }
}
```
- **Resposta Credenciais Inválidas (`401 Unauthorized`):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 4. Meu Perfil (Rota Protegida)
Retorna os dados do usuário logado a partir do token JWT.

- **Rota:** `GET /auth/me`
- **Cabeçalho:** `Authorization: Bearer <SEU_TOKEN_JWT>`
- **Exemplo de Requisição (curl):**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
- **Resposta Sucesso (`200 OK`):**
```json
{
  "user": {
    "id": 1,
    "name": "Rodrigo Silva",
    "email": "rodrigo@example.com",
    "created_at": "2026-11-09 15:30:00"
  }
}
```
- **Resposta Token Ausente (`401 Unauthorized`):**
```json
{
  "error": "Authorization header missing"
}
```
- **Resposta Token Expirado ou Inválido (`401 Unauthorized`):**
```json
{
  "error": "Invalid token"
}
```

---

## 🛡️ Segurança e Boas Práticas

1. **Separação de Responsabilidades (Layered Architecture)**:
   - Rotas definem endpoints e middlewares.
   - Controllers lidam com input HTTP e formatação de resposta.
   - Services contêm regras de negócio e orquestram persistência e criptografia.
   - Database centraliza conexões e queries SQL puras.
2. **Prevenção contra SQL Injection**:
   - Todas as queries parametrizadas com placeholders (`?`) do `better-sqlite3`.
3. **Criptografia Forte**:
   - Hashing com `bcrypt` (10 rounds de salt) para proteção contra ataques de força bruta e rainbow tables.
4. **Proteção contra Enumeração e Timing Attacks**:
   - Respostas de erro idênticas (`Invalid email or password`) para e-mails inexistentes e senhas incorretas.
   - Amortização de tempo com hash fictício (`DUMMY_HASH`) garantindo que `bcrypt.compare` sempre execute mesmo quando o e-mail não for encontrado, eliminando diferenças no tempo de resposta HTTP.
5. **Rate Limiting contra Força Bruta**:
   - Middleware `express-rate-limit` aplicado nas rotas sensíveis de login e cadastro.
6. **Prevenção de Condições de Corrida**:
   - Tratamento da constraint de unicidade (`SQLITE_CONSTRAINT_UNIQUE`) no cadastro para garantir resposta `409 Conflict` consistente mesmo em requisições paralelas.
7. **Respeito ao Princípio do Menor Privilégio no Git**:
   - `.env` e arquivos de banco de dados (`*.sqlite`, `*.db`) protegidos no `.gitignore`.
8. **Desacoplamento Server / App**:
   - O `server.ts` cuida da porta e rede, enquanto `app.ts` exporta a instância do Express, permitindo testes sem overhead de portas.

---

## 📜 Histórico de Commits (Conventional Commits)

```text
* f9bd14a fix: add rate limiting, timing attack mitigation, xss sanitization and strict env validation
* 2d239f2 feat: add web interface to test authentication flow
* c732aa9 docs: complete README with setup and usage examples
* 508ceac test: add integration tests for auth flow
* be692d5 refactor: centralize error handling
* d303a67 feat: add auth middleware and protected profile route
* c6ece88 feat: add login endpoint with JWT generation
* 17a6356 feat: add user registration with password hashing
* d9c131e feat: add sqlite connection and users table
* 5bd6277 feat: add express server with health check route
* f765624 chore: initialize project with TypeScript and basic documentation
```

---

## 📄 Licença

Este projeto é desenvolvido para fins de estudo e portfólio sob a licença [ISC](LICENSE).
