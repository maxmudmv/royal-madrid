import { getDb } from '../src/lib/db';
import { runWeeklyHistoricalAudit } from '../src/lib/importer';

async function main() {
  console.log('==============================================================');
  console.log('ROYAL MADRID — WEEKLY HISTORICAL INTEGRITY & COVERAGE AUDIT');
  console.log('==============================================================');

  const result = await runWeeklyHistoricalAudit();
  console.log(`✔ Audit Run #${result.auditRunId} Complete`);
  console.log(`  • ${result.summary}`);

  const db = await getDb();
  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Weekly audit failed:', err);
  process.exit(1);
});
