import { getBookingMode, getBookingSlots } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ ok: true, service: "vannila-booking-api", bookingMode: getBookingMode(), configuredSlots: getBookingSlots().length });
  } catch {
    return Response.json({ ok: false, error: "CONFIGURATION_ERROR" }, { status: 503 });
  }
}
