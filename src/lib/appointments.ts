import type { Pool, PoolClient } from "pg";
import type { AppointmentInput } from "@/lib/validation";

export class SlotUnavailableError extends Error {}
export class RateLimitError extends Error {}

type Queryable = Pick<Pool | PoolClient, "query">;

export async function getBookedTimes(db: Queryable, date: string): Promise<string[]> {
  const result = await db.query<{ start_time: string }>(
    "SELECT to_char(start_time, 'HH24:MI') AS start_time FROM appointments WHERE date = $1::date ORDER BY start_time",
    [date],
  );
  return result.rows.map((row) => row.start_time);
}

export async function createAppointment(db: Queryable, input: AppointmentInput): Promise<string> {
  const recent = await db.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM appointments WHERE phone = $1 AND created_at >= now() - interval '1 hour'",
    [input.phone],
  );
  if (Number(recent.rows[0]?.count ?? 0) >= 3) throw new RateLimitError("RATE_LIMITED");

  try {
    const result = await db.query<{ id: string }>(
      `INSERT INTO appointments
        (name, preferred_name, phone, instagram, service, date, start_time, design_notes)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7::time, $8)
       RETURNING id::text`,
      [
        input.name,
        input.preferredName,
        input.phone,
        input.instagram ?? null,
        input.service,
        input.date,
        input.time,
        input.designNotes ?? null,
      ],
    );
    return result.rows[0].id;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new SlotUnavailableError("SLOT_UNAVAILABLE");
    }
    throw error;
  }
}
