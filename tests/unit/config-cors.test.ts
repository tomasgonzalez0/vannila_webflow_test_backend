import { describe, expect, it } from "vitest";
import { getAllowedOrigins, getBookingMode, getBookingSlots } from "@/lib/config";

describe("configuration", () => {
  it("parses exact origins and fixed slots", () => {
    const env = { ALLOWED_ORIGINS: "https://vannila-studio.webflow.io, https://preview.example", BOOKING_SLOTS: "13:00,09:00,13:00", BOOKING_MODE: "demo" };
    expect(getAllowedOrigins(env)).toEqual(["https://vannila-studio.webflow.io", "https://preview.example"]);
    expect(getBookingSlots(env)).toEqual(["09:00", "13:00"]);
    expect(getBookingMode(env)).toBe("demo");
  });

  it("rejects missing slots and invalid modes", () => {
    expect(() => getBookingSlots({})).toThrow();
    expect(() => getBookingMode({ BOOKING_MODE: "live" })).toThrow();
  });
});
