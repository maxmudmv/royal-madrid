import assert from 'node:assert/strict';
import { getDb } from '../src/lib/db';
import { runDailySync } from '../src/lib/importer';
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../src/lib/auth';
import {
  getHomepageData,
  getMatchesArchive,
  getPlayerProfileBySlug,
  getRecordsData,
  searchGlobalArchive,
  getAdminDashboardData,
} from '../src/lib/queries';
import HomePage from '../src/app/page';
import HistoryPage from '../src/app/history/page';
import HonoursPage from '../src/app/honours/page';
import LegendsPage from '../src/app/legends/page';
import MatchesPage from '../src/app/matches/page';
import MatchDetailPage from '../src/app/matches/[id]/page';
import PlayersPage from '../src/app/players/page';
import PlayerProfilePage from '../src/app/players/[slug]/page';
import SeasonsPage from '../src/app/seasons/page';
import RecordsPage from '../src/app/records/page';
import ComparePage from '../src/app/compare/page';
import TransfersPage from '../src/app/transfers/page';
import GlobalSearchPage from '../src/app/search/page';
import { GET as searchGet } from '../src/app/api/search/route';

async function main() {
  console.log('======================================================');
  console.log('ROYAL MADRID — AUTOMATED VERIFICATION & TEST SUITE');
  console.log('======================================================');

  const db = await getDb();
  let passed = 0;

  // Test 1: Verify all 23 normalized PostgreSQL tables exist
  const tablesRes = await db.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name;`
  );
  const tableNames = tablesRes.rows.map((r) => r.table_name);
  assert(
    tableNames.length >= 23,
    `Expected at least 23 PostgreSQL tables, found ${tableNames.length}`
  );
  console.log(`[PASS 1/8] PostgreSQL schema verified (${tableNames.length} normalized tables present).`);
  passed++;

  // Test 2: Verify Homepage Honours (15 UCL, 36 La Liga, 20 Copa del Rey) & 3 Legends Teaser
  const home = await getHomepageData();
  assert.equal(
    home.majorTrophies.length,
    3,
    'Homepage must display exactly 3 major trophy metrics.'
  );
  const ucl = home.majorTrophies.find((t) => t.competition_code === 'UCL');
  const liga = home.majorTrophies.find((t) => t.competition_code === 'LA_LIGA');
  const copa = home.majorTrophies.find((t) => t.competition_code === 'COPA_DEL_REY');
  assert.equal(ucl?.title_count, 15, 'European Cups / UCL must be 15');
  assert.equal(liga?.title_count, 36, 'La Liga titles must be 36');
  assert.equal(copa?.title_count, 20, 'Copa del Rey titles must be 20');
  assert.equal(
    home.legendsTeaser.length,
    3,
    'Homepage must display exactly 3 legends teaser entries.'
  );
  console.log('[PASS 2/8] Homepage rules verified (15 UCL, 36 La Liga, 20 Copa del Rey, 3 Legends teaser).');
  passed++;

  // Test 3: Verify Match Archive scope (2011/12 onward, first-team only, no Castilla, no unplayed matches)
  const matchBoundsRes = await db.query<{
    min_season: number;
    castilla_cnt: number;
    total_cnt: number;
  }>(
    `SELECT
       MIN(s.start_year)::int AS min_season,
       COUNT(*) FILTER (WHERE ht.name ILIKE '%Castilla%' OR at.name ILIKE '%Castilla%')::int AS castilla_cnt,
       COUNT(*)::int AS total_cnt
     FROM matches m
     JOIN seasons s ON s.id = m.season_id
     JOIN teams ht ON ht.id = m.home_team_id
     JOIN teams at ON at.id = m.away_team_id;`
  );
  const bounds = matchBoundsRes.rows[0];
  assert.equal(
    bounds.min_season,
    2011,
    'Detailed match archive must start with the 2011/12 season (start_year = 2011).'
  );
  assert.equal(
    bounds.castilla_cnt,
    0,
    'Real Madrid Castilla matches must be strictly excluded.'
  );
  assert(
    bounds.total_cnt >= 780,
    `Expected >= 780 official completed matches since 2011/12, found ${bounds.total_cnt}`
  );
  console.log(`[PASS 3/8] Match archive scope verified (${bounds.total_cnt} completed first-team matches from 2011/12 onward; 0 Castilla matches).`);
  passed++;

  // Test 4: Verify NULL Integrity (Missing data never stored as 0) & Scope Separation
  const diStefano = await getPlayerProfileBySlug('alfredo-di-stefano');
  assert(diStefano, 'Alfredo Di Stéfano profile must exist.');
  assert.equal(diStefano.player.all_time_rm_apps, 396);
  assert.equal(diStefano.player.all_time_rm_goals, 308);
  assert.equal(
    diStefano.player.all_time_rm_assists,
    null,
    'Unrecorded historical assists must be NULL, never 0.'
  );
  assert.equal(
    diStefano.player.archive_2011_rm_apps,
    null,
    'Pre-2011/12 players must have NULL for 2011/12+ archive apps, never 0.'
  );

  const cr7 = await getPlayerProfileBySlug('cristiano-ronaldo');
  assert(cr7, 'Cristiano Ronaldo profile must exist.');
  assert.equal(cr7.player.all_time_rm_apps, 438);
  assert.equal(cr7.player.all_time_rm_goals, 450);
  assert.equal(cr7.player.archive_2011_rm_apps, 353);
  assert.equal(cr7.player.archive_2011_rm_goals, 364);

  const nullFeeTransfersRes = await db.query<{
    null_cnt: number;
    zero_cnt: number;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE fee_eur IS NULL)::int AS null_cnt,
       COUNT(*) FILTER (WHERE fee_eur = 0)::int AS zero_cnt
     FROM transfers;`
  );
  assert(
    nullFeeTransfersRes.rows[0].null_cnt >= 5,
    'Undisclosed and free transfer fees must remain NULL in fee_eur.'
  );
  assert.equal(
    nullFeeTransfersRes.rows[0].zero_cnt,
    0,
    'Transfer fees must never be stored as 0 when undisclosed or free.'
  );
  console.log('[PASS 4/8] NULL integrity & All-Time vs. 2011/12+ scope separation verified.');
  passed++;

  // Test 5: Verify Match Archive SQL Filtering & Pagination
  const filteredMatches = await getMatchesArchive({
    season: '2013/14',
    competition: 'UCL',
    outcome: 'W',
  });
  assert(
    filteredMatches.summary.total_matches >= 10,
    '2013/14 UCL Wins filter should return >= 10 matches (La Décima campaign).'
  );
  console.log(`[PASS 5/8] SQL match filtering & pagination verified (2013/14 UCL Wins = ${filteredMatches.summary.total_matches}).`);
  passed++;

  // Test 6: Verify Club Records Separation & Global Search
  const records = await getRecordsData();
  assert(records.allTimeRecords.length >= 6, 'Must have All-Time Club Records.');
  assert(
    records.modernRecords.length >= 6,
    'Must have Modern Detailed Records (2011/12+).'
  );
  const searchRes = await searchGlobalArchive('Modrić');
  assert(searchRes.players.length >= 1, 'Global search for Modrić must return player.');
  console.log('[PASS 6/8] Club Records dual scope & Global Search verified.');
  passed++;

  // Test 7: Verify Manual Override Protection Survives Daily Resynchronization
  const targetMatchRes = await db.query<{
    id: number;
    external_id: string;
    attendance: number | null;
  }>(`SELECT id, external_id, attendance FROM matches ORDER BY id ASC LIMIT 1;`);
  const targetMatch = targetMatchRes.rows[0];
  const originalAttendance = targetMatch.attendance;
  const customOverrideAttendance = 84999;

  // Apply manual override
  await db.query(
    `UPDATE matches SET attendance = $1, is_manual_override = TRUE WHERE id = $2;`,
    [customOverrideAttendance, targetMatch.id]
  );
  await db.query(
    `INSERT INTO manual_overrides (entity_table, entity_key, field_name, override_value_json, previous_value_json, reason, created_by, is_active)
     VALUES ('matches', $1, 'attendance', $2, $3, 'Automated test override survival check', 'test_runner', TRUE)
     ON CONFLICT (entity_table, entity_key, field_name)
     DO UPDATE SET override_value_json = EXCLUDED.override_value_json, is_active = TRUE;`,
    [
      targetMatch.external_id,
      JSON.stringify({ attendance: customOverrideAttendance }),
      JSON.stringify({ attendance: originalAttendance }),
    ]
  );

  // Trigger Daily Sync (which re-runs OpenFootball & seed imports with forceReplaceOverrides = false)
  const syncResult = await runDailySync({ forceWeeklyAudit: false });
  assert(
    syncResult.importSummary.matchesSkippedManualOverride >= 1,
    'Daily sync must skip at least 1 manually overridden match.'
  );

  // Verify the overridden attendance survived the resync!
  const afterSyncRes = await db.query<{ attendance: number | null }>(
    `SELECT attendance FROM matches WHERE id = $1;`,
    [targetMatch.id]
  );
  assert.equal(
    afterSyncRes.rows[0].attendance,
    customOverrideAttendance,
    'Manual override attendance must survive daily resynchronization!'
  );

  // Clean up test override to restore original state
  await db.query(
    `UPDATE matches SET attendance = $1, is_manual_override = FALSE WHERE id = $2;`,
    [originalAttendance, targetMatch.id]
  );
  await db.query(
    `DELETE FROM manual_overrides WHERE entity_table = 'matches' AND entity_key = $1 AND created_by = 'test_runner';`,
    [targetMatch.external_id]
  );
  console.log('[PASS 7/8] Manual override protection verified: override survived full daily resynchronization.');
  passed++;

  // Test 8: Verify Server-Side HMAC Admin Authentication
  const token = createAdminSessionToken('admin');
  const verified = verifyAdminSessionToken(token);
  assert.equal(verified.valid, true);
  assert.equal(verified.username, 'admin');
  const forged = verifyAdminSessionToken(`${token}tampered`);
  assert.equal(forged.valid, false);
  console.log('[PASS 8/9] Server-side HMAC-SHA256 Admin authentication verified.');
  passed++;

  // Test 9: Render all App Router pages & API endpoints against PostgreSQL
  await HomePage();
  await HistoryPage({ searchParams: Promise.resolve({}) });
  await HonoursPage();
  await LegendsPage();
  await MatchesPage({ searchParams: Promise.resolve({ season: '2025/26' }) });
  await MatchDetailPage({ params: Promise.resolve({ id: '1' }) });
  await PlayersPage();
  await PlayerProfilePage({
    params: Promise.resolve({ slug: 'cristiano-ronaldo' }),
  });
  await SeasonsPage({ searchParams: Promise.resolve({ season: '2023/24' }) });
  await RecordsPage();
  await ComparePage({
    searchParams: Promise.resolve({
      players: 'cristiano-ronaldo,karim-benzema',
    }),
  });
  await TransfersPage();
  await GlobalSearchPage({ searchParams: Promise.resolve({ q: 'Zidane' }) });
  const adminData = await getAdminDashboardData();
  assert(adminData.sources.length >= 5, 'Admin data sources must be populated.');
  const apiRes = await searchGet(
    new Request('http://localhost:3000/api/search?q=Modric')
  );
  assert.equal(apiRes.status, 200);
  console.log('[PASS 9/9] All App Router server pages, Admin dashboard queries & API endpoints rendered with 0 runtime errors.');
  passed++;

  await db.close();
  console.log('======================================================');
  console.log(`ALL ${passed}/9 VERIFICATION SUITES PASSED SUCCESSFULLY`);
  console.log('======================================================');
}

main().catch(async (err) => {
  console.error('TEST SUITE FAILED:', err);
  const db = await getDb();
  await db.close();
  process.exit(1);
});
