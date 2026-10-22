const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type BookingMode = "demo" | "production";
type Environment = Record<string, string | undefined>;

export function getAllowedOrigins(env: Environment = process.env): string[] {
  return (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getBookingSlots(env: Environment = process.env): string[] {
  const slots = [...new Set((env.BOOKING_SLOTS ?? "").split(",").map((value) => value.trim()).filter(Boolean))];
  if (slots.length === 0 || slots.some((slot) => !TIME_PATTERN.test(slot))) {
    throw new Error("BOOKING_SLOTS must contain one or more valid HH:MM values");
  }
  return slots.sort();
}

export function getBookingMode(env: Environment = process.env): BookingMode {
  const mode = env.BOOKING_MODE ?? "demo";
  if (mode !== "demo" && mode !== "production") {
    throw new Error("BOOKING_MODE must be demo or production");
  }
  return mode;
}

export function getDatabaseUrl(env: Environment = process.env): string {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return env.DATABASE_URL;
}
