# Jukwaa API

NestJS, Prisma, and PostgreSQL API for Jukwaa Live. Stage 3 implements public email/password authentication with database-backed opaque sessions.

## Authentication architecture

- Passwords are hashed by a dedicated service with Argon2id (`memoryCost=19456 KiB`, `timeCost=2`, `parallelism=1`). Passwords are 12–128 characters, are never trimmed, and are never logged or serialized.
- Every login creates an independent `AuthSession`. A cryptographically random 32-byte raw token is sent only in the `jukwaa_session` cookie; PostgreSQL stores only its SHA-256 hash.
- The cookie is HttpOnly, SameSite=Lax, Path=/, persistent for the configured lifetime, and Secure only in production so localhost remains usable.
- `AuthGuard` hashes the cookie token, checks session expiry/revocation, loads the user, and denies suspended, banned, deactivated, or soft-deleted accounts.
- Email-verification and password-reset tokens are also random 32-byte values with only SHA-256 hashes stored. They are expiring and single-use.
- Resetting a password revokes every session and consumes all other outstanding reset tokens.

## Database additions

Migration `20260718130000_add_authentication` adds nullable `User.passwordHash`, `AuthSession`, `EmailVerificationToken`, and `PasswordResetToken`, with unique token hashes, foreign keys, expiry/user indexes, and no changes to existing identity, creator, channel, or enum data.

## Endpoints

All routes use the `/api/v1` prefix.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account, verification token, session, and cookie |
| POST | `/auth/login` | Login with normalized email or username |
| GET | `/auth/me` | Return the safe authenticated user |
| POST | `/auth/logout` | Revoke only the current session and clear its cookie |
| POST | `/auth/logout-all` | Revoke all sessions for the authenticated user |
| POST | `/auth/email/resend` | Send a new verification link with an enumeration-safe response |
| POST | `/auth/email/verify` | Consume a verification token transactionally |
| POST | `/auth/password/forgot` | Send a reset link with the same response for known/unknown email |
| POST | `/auth/password/reset` | Consume a reset token, update password, and revoke sessions |

Login failures are generic. Safe user responses omit password/session/token hashes and all raw secrets.

## Environment

Copy `.env.example` to `.env`:

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://jukwaa:jukwaa_dev_only@localhost:5432/jukwaa_dev
TRUST_PROXY=false
SESSION_TTL_DAYS=30
EMAIL_DELIVERY_MODE=console
MAIL_FROM=Jukwaa Live <no-reply@jukwaa.live>
```

For SMTP, set `EMAIL_DELIVERY_MODE=smtp` plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM`. Console delivery prints development-only verification/reset URLs and is rejected at startup in production.

Rate limiting is enforced globally with tighter per-route limits on registration, login, verification resend/consume, and password reset requests. The default store is process-local; use a shared throttler store before horizontally scaling. Set `TRUST_PROXY=true` only when the API is actually behind a trusted reverse proxy; arbitrary forwarded headers are not trusted by default.

## Install, migrate, and run

```bash
cd backend
npm install
cp .env.example .env
docker compose up -d postgres
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:deploy
npm run start:dev
```

Registration and password recovery print development-only email URLs to the backend terminal when console delivery is enabled. Open those frontend URLs to verify or reset the account.

## Tests and quality checks

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run test
npm run test:e2e
npm run build
```

The normal suite is deterministic without PostgreSQL and covers password/token hashing, DTO normalization, safe registration/login behavior, account statuses, session expiry/revocation, verification, password reset, and health behavior.

With a migrated PostgreSQL database available:

```powershell
$env:RUN_DATABASE_INTEGRATION_TESTS='true'
npm run test:db
```

Real `.env` files, generated Prisma client code, `node_modules`, `dist`, and coverage are Git-ignored. Migration deployment never resets the database and development seed execution remains explicit.
