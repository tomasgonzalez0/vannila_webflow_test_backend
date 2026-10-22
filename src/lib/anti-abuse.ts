import { getBookingMode } from "@/lib/config";

export class AntiAbuseError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

export async function enforceAntiAbuse(request: Request, token?: string): Promise<void> {
  const mode = getBookingMode();

  if (mode === "demo") {
    const expected = process.env.DEMO_BOOKING_KEY;
    const supplied = request.headers.get("x-demo-booking-key");
    if (!expected || supplied !== expected) throw new AntiAbuseError("BOOKING_DEMO_ONLY", 403);
    return;
  }

  if (process.env.SKIP_ANTI_ABUSE === "true") {
    if (process.env.NODE_ENV === "production") throw new AntiAbuseError("ANTI_ABUSE_NOT_CONFIGURED", 503);
    return;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new AntiAbuseError("ANTI_ABUSE_NOT_CONFIGURED", 503);
  if (!token) throw new AntiAbuseError("ANTI_ABUSE_REQUIRED", 400);

  const remoteip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new AntiAbuseError("ANTI_ABUSE_UNAVAILABLE", 503);
  const result = (await response.json()) as { success?: boolean };
  if (!result.success) throw new AntiAbuseError("ANTI_ABUSE_FAILED", 403);
}
