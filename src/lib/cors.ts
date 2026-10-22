import { getAllowedOrigins } from "@/lib/config";

export function evaluateOrigin(request: Request): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get("origin");
  if (!origin) return { allowed: true, origin: null };
  return { allowed: getAllowedOrigins().includes(origin), origin };
}

export function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Demo-Booking-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
