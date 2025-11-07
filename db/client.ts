/**
 * Simple Postgres client helper for outbox and persistence.
 * Exports a `query` helper using pg.Pool when DATABASE_URL is present.
 */
import { Pool } from 'pg';

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

export async function query(text: string, params?: any[]) {
  if (!pool) throw new Error('DATABASE_URL not configured');
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('DATABASE_URL not configured');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await fn(client);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('rollback error', rbErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

export default { query, withTransaction };
