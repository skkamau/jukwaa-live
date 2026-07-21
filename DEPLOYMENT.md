# Jukwaa Live public deployment

This guide deploys the Vite frontend to Vercel, the NestJS API to Render, and PostgreSQL to a managed Render database. The laptop is not part of the production runtime. Stage 5A mock streaming remains a non-video prelaunch mode.

## Before creating resources

- Use Node.js 24. The frontend and backend `package.json` files select `24.x` for Vercel, Render, and CI.
- Decide whether this is a temporary free preview or durable production. A free Render web service sleeps after inactivity, and a free Render PostgreSQL database expires after 30 days and has no backups. Use paid, backed-up PostgreSQL for durable data.
- Choose an SMTP provider. Render free web services block outbound ports 25, 465, and 587; use a provider offering an allowed submission port such as 2525, or use a paid service/network arrangement that supports the required SMTP port.
- Never paste production secrets into Git, Vercel `VITE_*` variables, logs, or support messages.

## A. Create managed PostgreSQL

1. In Render, select **New → Postgres**.
2. Choose a service name, the same region planned for the API, PostgreSQL 17 or another Render-supported compatible version, and an appropriate plan.
3. For temporary testing, Free is possible but expires after 30 days. For durable use, select a paid plan with backups.
4. Create the database. Keep its internal `DATABASE_URL` private.
5. Do not seed it and never run `prisma migrate dev`, `prisma migrate reset`, truncate commands, or integration tests against it.

All committed migrations are additive and live in `backend/prisma/migrations`:

- `20260718071500_init_identity_schema`
- `20260718130000_add_authentication`
- `20260718170000_add_streaming_foundation`

Production applies them only with `npm run db:migrate:deploy`.

## B. Establish the frontend hostname

In Vercel, choose **Add New → Project**, import `skkamau/jukwaa-live`, and set the project name. This establishes the eventual `https://<project>.vercel.app` production hostname needed by the API allow-list. Do not add secrets to the frontend project.

## C. Deploy the Render API

Create **New → Web Service**, connect `skkamau/jukwaa-live`, and use:

| Setting | Value |
|---|---|
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Node version | `24.x` from `backend/package.json` |
| Build Command | `npm ci && npm run prisma:generate && npm run build` |
| Pre-Deploy Command | `npm run db:migrate:deploy` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/api/v1/health` |

Render's pre-deploy command is available on paid web services. If using a Free web service, use this build command instead because Free does not provide pre-deploy commands:

```text
npm ci && npm run prisma:generate && npm run build && npm run db:migrate:deploy
```

Do not add a seed command. Set these Render environment variables:

```dotenv
NODE_ENV=production
# PORT is supplied by Render; do not override it unless Render requires it.
FRONTEND_ORIGIN=https://<exact-production-project>.vercel.app
# Optional comma-separated additional exact origins; never use *.vercel.app.
# FRONTEND_ORIGINS=https://<one-exact-preview>.vercel.app
DATABASE_URL=<Render internal PostgreSQL URL>
TRUST_PROXY=true
SESSION_TTL_DAYS=30
AUTH_COOKIE_SAME_SITE=none
EMAIL_DELIVERY_MODE=smtp
SMTP_HOST=<SMTP host>
SMTP_PORT=<SMTP submission port>
SMTP_SECURE=false
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password>
MAIL_FROM=Jukwaa Live <no-reply@your-verified-sender.example>
STREAMING_PROVIDER=mock
STREAM_STATUS_SYNC_SECONDS=10
ALLOW_MOCK_STREAMING_IN_PRODUCTION=true
```

`AUTH_COOKIE_SAME_SITE=none` is required for temporary Vercel and Render hostnames because they are cross-site. Production cookies remain HttpOnly and Secure. All unsafe requests must carry an exact trusted `Origin`, which protects the cross-site cookie from CSRF. Browser third-party-cookie policies can still block cross-site cookies; custom sibling domains are the durable solution.

After deployment, open `https://<api-service>.onrender.com/api/v1/health`. A healthy response reports the API and database as up without exposing connection details.

