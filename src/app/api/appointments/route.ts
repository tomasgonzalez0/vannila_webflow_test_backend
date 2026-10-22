import { AntiAbuseError, enforceAntiAbuse } from "@/lib/anti-abuse";
import { createAppointment, RateLimitError, SlotUnavailableError } from "@/lib/appointments";
import { getBookingSlots } from "@/lib/config";
import { corsHeaders, evaluateOrigin } from "@/lib/cors";
import { getPool } from "@/lib/db";
import { isPastSlot } from "@/lib/time";
import { appointmentSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status: number, origin: string | null) {
  return Response.json(data, { status, headers: corsHeaders(origin) });
}

export async function OPTIONS(request: Request) {
  const check = evaluateOrigin(request);
  return check.allowed ? new Response(null, { status: 204, headers: corsHeaders(check.origin) }) : json({ success: false, error: "ORIGIN_NOT_ALLOWED" }, 403, null);
}

export async function POST(request: Request) {
  const check = evaluateOrigin(request);
  if (!check.allowed) return json({ success: false, error: "ORIGIN_NOT_ALLOWED" }, 403, null);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "INVALID_JSON" }, 400, check.origin);
  }

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) return json({ success: false, error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors }, 400, check.origin);
  if (!getBookingSlots().includes(parsed.data.time) || isPastSlot(parsed.data.date, parsed.data.time)) {
    return json({ success: false, error: "INVALID_SLOT" }, 400, check.origin);
  }

  try {
    const pool = getPool();
    await enforceAntiAbuse(request, parsed.data, pool);
    const id = await createAppointment(pool, parsed.data);
    return json({ success: true, id }, 201, check.origin);
  } catch (error) {
    if (error instanceof SlotUnavailableError) return json({ success: false, error: "SLOT_UNAVAILABLE" }, 409, check.origin);
    if (error instanceof RateLimitError) return json({ success: false, error: "RATE_LIMITED" }, 429, check.origin);
    if (error instanceof AntiAbuseError) return json({ success: false, error: error.code }, error.status, check.origin);
    return json({ success: false, error: "SERVICE_UNAVAILABLE" }, 503, check.origin);
  }
}
