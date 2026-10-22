import { Pool, type PoolClient } from "pg";
import { getDatabaseUrl } from "@/lib/config";

const globalForDb = globalThis as unknown as { vannilaPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.vannilaPool) {
    globalForDb.vannilaPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalForDb.vannilaPool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
