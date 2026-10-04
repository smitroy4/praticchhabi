import { Pool, types } from 'pg';

// Keep `date` columns as 'YYYY-MM-DD' strings instead of JS Date objects
// (avoids timezone shifting and matches the string dates used across the UI).
types.setTypeParser(1082, (value: string) => value);

// Single shared pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { dbPool?: Pool };

export const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (!globalForDb.dbPool) globalForDb.dbPool = pool;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
