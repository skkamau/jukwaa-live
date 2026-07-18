# Jukwaa API

Stage 1 backend foundation for Jukwaa Live. This is an independent NestJS and TypeScript application that runs alongside the existing React frontend.

## Technology

- Node.js 20 or newer
- NestJS 11
- TypeScript
- NestJS ConfigModule with startup environment validation
- Helmet, controlled CORS, and bounded request body parsing
- class-validator and class-transformer through a global validation pipe
- Jest and Supertest for endpoint testing

No database, authentication, streaming provider, WebSocket service, or payment integration is included in Stage 1.

## Structure

```text
backend/
  src/
    common/filters/       Central HTTP error responses
    config/               Typed application configuration and validation
    health/               Health endpoint module
    app.module.ts         Root NestJS module
    app.setup.ts          Shared HTTP middleware and global application setup
    main.ts               Application bootstrap
  test/                   Health endpoint integration test
  .env.example            Safe local environment template
```

## Installation and environment

From the repository root:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`, then set values appropriate for the environment. Never commit `.env`.

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

`NODE_ENV` must be `development`, `test`, or `production`. `PORT` must be a valid TCP port and `FRONTEND_ORIGIN` must be an HTTP or HTTPS URL. A production deployment must explicitly provide `FRONTEND_ORIGIN`.

## Run the backend

```bash
npm run start:dev
```

- Backend: `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/api/v1/health`

Production build and start:

```bash
npm run build
npm run start:prod
```

## Quality checks

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

Use `npm run format` to apply the repository's backend formatting rules.

## Run frontend and backend together

Use two terminals from the repository root.

Terminal 1 — existing frontend:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Terminal 2 — backend:

```bash
cd backend
npm install
npm run start:dev
```

Backend: `http://localhost:3000`

The frontend remains mock-driven in Stage 1 and does not call the backend yet.

## Logging rule

NestJS logs startup state, the environment, the listening port, and unexpected failures. Logs must never include passwords, JWTs, refresh tokens, stream keys, M-Pesa credentials, payment secrets, or other sensitive values.
