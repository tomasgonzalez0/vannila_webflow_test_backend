import { corsHeaders, evaluateOrigin } from "@/lib/cors";
import { getBookingMode, getBookingSlots } from "@/lib/config";
import { getBookedTimes } from "@/lib/appointments";
import { getPool } from "@/lib/db";
import { dateSchema } from "@/lib/validation";
import { isPastDate } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status: number, origin: string | null) {
  return Response.json(data, { status, headers: corsHeaders(origin) });
}

export async function OPTIONS(request: Request) {
  const check = evaluateOrigin(request);
  return check.allowed ? new Response(null, { status: 204, headers: corsHeaders(check.origin) }) : json({ error: "ORIGIN_NOT_ALLOWED" }, 403, null);
}

export async function GET(request: Request) {
  const check = evaluateOrigin(request);
  if (!check.allowed) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403, null);

  const parsed = dateSchema.safeParse(new URL(request.url).searchParams.get("date"));
  if (!parsed.success || isPastDate(parsed.data)) return json({ error: "INVALID_DATE" }, 400, check.origin);

  try {
    const slots = getBookingSlots();
    const bookedTimes = await getBookedTimes(getPool(), parsed.data);
    return json({ date: parsed.data, slots, bookedTimes, mode: getBookingMode() }, 200, check.origin);
  } catch {
    return json({ error: "SERVICE_UNAVAILABLE" }, 503, check.origin);
  }
}
