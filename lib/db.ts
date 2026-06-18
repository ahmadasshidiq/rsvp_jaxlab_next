import { Pool } from 'pg';

const globalForPg = global as typeof globalThis & {
  pool: Pool | undefined;
};

const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pool = pool;
}

let connectionCheck: Promise<void> | undefined;

async function ensureDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!connectionCheck) {
    connectionCheck = pool
      .connect()
      .then((client) => {
        client.release();
      })
      .catch((error) => {
        throw new Error(
          `Failed to connect to database: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });
  }

  await connectionCheck;
}

await ensureDatabaseConnection();

export default pool;
