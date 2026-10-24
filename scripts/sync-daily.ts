import { getDb } from '../src/lib/db';
import { runDailySync } from '../src/lib/importer';

async function main() {
  console.log('==============================================================');
  console.log('ROYAL MADRID — DAILY COMPLETED-MATCH SYNCHRONIZATION');
  console.log('==============================================================');

  const result = await runDailySync({ runWeeklyAuditIfSunday: true });
  console.log(`✔ Sync Run #${result.syncRunId} Complete`);
  console.log(`  • Matches Synchronized: ${result.importSummary.matchesInsertedOrUpdated}`);
  console.log(`  • Manual Overrides Preserved: ${result.importSummary.matchesSkippedManualOverride}`);
  console.log(`  • football-data.org: ${result.fdoStatus}`);
  console.log(`  • API-Football: ${result.apiFootballStatus}`);
  if (result.weeklyAuditResult) {
    console.log(`  • Conditional Weekly Audit: ${result.weeklyAuditResult.summary}`);
  }

  const db = await getDb();
  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Daily sync failed:', err);
  process.exit(1);
});
