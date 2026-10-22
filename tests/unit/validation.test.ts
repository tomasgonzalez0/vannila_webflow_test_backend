import { describe, expect, it } from "vitest";
import { appointmentSchema, SERVICE_SLUGS } from "@/lib/validation";

const valid = {
  name: "Laura Gómez",
  preferredName: "Lau",
  phone: "+57 300 123 4567",
  service: "soft-gel",
  date: "2099-11-10",
  time: "13:00",
};

describe("appointment validation", () => {
  it("accepts every known service and normalizes phone spacing", () => {
    for (const service of SERVICE_SLUGS) {
      const result = appointmentSchema.parse({ ...valid, service });
      expect(result.phone).toBe("+573001234567");
    }
  });

  it("rejects unknown services, impossible dates and extra fields", () => {
    expect(appointmentSchema.safeParse({ ...valid, service: "acrylic" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...valid, date: "2099-02-31" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...valid, admin: true }).success).toBe(false);
  });

  it("requires preferred name and a plausible WhatsApp number", () => {
    expect(appointmentSchema.safeParse({ ...valid, preferredName: "" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
});
