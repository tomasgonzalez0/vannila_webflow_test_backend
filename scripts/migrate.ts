import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const sql = await readFile(resolve("migrations/001_create_appointments.sql"), "utf8");
const pool = new Pool({ connectionString });

try {
  await pool.query(sql);
  console.log("Migration 001_create_appointments applied");
} finally {
  await pool.end();
}
