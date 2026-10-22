# Vannila Booking API

Minimal Next.js App Router + PostgreSQL API for Vannila Atelier. It exposes health, date availability, and appointment creation only.

## Safety status

The production deployment uses the fixed public slots `09:00`, `13:00`, and `17:00`. Production mode requires a private `BOOKING_CHALLENGE_SECRET`; the server verifies a signed, short-lived, one-use challenge and applies durable PostgreSQL-backed global and phone-hash rate limits before accepting a write.

## Local setup

1. Copy `.env.example` to `.env.local` and use a local/test PostgreSQL URL.
2. Set exact `ALLOWED_ORIGINS`, `BOOKING_SLOTS`, and mode values.
3. Run `npm install`, `npm run db:migrate`, then `npm run dev`.

## Endpoints

- `GET /api/health`
- `GET /api/booking-challenge`
- `GET /api/appointments/availability?date=YYYY-MM-DD`
- `OPTIONS|POST /api/appointments`

The POST body accepts only `name`, `preferredName`, `phone`, `instagram?`, `service`, `date`, `time`, `designNotes?`, `challengeToken`, and the empty `website` honeypot. Service values are the seven documented slugs. Successful insert returns 201. The PostgreSQL unique constraint on `(date, start_time)` maps duplicate races to `409 SLOT_UNAVAILABLE`.

## Production prerequisites

- PostgreSQL with TLS and a secret `DATABASE_URL` (the deployed Neon Function receives this automatically).
- Owner-confirmed fixed slots and `BOOKING_MODE=production`.
- Exact Webflow subdomain in `ALLOWED_ORIGINS`; never `*`.
- A provider-secret `BOOKING_CHALLENGE_SECRET` of at least 32 random bytes. Never put it in Webflow or Git.
- Run the migration, unit/integration tests, build, and a real cross-origin browser smoke test.

## Deployed adapter

`src/neon-function.ts` exposes the same validated route handlers as a Neon Function so the public API runs next to the production database and receives `DATABASE_URL` without committing credentials. Bundle it as a self-contained Node 24 `index.mjs`; the production slug is `vannilabookapi`. The invocation URL is recorded in the delivery documents, not hardcoded into the server.

Run the public smoke suite with:

```sh
node scripts/postdeploy-smoke.mjs https://YOUR-API-HOST https://vannila-studio.webflow.io
```

The script uses the dedicated test date `2099-12-29` and verifies allowed/disallowed CORS, signed challenge replay rejection, one `201` plus one `409` for a concurrent slot race, persistence, and a different-slot `201`.

## Privacy and retention

The table stores contact data needed to fulfill the booking. Do not log request bodies. Restrict database access, define an owner-approved retention/deletion policy, and remove controlled QA rows after testing without touching real appointments.
