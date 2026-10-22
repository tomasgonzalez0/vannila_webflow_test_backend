import { AntiAbuseError, createBookingChallenge } from "@/lib/anti-abuse";
import { corsHeaders, evaluateOrigin } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status: number, origin: string | null) {
  return Response.json(data, { status, headers: { ...corsHeaders(origin), "Cache-Control": "no-store" } });
}

export async function OPTIONS(request: Request) {
  const check = evaluateOrigin(request);
  return check.allowed ? new Response(null, { status: 204, headers: corsHeaders(check.origin) }) : json({ error: "ORIGIN_NOT_ALLOWED" }, 403, null);
}

export async function GET(request: Request) {
  const check = evaluateOrigin(request);
  if (!check.allowed) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403, null);
  try {
    return json(createBookingChallenge(), 200, check.origin);
  } catch (error) {
    if (error instanceof AntiAbuseError) return json({ error: error.code }, error.status, check.origin);
    return json({ error: "SERVICE_UNAVAILABLE" }, 503, check.origin);
  }
}
