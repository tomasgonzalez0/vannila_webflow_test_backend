import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { getBookingMode } from "@/lib/config";
import type { AppointmentInput } from "@/lib/validation";

const MIN_CHALLENGE_AGE_MS = 2_000;
const MAX_CHALLENGE_AGE_MS = 30 * 60_000;

export class AntiAbuseError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

function challengeSecret(): string {
  const secret = process.env.BOOKING_CHALLENGE_SECRET;
  if (!secret || secret.length < 32) throw new AntiAbuseError("ANTI_ABUSE_NOT_CONFIGURED", 503);
  return secret;
}

function signature(payload: string): string {
  return createHmac("sha256", challengeSecret()).update(payload).digest("base64url");
}

export function createBookingChallenge(now = Date.now()): { token: string; expiresInSeconds: number } {
  const payload = `${now}.${randomBytes(18).toString("base64url")}`;
  return { token: `${payload}.${signature(payload)}`, expiresInSeconds: MAX_CHALLENGE_AGE_MS / 1000 };
}

function verifyChallenge(token: string, now = Date.now()): void {
  const pieces = token.split(".");
  if (pieces.length !== 3) throw new AntiAbuseError("ANTI_ABUSE_FAILED", 403);
  const payload = `${pieces[0]}.${pieces[1]}`;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(pieces[2]);
  if (expected.byteLength !== supplied.byteLength || !timingSafeEqual(expected, supplied)) {
    throw new AntiAbuseError("ANTI_ABUSE_FAILED", 403);
  }
  const issuedAt = Number(pieces[0]);
  const age = now - issuedAt;
  if (!Number.isFinite(issuedAt) || age < MIN_CHALLENGE_AGE_MS || age > MAX_CHALLENGE_AGE_MS) {
    throw new AntiAbuseError("ANTI_ABUSE_EXPIRED", 403);
  }
}

async function consumeCounter(client: PoolClient, key: string, interval: "1 minute" | "1 hour", limit: number): Promise<void> {
  const result = await client.query<{ attempt_count: number }>(
    `INSERT INTO booking_rate_limits (rate_limit_key, window_started, attempt_count, expires_at)
     VALUES ($1, now(), 1, now() + $2::interval)
     ON CONFLICT (rate_limit_key) DO UPDATE SET
       window_started = CASE WHEN booking_rate_limits.window_started < now() - $2::interval THEN now() ELSE booking_rate_limits.window_started END,
       attempt_count = CASE WHEN booking_rate_limits.window_started < now() - $2::interval THEN 1 ELSE booking_rate_limits.attempt_count + 1 END,
       expires_at = now() + $2::interval
     RETURNING attempt_count`,
    [key, interval],
  );
  if ((result.rows[0]?.attempt_count ?? limit + 1) > limit) throw new AntiAbuseError("RATE_LIMITED", 429);
}

async function consumeProductionChallenge(pool: Pool, input: AppointmentInput): Promise<void> {
  verifyChallenge(input.challengeToken);
  if (input.website) throw new AntiAbuseError("ANTI_ABUSE_FAILED", 403);

  const secret = challengeSecret();
  const challengeKey = `challenge:${createHash("sha256").update(input.challengeToken).digest("hex")}`;
  const phoneKey = `phone:${createHmac("sha256", secret).update(input.phone).digest("hex")}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM booking_rate_limits WHERE expires_at < now()");
    const used = await client.query(
      `INSERT INTO booking_rate_limits (rate_limit_key, window_started, attempt_count, expires_at)
       VALUES ($1, now(), 1, now() + interval '30 minutes')
       ON CONFLICT DO NOTHING RETURNING rate_limit_key`,
      [challengeKey],
    );
    if (used.rowCount !== 1) throw new AntiAbuseError("ANTI_ABUSE_REPLAYED", 403);
    await consumeCounter(client, "global:appointments", "1 minute", 30);
    await consumeCounter(client, phoneKey, "1 hour", 5);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function enforceAntiAbuse(request: Request, input: AppointmentInput, pool: Pool): Promise<void> {
  if (getBookingMode() === "demo") {
    const expected = process.env.DEMO_BOOKING_KEY;
    const supplied = request.headers.get("x-demo-booking-key");
    if (!expected || supplied !== expected) throw new AntiAbuseError("BOOKING_DEMO_ONLY", 403);
    return;
  }
  await consumeProductionChallenge(pool, input);
}
