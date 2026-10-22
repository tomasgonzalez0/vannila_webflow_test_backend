import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAppointment, getBookedTimes, SlotUnavailableError } from "@/lib/appointments";
import { appointmentSchema } from "@/lib/validation";

const connectionString = process.env.DATABASE_URL_TEST;
const suite = connectionString ? describe : describe.skip;

suite("PostgreSQL appointment concurrency", () => {
  const pool = new Pool({ connectionString });
  const input = appointmentSchema.parse({
    name: "QA Concurrente",
    preferredName: "QA",
    phone: "+573000000001",
    service: "soft-gel",
    date: "2099-12-20",
    time: "13:00",
  });

  beforeAll(async () => {
    const migration = await readFile(resolve("migrations/001_create_appointments.sql"), "utf8");
    await pool.query(migration);
    await pool.query("TRUNCATE appointments");
  });

  afterAll(async () => {
    await pool.query("TRUNCATE appointments");
    await pool.end();
  });

  it("allows exactly one simultaneous insert and maps the loser to a conflict", async () => {
    const results = await Promise.allSettled([createAppointment(pool, input), createAppointment(pool, input)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toBeDefined();
    if (rejected?.status === "rejected") expect(rejected.reason).toBeInstanceOf(SlotUnavailableError);
    expect(await getBookedTimes(pool, input.date)).toEqual(["13:00"]);
  });

  it("allows a different configured time", async () => {
    const id = await createAppointment(pool, { ...input, time: "17:00", phone: "+573000000002" });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getBookedTimes(pool, input.date)).toEqual(["13:00", "17:00"]);
  });
});
