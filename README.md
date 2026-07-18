# Jukwaa Live

**Kenya is live.** Jukwaa Live is a polished Phase 1 frontend demo for a Kenyan-first livestreaming platform. It is designed for creator demos, user testing, and partner conversations before backend development begins.

## Demo features

- Responsive home, browse, following, category, watch, creator, clips, dashboard, earnings, settings, and go-live routes
- 12 fictional live streams, 12 creators, 10 categories, 12 clips, 22 chat messages, 4 events, and 8 earnings transactions
- Local stream/creator search and filtering
- Follow/unfollow state shared across the experience
- Interactive local live chat and simulated player controls
- Demo M-Pesa support and withdrawal modals (no payment requests)
- Three-second go-live countdown, local LIVE state, and duration timer
- Appearance, autoplay, low-data, quality, and safety preferences
- Signed-in/signed-out demo toggle, notifications, responsive sidebar, and mobile bottom navigation

## Technology

React 19, Vite, TypeScript, Tailwind CSS 4, React Router, and Lucide React.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Quality checks

```bash
npm run typecheck
npm run build
npm run preview
```

## Current limitations

This phase is frontend-only. All data and interactions are local and reset on refresh. Video, authentication, chat, notifications, M-Pesa support, withdrawals, and account deletion are simulations. No camera, microphone, payment provider, database, or external creator content is accessed.

## Planned Phase 2

Real authentication; livestream ingestion and playback; OBS stream keys; mobile camera streaming; WebSocket chat; M-Pesa Daraja payments; creator payouts; PostgreSQL; admin moderation; recording and clips generation; push notifications; analytics; recommendations; and cloud storage.