## D. Finish the Vercel frontend

Use these Vercel project settings:

| Setting | Value |
|---|---|
| Root Directory | repository root (`.`) |
| Framework Preset | Vite |
| Install Command | `npm ci` or automatic |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 24.x |

Add only these production build variables:

```dotenv
VITE_API_BASE_URL=/api/v1
```

Redeploy after changing a Vite variable because it is compiled into the frontend bundle. `vercel.json` proxies `/api/*` to the Render service so authentication cookies remain first-party in browsers that block cross-site cookies, including mobile Safari. It separately rewrites non-API routes to `index.html`, so direct visits and refreshes work for `/login`, `/register`, `/dashboard`, `/channel/:slug`, `/watch/:id`, `/go-live`, and `/settings`.

## E. Verify production

1. Confirm `/api/v1/health` reports `database: up`.
2. Open the Vercel site in a private browser window.
3. Register a unique real account.
4. Confirm the verification email arrives and its link uses the Vercel production hostname.
5. Verify the account, sign out, sign back in, and refresh a protected route.
6. Test forgot-password and password-reset email delivery.
7. Create a creator/channel and refresh to confirm persistence.
8. Prepare a stream. During explicit prelaunch test mode, confirm the labelled mock simulation controls appear and no real video or provider credentials are exposed.
9. Directly refresh every important React route.
10. Turn off the development laptop and test the site from another device/network.

## F. Custom domains later

No application rewrite is required. Point the Vercel project at `jukwaa.live` or `www.jukwaa.live`, point Render at `api.jukwaa.live`, then change:

```dotenv
# Render
FRONTEND_ORIGIN=https://jukwaa.live
AUTH_COOKIE_SAME_SITE=lax

# Vercel
VITE_API_BASE_URL=/api/v1
```

Update DNS, redeploy both services, and repeat authentication tests. The host-only API cookie remains Secure and HttpOnly.

## Troubleshooting

### CORS or CSRF 403

- `FRONTEND_ORIGIN` must exactly match the browser's origin, including `https` and any subdomain.
- Add only specific extra origins to `FRONTEND_ORIGINS`; wildcard Vercel domains are rejected.
- Redeploy the API after changing origins.
- Unsafe requests without an `Origin` header are deliberately rejected.

### Login succeeds but the next request is signed out

- Temporary separate Vercel/Render domains require `AUTH_COOKIE_SAME_SITE=none`.
- `SameSite=None` is accepted only with the Secure production cookie.
- Confirm requests use `credentials: include` and the exact HTTPS API URL.
- Check browser third-party-cookie settings. Prefer `jukwaa.live` plus `api.jukwaa.live` for durable deployment.

### Database or migration failure

- Use Render's internal PostgreSQL URL when the API and database share a Render region/workspace.
- Confirm `DATABASE_URL` begins with `postgresql://` or `postgres://`.
- Run only `npm run db:migrate:deploy`. Never reset production.
- A failed pre-deploy migration prevents the new version from replacing the last healthy deployment.

### SMTP failure

- Verify sender/domain requirements with the SMTP provider.
- Confirm host, port, username, password, TLS mode, and `MAIL_FROM`.
- On Render Free, ports 25, 465, and 587 are blocked; use an allowed provider port such as 2525 or a suitable paid service.
- Production refuses console-email mode and never logs verification/reset tokens.

### React route returns 404

- Confirm the Vercel project root is the repository root and `vercel.json` is detected.
- Confirm build output is `dist`.
- Redeploy after configuration changes.

### Health check fails

- Check Render logs for safe startup errors.
- Verify `DATABASE_URL`, migration status, and database availability.
- The public health response intentionally omits credentials and internal exceptions.
