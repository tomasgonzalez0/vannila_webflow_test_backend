# Vannila Booking API

Minimal Next.js App Router + PostgreSQL API for Vannila Atelier. It exposes health, date availability, and appointment creation only.

## Safety status

The repository defaults to `BOOKING_MODE=demo`. Demo slots (`09:00`, `13:00`, `17:00`) are not business hours and must not be exposed as confirmed availability. Production mode additionally requires Cloudflare Turnstile and owner-confirmed slots.

## Local setup

1. Copy `.env.example` to `.env.local` and use a local/test PostgreSQL URL.
2. Set exact `ALLOWED_ORIGINS`, `BOOKING_SLOTS`, and mode values.
3. Run `npm install`, `npm run db:migrate`, then `npm run dev`.

## Endpoints

- `GET /api/health`
- `GET /api/appointments/availability?date=YYYY-MM-DD`
- `OPTIONS|POST /api/appointments`

The POST body accepts only `name`, `preferredName`, `phone`, `instagram?`, `service`, `date`, `time`, `designNotes?`, and `turnstileToken?`. Service values are the seven documented slugs. Successful insert returns 201. The PostgreSQL unique constraint on `(date, start_time)` maps duplicate races to `409 SLOT_UNAVAILABLE`.

## Production prerequisites

- External PostgreSQL with TLS and a secret `DATABASE_URL`.
- Owner-confirmed fixed slots and `BOOKING_MODE=production`.
- Exact Webflow subdomain in `ALLOWED_ORIGINS`; never `*`.
- Cloudflare Turnstile site/secret keys, or an equivalent durable provider-backed anti-abuse replacement reviewed before launch.
- Run the migration, unit/integration tests, build, and a real cross-origin browser smoke test.

## Privacy and retention

The table stores contact data needed to fulfill the booking. Do not log request bodies. Restrict database access, define an owner-approved retention/deletion policy, and remove controlled QA rows after testing without touching real appointments.
