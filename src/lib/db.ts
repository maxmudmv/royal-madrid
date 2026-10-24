import path from 'path';
import os from 'os';
import fs from 'fs';
import { Pool, QueryResultRow } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export interface DbQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DbAdapter {
  query<T extends QueryResultRow = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<DbQueryResult<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  engineName: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __royalMadridDbPromise: Promise<DbAdapter> | undefined;
}

async function ensureSchemaExists(adapter: {
  query<T extends QueryResultRow = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
}): Promise<void> {
  const tableCheck = await adapter.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'matches'
    ) AS exists;`
  );
  if (!tableCheck.rows[0]?.exists) {
    const schemaPath = path.join(
      process.cwd(),
      'migrations',
      '001_initial_schema.sql'
    );
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await adapter.exec(sql);
    }
  }
}

async function createAdapter(): Promise<DbAdapter> {
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  const isRemotePostgres =
    (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) &&
    (!dbUrl.includes('127.0.0.1:5433') || process.env.USE_REMOTE_PG === 'true');

  if (isRemotePostgres) {
    try {
      const pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
      });
      await pool.query('SELECT 1');

      const remoteAdapter: DbAdapter = {
        engineName: 'PostgreSQL (pg.Pool / Remote Cloud DB)',
        async query<T extends QueryResultRow = Record<string, unknown>>(
          sql: string,
          params: unknown[] = []
        ): Promise<DbQueryResult<T>> {
          const res = await pool.query<T>(sql, params);
          return {
            rows: res.rows,
            rowCount: res.rowCount ?? res.rows.length,
          };
        },
        async exec(sql: string): Promise<void> {
          await pool.query(sql);
        },
        async close(): Promise<void> {
          await pool.end();
        },
      };

      await ensureSchemaExists(remoteAdapter);
      return remoteAdapter;
    } catch (err) {
      console.warn(
        '[DB] External PostgreSQL connection unavailable, falling back to embedded PostgreSQL (PGlite):',
        (err as Error).message
      );
    }
  }

  const isVercel = Boolean(process.env.VERCEL);
  const dataDir = isVercel
    ? path.join(os.tmpdir(), 'royal-madrid-pglite-cluster')
    : path.join(process.cwd(), 'data', 'pglite-cluster');

  fs.mkdirSync(path.dirname(dataDir), { recursive: true });

  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
    } catch {
      // ignore if in use
    }
  }

  const pglite = await PGlite.create({
    dataDir,
    relaxedDurability: true,
  });

  const localAdapter: DbAdapter = {
    engineName: isVercel
      ? 'PostgreSQL 16+ (Vercel Serverless Cluster)'
      : 'PostgreSQL 16+ (Local Persistent Cluster)',
    async query<T extends QueryResultRow = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<DbQueryResult<T>> {
      const res = await pglite.query<T>(sql, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
      };
    },
    async exec(sql: string): Promise<void> {
      await pglite.exec(sql);
    },
    async close(): Promise<void> {
      await pglite.close();
      globalThis.__royalMadridDbPromise = undefined;
    },
  };

  await ensureSchemaExists(localAdapter);
  return localAdapter;
}

export async function getDb(): Promise<DbAdapter> {
  if (!globalThis.__royalMadridDbPromise) {
    globalThis.__royalMadridDbPromise = createAdapter();
  }
  return globalThis.__royalMadridDbPromise;
}

export async function queryDb<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDb();
  const res = await db.query<T>(sql, params);
  return res.rows;
}
