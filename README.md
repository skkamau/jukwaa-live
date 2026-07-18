# Jukwaa Live

**Kenya is live.** Jukwaa Live is a Kenyan-first livestreaming platform. Stage 5A adds database-backed stream sessions and a provider-independent lifecycle without requiring any paid video service.

## Technology

- React 19, Vite, TypeScript, Tailwind CSS 4, React Router, and Lucide React
- NestJS 11, Prisma 7, and PostgreSQL
- Argon2id password hashing and database-backed opaque sessions
- A provider-neutral streaming layer with a deterministic, non-video mock provider

## Run locally

Requires Node.js 20.19+, npm, and PostgreSQL. Docker Compose can provide only PostgreSQL; Docker is not required for unit tests.

```bash
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
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Register, verify the development email link printed by the API, create a channel from `/dashboard`, then open `/go-live`.

## Stage 5A stream lifecycle

The Go Live form calls `POST /api/v1/streams/me/prepare` and persists a `PREPARING` stream. A frontend click alone never marks a real stream live. The configured `StreamingProvider` reports provider state to a centralized synchronization and lifecycle layer, which performs:

```text
PREPARING -> LIVE -> ENDED
          \
           -> CANCELLED (before going live)
```

`STREAMING_PROVIDER=mock` selects `MockStreamingProvider`. It offers development-only **Simulate Go Live** and **Simulate End** controls so the full dashboard, discovery, public API, channel, and watch-page lifecycle can be tested deterministically. It does not ingest, transcode, distribute, play, or record video. Simulation endpoints require an authenticated stream owner, non-production `NODE_ENV`, and the mock provider.

Production refuses an implicit mock provider. An intentional non-video production demonstration must explicitly set both `STREAMING_PROVIDER=mock` and `ALLOW_MOCK_STREAMING_IN_PRODUCTION=true`; development simulation endpoints remain blocked in production.

## Demo content toggle

`VITE_DEMO_CONTENT_ENABLED=true` keeps fictional discovery content for development and investor demonstrations. Real database streams and fictional streams are visibly separated. Set it to `false` for honest real-data-only discovery and zero states.

## Local OBS and future providers

Stage 5A does **not** install a local media server. Consequently, OBS → RTMP → HLS playback was not tested. A future `LocalStreamingProvider` can implement the same provider interface and return an HLS playback source consumed by the existing player boundary. Amazon IVS can later be added as `AmazonIvsStreamingProvider` without changing stream ownership, lifecycle, public APIs, dashboard identity, discovery, or core database records. No AWS SDK or paid cloud account is required now.

### Phone testing on the same Wi-Fi

Mock lifecycle testing works from a phone; it still does not show video.

1. Find the laptop LAN address with `ipconfig` (for example `192.168.1.20`).
2. Set backend `FRONTEND_ORIGIN=http://192.168.1.20:5173`. Keep a single explicit origin; do not use `*` with credentialed requests.
3. Set frontend `VITE_API_BASE_URL=http://192.168.1.20:3000/api/v1`.
4. Start the API and Vite development server. Vite already binds to `0.0.0.0`.
5. Allow ports 3000 and 5173 only on the trusted private network if the OS firewall prompts.
6. Open `http://192.168.1.20:5173` on the phone. `localhost` on the phone refers to the phone, not the laptop.

For a different frontend URL, update `FRONTEND_ORIGIN` explicitly and restart the API.

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

Database integration tests require migrated PostgreSQL and `RUN_DATABASE_INTEGRATION_TESTS=true`; see [backend/README.md](backend/README.md).

## Deferred scope

Amazon IVS, local real-video infrastructure, real chat/WebSockets, follows, notifications, M-Pesa, payments, earnings, payouts, advertising, monetisation, KYC, recordings, clips generation, subscriptions, and real viewer analytics are intentionally not implemented in Stage 5A.
