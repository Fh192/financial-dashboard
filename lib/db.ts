import { Pool, type PoolClient } from "pg";

// Приложение подключается пользователем с ролью dashboard_app (см. db/README.md).
// В dev-режиме модуль перезагружается при каждом изменении кода, поэтому пул
// храним в globalThis, чтобы не плодить соединения.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    // На Vercel каждая функция держит свой пул, соединений нужно немного
    max: process.env.VERCEL ? 3 : 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

/**
 * Транзакция от имени пользователя: его id попадает в app.user_id, и триггер
 * журнала статусов записывает, кто изменил счет.
 */
export async function withUser<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
