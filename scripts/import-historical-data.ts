import { getDb } from '../src/lib/db';
import { runFullHistoricalImport } from '../src/lib/importer';

async function main() {
  console.log('==============================================================');
  console.log('ROYAL MADRID — HISTORICAL DATA IMPORT (2011/12+ & ALL-TIME)');
  console.log('==============================================================');

  const summary = await runFullHistoricalImport({
    forceReplaceOverrides: false,
  });

  console.log('\n✔ Historical Import Complete:');
  console.log(`  • Import Run ID:                   #${summary.runId}`);
  console.log(`  • Official Completed Matches:      ${summary.matchesInsertedOrUpdated}`);
  console.log(`  • Detailed Lineup/Event Matches:   ${summary.detailedMatchesWithLineupsOrEvents}`);
  console.log(`  • Manual Overrides Protected:      ${summary.matchesSkippedManualOverride}`);
  console.log(`  • Verified Player Profiles:        ${summary.playersCount}`);
  console.log(`  • Verified Historical Transfers:   ${summary.transfersCount}`);
  console.log(`  • Verified Trophy Categories:      ${summary.trophiesCount}`);
  console.log(`  • Verified Legends & Managers:     ${summary.legendsCount}`);
  console.log(`  • Verified Timeline Milestones:    ${summary.historicalEventsCount}`);
  console.log(`  • Verified Club Records:           ${summary.recordsCount}`);

  const db = await getDb();
  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
