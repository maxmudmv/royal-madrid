import fs from 'fs';
import path from 'path';
import { getDb } from '../src/lib/db';

async function runMigrations() {
  console.log('==============================================================');
  console.log('ROYAL MADRID — POSTGRESQL DATABASE MIGRATION');
  console.log('==============================================================');

  const db = await getDb();
  console.log(`Connected to engine: ${db.engineName}`);

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Applying migration: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await db.exec(sql);
    console.log(`✔ Successfully applied ${file}`);
  }

  const tablesRes = await db.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
  );
  console.log(
    `\nVerified ${tablesRes.rows.length} PostgreSQL tables in public schema:`
  );
  console.log(tablesRes.rows.map((r) => `  • ${r.table_name}`).join('\n'));
  await db.close();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
