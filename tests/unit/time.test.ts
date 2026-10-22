import { describe, expect, it } from "vitest";
import { bogotaNowParts, isPastDate, isPastSlot, isValidIsoDate } from "@/lib/time";

describe("Bogota date and slot rules", () => {
  const now = new Date("2026-10-22T15:30:00.000Z"); // 10:30 in Bogota

  it("formats the business-local clock without using host time", () => {
    expect(bogotaNowParts(now)).toEqual({ date: "2026-10-22", time: "10:30" });
  });

  it("validates real calendar dates", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
  });

  it("rejects past local dates and slots", () => {
    expect(isPastDate("2026-10-21", now)).toBe(true);
    expect(isPastSlot("2026-10-22", "09:00", now)).toBe(true);
    expect(isPastSlot("2026-10-22", "13:00", now)).toBe(false);
    expect(isPastSlot("2026-10-23", "09:00", now)).toBe(false);
  });
});
