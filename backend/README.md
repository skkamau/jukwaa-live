# Jukwaa API

NestJS and PostgreSQL backend foundation for Jukwaa Live. Stage 2 adds Prisma ORM, migrations, database health, and the initial identity/creator/channel schema while the existing React frontend remains mock-driven.

## Technology

- Node.js 20.19 or newer
- NestJS 11 and TypeScript
- PostgreSQL 17 for the optional local Docker environment
- Prisma ORM 7 with the `pg` driver through `@prisma/adapter-pg`
- NestJS ConfigModule with strict startup environment validation
- Helmet, controlled CORS, bounded request parsing, and global DTO validation
- Jest and Supertest for deterministic unit and HTTP tests

Authentication, passwords, JWTs, streaming, payments, and other product modules are not included.

## Structure

```text
backend/
  prisma/
    migrations/             Reviewed PostgreSQL migration history
    schema.prisma           User, CreatorProfile, and Channel schema
    seed.ts                 Explicit development-only seed
  src/
    common/filters/         Central HTTP error responses
    config/                 Application configuration and validation
    database/               Global DatabaseModule and Prisma lifecycle
    generated/prisma/       Generated client; local-only and Git-ignored
    health/                 API and database health endpoint
    app.module.ts
    app.setup.ts
    main.ts
  test/
    health.e2e-spec.ts
    database.integration-spec.ts
  compose.yaml              Optional local PostgreSQL service
  prisma.config.ts          Prisma CLI, migration, and seed configuration
```

## Environment

Copy `.env.example` to `.env`. The committed URL contains development-only credentials; replace it for any non-local environment.

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://jukwaa:jukwaa_dev_only@localhost:5432/jukwaa_dev
```

`DATABASE_URL` is required and must use the `postgresql://` or `postgres://` scheme. It is never logged or returned by the health endpoint. A production environment must also provide `FRONTEND_ORIGIN` explicitly.

## Local PostgreSQL

Docker is optional. Any standard PostgreSQL provider can be used by supplying its normal connection URL.

With Docker available:

```bash
cd backend
docker compose up -d postgres
docker compose ps
```

The Compose service uses the PostgreSQL 17 major release, a named persistent volume, a health check, and development-only credentials matching `.env.example`.

Stop the service without deleting its data:

```bash
docker compose stop postgres
```

## Installation and Prisma Client

```bash
cd backend
npm install
npm run prisma:validate
npm run prisma:generate
```

Prisma 7 generates its CommonJS-compatible client into `src/generated/prisma`. Generated code is not committed and must be regenerated after schema or dependency changes.

## Migrations

Create and apply a migration during development:

```bash
npm run db:migrate -- --name describe_the_change
```

`prisma migrate dev` compares the development database with the Prisma schema, creates a new migration, and applies it. It is a development workflow and may require a shadow database.

Apply already-reviewed migrations in production or CI:

```bash
npm run db:migrate:deploy
```

`prisma migrate deploy` only applies committed migration files. It does not create migrations, reset the schema, or seed data. Production startup does not automatically run destructive migration commands.

## Development seed

After applying migrations:

```bash
npm run db:seed
```

The seed is explicit, idempotent where practical, and refuses to run when `NODE_ENV=production`. It creates two fictional users, one creator profile, and one channel, then verifies the `User -> CreatorProfile -> Channel` relation. It does not create passwords or financial data.

## Prisma Studio

```bash
npm run db:studio
```

Studio uses the configured `DATABASE_URL`; do not expose it publicly or use production credentials casually.

## Identity normalization

Stage 3 must trim and lowercase email, username, and channel slug values before writing them. The initial migration reinforces that rule with PostgreSQL check constraints, while unique indexes prevent duplicate normalized identities. This avoids identities that differ only by accidental capitalization without adding provider-specific identity logic to the application.

## Run the backend

```bash
npm run start:dev
```

- Backend: `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/api/v1/health`

The health endpoint performs a lightweight `SELECT 1`. It returns `checks.database: "up"` when PostgreSQL responds and HTTP 503 with `checks.database: "down"` otherwise. Database connection details and internal query errors are never included.

Production build and start:

```bash
npm run prisma:generate
npm run build
npm run db:migrate:deploy
npm run start:prod
```

## Tests and quality checks

Deterministic checks do not require a running PostgreSQL server:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

They mock database connectivity where appropriate and cover configuration validation, Prisma lifecycle, and database-up/database-down health behavior.

The optional database integration suite verifies real relations and uniqueness constraints after migrations are applied:

PowerShell:

```powershell
$env:RUN_DATABASE_INTEGRATION_TESTS='true'
npm run test:db
```

Bash:

```bash
RUN_DATABASE_INTEGRATION_TESTS=true npm run test:db
```

Without `RUN_DATABASE_INTEGRATION_TESTS=true`, that suite is skipped and never contacts PostgreSQL.

## Run the full local stack

Use three terminals from the repository root.

Terminal 1 — PostgreSQL:

```bash
cd backend
docker compose up -d postgres
npm run db:migrate:deploy
npm run db:seed
```

Terminal 2 — backend:

```bash
cd backend
npm run prisma:generate
npm run start:dev
```

Terminal 3 — existing frontend:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3000`

The frontend still uses local mock data in Stage 2 and never connects directly to PostgreSQL.

## Production safety

- Real `.env` files and generated Prisma clients are Git-ignored.
- Migrations are version-controlled and reviewed before deployment.
- Development seeds refuse production execution and never run automatically.
- No schema reset or destructive migration command is provided.
- Database URLs, credentials, and internal database errors must never be logged.
- Logs must also exclude passwords, JWTs, refresh tokens, stream keys, M-Pesa credentials, and payment secrets.
