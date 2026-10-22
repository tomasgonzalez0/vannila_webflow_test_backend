import { GET as health } from "@/app/api/health/route";
import { GET as challenge, OPTIONS as challengeOptions } from "@/app/api/booking-challenge/route";
import { GET as availability, OPTIONS as availabilityOptions } from "@/app/api/appointments/availability/route";
import { POST as appointment, OPTIONS as appointmentOptions } from "@/app/api/appointments/route";

const handler = {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    if (request.method === "GET" && path === "/api/health") return health();
    if (path === "/api/booking-challenge") {
      if (request.method === "GET") return challenge(request);
      if (request.method === "OPTIONS") return challengeOptions(request);
    }
    if (path === "/api/appointments/availability") {
      if (request.method === "GET") return availability(request);
      if (request.method === "OPTIONS") return availabilityOptions(request);
    }
    if (path === "/api/appointments") {
      if (request.method === "POST") return appointment(request);
      if (request.method === "OPTIONS") return appointmentOptions(request);
    }
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  },
};

export default handler;
