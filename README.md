# Jukwaa Live

**Kenya is live.** Jukwaa Live is a Kenyan-first livestreaming platform prototype. Stage 4 adds real user profiles, creator onboarding, owned channels, and public channel pages while preserving fictional streams, creators, clips, chat, analytics, and earnings as demo content.

## Technology

- React 19, Vite, TypeScript, Tailwind CSS 4, React Router, and Lucide React
- NestJS 11, Prisma 7, and PostgreSQL
- Argon2id password hashing and database-backed opaque sessions

## Run the full stack locally

Requires Node.js 20.19+, npm, and PostgreSQL. Docker Compose can provide PostgreSQL when Docker is installed.

```bash
cp .env.example .env
cd backend
cp .env.example .env
npm install
docker compose up -d postgres
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

In a second terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend uses `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`) and sends cookies with `credentials: "include"`. No backend secret belongs in a `VITE_*` variable.

Register at `/register`. In development console-email mode, copy the clearly labelled verification URL from the backend terminal. After verification, open `/dashboard` to create a unique channel. Real channels use `/channel/:slug`; profile and channel details can be edited in `/settings`.

## Quality checks

```bash
npm run typecheck
npm run build
cd backend
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run test
npm run test:e2e
npm run build
```

Real database integration tests require migrated PostgreSQL and `RUN_DATABASE_INTEGRATION_TESTS=true`; see [backend/README.md](backend/README.md).

## Stage 4 scope

Real account authentication, editable profiles, verified-user creator onboarding, creator/channel ownership, creator zero states, and public channel lookup are implemented. Usernames and channel slugs are read-only after creation. Real streaming/chat/follows/analytics, OAuth, 2FA, M-Pesa, payments, ads, monetisation, and payouts are intentionally deferred.
