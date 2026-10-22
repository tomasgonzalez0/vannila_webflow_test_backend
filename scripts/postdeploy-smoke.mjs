const base = (process.argv[2] || "").replace(/\/$/, "");
const origin = process.argv[3] || "https://vannila-studio.webflow.io";
if (!base.startsWith("https://")) throw new Error("Pass the deployed HTTPS API base URL as the first argument");

const testDate = "2099-12-29";
const results = {};

async function request(path, init = {}) {
  const response = await fetch(base + path, init);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body, headers: response.headers };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function challenge() {
  const response = await request("/api/booking-challenge", { headers: { Origin: origin, Accept: "application/json" } });
  expect(response.status === 200 && typeof response.body?.token === "string", "Challenge endpoint failed");
  return response.body.token;
}

results.health = await request("/api/health");
expect(results.health.status === 200 && results.health.body?.ok === true, "Health check failed");

results.preflight = await request("/api/appointments", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST" } });
expect(results.preflight.status === 204, "Allowed CORS preflight failed");
expect(results.preflight.headers.get("access-control-allow-origin") === origin, "Allowed CORS origin was not echoed exactly");

results.disallowedOrigin = await request("/api/appointments", { method: "OPTIONS", headers: { Origin: "https://example.com", "Access-Control-Request-Method": "POST" } });
expect(results.disallowedOrigin.status === 403, "Disallowed CORS origin was not rejected");

results.invalidDate = await request("/api/appointments/availability?date=2099-02-31", { headers: { Origin: origin } });
expect(results.invalidDate.status === 400, "Impossible date was not rejected");

const tokenA = await challenge();
const tokenB = await challenge();
await new Promise((resolve) => setTimeout(resolve, 2200));

const basePayload = {
  name: "QA Despliegue",
  preferredName: "QA",
  service: "soft-gel",
  date: testDate,
  time: "13:00",
  website: "",
};

const [first, second] = await Promise.all([
  request("/api/appointments", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ ...basePayload, phone: "+573001119901", challengeToken: tokenA }) }),
  request("/api/appointments", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ ...basePayload, phone: "+573001119902", challengeToken: tokenB }) }),
]);
results.sameSlotConcurrency = [first.status, second.status].sort((a, b) => a - b);
expect(results.sameSlotConcurrency[0] === 201 && results.sameSlotConcurrency[1] === 409, "Concurrent same-slot requests did not return one 201 and one 409");

results.availability = await request(`/api/appointments/availability?date=${testDate}`, { headers: { Origin: origin } });
expect(results.availability.status === 200 && results.availability.body?.bookedTimes?.includes("13:00"), "Persisted booking did not appear in availability");

const tokenC = await challenge();
await new Promise((resolve) => setTimeout(resolve, 2200));
const different = await request("/api/appointments", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ ...basePayload, phone: "+573001119903", time: "17:00", challengeToken: tokenC }),
});
results.differentSlot = different.status;
expect(different.status === 201, "Different configured slot was not accepted");

const replay = await request("/api/appointments", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ ...basePayload, phone: "+573001119904", time: "09:00", challengeToken: tokenC }),
});
results.challengeReplay = replay.status;
expect(replay.status === 403, "Consumed anti-spam challenge was not rejected");

console.log(JSON.stringify({
  health: results.health.status,
  allowedPreflight: results.preflight.status,
  disallowedPreflight: results.disallowedOrigin.status,
  invalidDate: results.invalidDate.status,
  sameSlotConcurrency: results.sameSlotConcurrency,
  persistedBookedTimes: results.availability.body.bookedTimes,
  differentSlot: results.differentSlot,
  challengeReplay: results.challengeReplay,
  testDate,
}, null, 2));
