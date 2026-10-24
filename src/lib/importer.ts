import { getDb } from './db';
import {
  loadAllOpenFootballRealMadridMatches,
  ParsedMatch,
} from './parsers/openfootball-parser';
import {
  getVerified2011_12LaLigaMatches,
  VERIFIED_HISTORICAL_EVENTS,
  VERIFIED_LEGENDS,
  VERIFIED_MAJOR_FINALS_MATCHES,
  VERIFIED_MANAGERS,
  VERIFIED_TROPHIES,
} from './seed-data';
import {
  VERIFIED_CLUB_RECORDS,
  VERIFIED_DATA_QUALITY_ISSUES,
  VERIFIED_DATA_SOURCES,
  VERIFIED_PLAYER_SEASON_STATS,
  VERIFIED_PLAYERS,
  VERIFIED_SOURCE_COVERAGE,
  VERIFIED_TRANSFERS,
} from './seed-players-transfers-records';
import {
  fetchApiFootballCompletedMatches,
  fetchFootballDataOrgCompletedMatches,
} from './providers/football-apis';

export interface ImportSummary {
  runId: number;
  matchesProcessed: number;
  matchesInsertedOrUpdated: number;
  matchesSkippedManualOverride: number;
  detailedMatchesWithLineupsOrEvents: number;
  playersCount: number;
  transfersCount: number;
  trophiesCount: number;
  legendsCount: number;
  historicalEventsCount: number;
  recordsCount: number;
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SEASON_METADATA: Record<
  string,
  {
    manager: string;
    trophies: string[];
    summary: string;
    status: 'Verified' | 'Partial';
    notes: string;
  }
> = {
  '2011/12': {
    manager: 'José Mourinho',
    trophies: ['La Liga (32nd Title — Record 100 Points & 121 Goals)'],
    summary:
      'Historic "Liga de los Récords" campaign: Real Madrid won La Liga with an all-time Spanish record 100 points and 121 goals scored (32W 4D 2L), reaching the UEFA Champions League semifinals.',
    status: 'Verified',
    notes: 'All 38 La Liga matches (with Real Madrid goalscorers) and all 12 UCL matches verified.',
  },
  '2012/13': {
    manager: 'José Mourinho',
    trophies: ['Supercopa de España (2012)'],
    summary:
      'Captured the Supercopa de España against FC Barcelona, finished runners-up in La Liga (85 points) and Copa del Rey, and reached a third straight UEFA Champions League semifinal.',
    status: 'Verified',
    notes: 'All 38 La Liga and 12 UCL matches verified via OpenFootball.',
  },
  '2013/14': {
    manager: 'Carlo Ancelotti',
    trophies: ['UEFA Champions League (La Décima)', 'Copa del Rey (19th Title)'],
    summary:
      'Carlo Ancelotti’s debut campaign delivered the historic La Décima in Lisbon (4-1 a.e.t. vs Atlético Madrid) and the Copa del Rey Final triumph vs FC Barcelona (2-1) at Mestalla.',
    status: 'Verified',
    notes: 'All 38 La Liga matches, all 13 UCL matches, and Copa del Rey Final verified.',
  },
  '2014/15': {
    manager: 'Carlo Ancelotti',
    trophies: ['UEFA Super Cup (2014)', 'FIFA Club World Cup (2014)'],
    summary:
      'Recorded a club-record 22-match winning streak across all competitions during autumn 2014, capturing the UEFA Super Cup in Cardiff and the FIFA Club World Cup in Marrakech.',
    status: 'Verified',
    notes: 'All 38 La Liga and 12 UCL matches verified via OpenFootball.',
  },
  '2015/16': {
    manager: 'Rafael Benítez / Zinedine Zidane',
    trophies: ['UEFA Champions League (La Undécima)'],
    summary:
      'Zinedine Zidane took charge in January 2016, leading a 12-match consecutive La Liga winning run and capturing La Undécima in Milan against Atlético Madrid.',
    status: 'Verified',
    notes: 'All 38 La Liga and 13 UCL matches verified via OpenFootball.',
  },
  '2016/17': {
    manager: 'Zinedine Zidane',
    trophies: [
      'UEFA Champions League (La Duodécima)',
      'La Liga (33rd Title)',
      'UEFA Super Cup (2016)',
      'FIFA Club World Cup (2016)',
    ],
    summary:
      'One of the greatest seasons in club history: Real Madrid won their first La Liga–European Cup double since 1958, set a 40-match unbeaten streak, and defeated Juventus 4-1 in Cardiff.',
    status: 'Verified',
    notes: 'All 38 La Liga and 13 UCL matches verified via OpenFootball.',
  },
  '2017/18': {
    manager: 'Zinedine Zidane',
    trophies: [
      'UEFA Champions League (La Decimotercera)',
      'UEFA Super Cup (2017)',
      'Supercopa de España (2017)',
      'FIFA Club World Cup (2017)',
    ],
    summary:
      'Completed an unprecedented modern UEFA Champions League three-peat by defeating PSG, Juventus, Bayern Munich, and Liverpool (3-1 in Kyiv) alongside three Super Cup / Club World Cup trophies.',
    status: 'Verified',
    notes: 'All 38 La Liga and 13 UCL matches verified via OpenFootball.',
  },
  '2018/19': {
    manager: 'Julen Lopetegui / Santiago Solari / Zinedine Zidane',
    trophies: ['FIFA Club World Cup (2018)'],
    summary:
      'Transitional season following Cristiano Ronaldo’s departure; Real Madrid won a third straight FIFA Club World Cup in Abu Dhabi.',
    status: 'Verified',
    notes: 'All 38 La Liga and 8 UCL matches verified via OpenFootball.',
  },
  '2019/20': {
    manager: 'Zinedine Zidane',
    trophies: ['La Liga (34th Title)', 'Supercopa de España (2020)'],
    summary:
      'Built on the best defensive record in Europe (25 goals conceded in 38 league games), Real Madrid won 10 consecutive post-lockdown matches to clinch their 34th La Liga title.',
    status: 'Verified',
    notes: 'All 38 La Liga and 8 UCL matches verified via OpenFootball.',
  },
  '2020/21': {
    manager: 'Zinedine Zidane',
    trophies: [],
    summary:
      'Fought for the La Liga title until the final matchday (84 points) and reached the UEFA Champions League semifinals despite over 60 squad injuries.',
    status: 'Verified',
    notes: 'All 38 La Liga, 12 UCL, and Copa del Rey matches verified via OpenFootball.',
  },
  '2021/22': {
    manager: 'Carlo Ancelotti',
    trophies: [
      'UEFA Champions League (La Decimocuarta)',
      'La Liga (35th Title)',
      'Supercopa de España (2022)',
    ],
    summary:
      'Legendary campaign of Bernabéu comebacks against PSG, Chelsea, and Manchester City, culminating in a 1-0 UCL Final victory over Liverpool in Paris and the 35th La Liga crown.',
    status: 'Verified',
    notes: 'All 38 La Liga, 13 UCL, and 3 Copa del Rey matches verified via OpenFootball.',
  },
  '2022/23': {
    manager: 'Carlo Ancelotti',
    trophies: [
      'Copa del Rey (20th Title)',
      'UEFA Super Cup (2022)',
      'FIFA Club World Cup (2022)',
    ],
    summary:
      'Captured the club’s 20th Copa del Rey title in Seville (2-1 vs Osasuna), the 5th FIFA Club World Cup in Rabat, and the UEFA Super Cup in Helsinki.',
    status: 'Verified',
    notes: 'All 38 La Liga, 12 UCL, 6 Copa del Rey, and CWC Final matches verified.',
  },
  '2023/24': {
    manager: 'Carlo Ancelotti',
    trophies: [
      'UEFA Champions League (La Decimoquinta)',
      'La Liga (36th Title)',
      'Supercopa de España (2024)',
    ],
    summary:
      'Unbeaten throughout the entire UEFA Champions League campaign (Wembley 2-0 vs Borussia Dortmund) and dominant 36th La Liga title with 95 points and only one league defeat.',
    status: 'Verified',
    notes: 'All 38 La Liga, 13 UCL, 2 Copa del Rey, and Supercopa Final matches verified.',
  },
  '2024/25': {
    manager: 'Carlo Ancelotti',
    trophies: ['UEFA Super Cup (2024)', 'FIFA Intercontinental Cup (2024)'],
    summary:
      'Kylian Mbappé’s debut campaign began with the record 6th UEFA Super Cup title in Warsaw (2-0 vs Atalanta) and the FIFA Intercontinental Cup triumph in Lusail (3-0 vs Pachuca).',
    status: 'Verified',
    notes: 'All 38 La Liga, 14 UCL, 6 Copa del Rey, UEFA Super Cup, and Intercontinental Cup matches verified.',
  },
  '2025/26': {
    manager: 'Carlo Ancelotti / Xabi Alonso',
    trophies: [],
    summary:
      'Full 38-match La Liga campaign with complete match-by-match lineups, substitutions, cards, goalscorers, referees, and attendance from OpenFootball 1-liga-full.txt, plus 14 UCL fixtures.',
    status: 'Verified',
    notes: 'Complete match-level granularity (lineups, substitutions, cards, goalscorers) verified across all 38 La Liga matches.',
  },
  '2026/27': {
    manager: 'Xabi Alonso',
    trophies: [],
    summary:
      'Partial / In-Progress 2026/27 Season: Only officially completed matches with verified final scores are included. Unplayed future fixtures are excluded per archive policy.',
    status: 'Partial',
    notes: 'Partial season (7 completed La Liga matches recorded as of October 2026; future fixtures excluded).',
  },
};

export async function runFullHistoricalImport(options?: {
  forceReplaceOverrides?: boolean;
}): Promise<ImportSummary> {
  const db = await getDb();
  const forceReplace = options?.forceReplaceOverrides ?? false;

  const runInsert = await db.query<{ id: number }>(
    `INSERT INTO data_import_runs (run_type, source_name, status, summary)
     VALUES ('OPENFOOTBALL_IMPORT', 'OpenFootball + Verified Historical Archive', 'RUNNING', 'Full historical & statistical import in progress')
     RETURNING id;`
  );
  const runId = runInsert.rows[0].id;

  let matchesProcessed = 0;
  let matchesInsertedOrUpdated = 0;
  let matchesSkippedManualOverride = 0;
  let detailedCount = 0;

  try {
    // 1. Seed Data Sources
    const sourceIdByCode = new Map<string, number>();
    for (const src of VERIFIED_DATA_SOURCES) {
      const res = await db.query<{ id: number }>(
        `INSERT INTO data_sources (
          code, name, provider_type, base_url, license, terms_summary,
          free_tier_limits, rate_limit_per_minute, daily_quota_limit,
          status, is_enabled, priority_rank, notes, last_checked_at, last_sync_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          license = EXCLUDED.license,
          terms_summary = EXCLUDED.terms_summary,
          free_tier_limits = EXCLUDED.free_tier_limits,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          last_checked_at = NOW(),
          updated_at = NOW()
        RETURNING id;`,
        [
          src.code,
          src.name,
          src.provider_type,
          src.base_url,
          src.license,
          src.terms_summary,
          src.free_tier_limits,
          src.rate_limit_per_minute,
          src.daily_quota_limit,
          src.status,
          src.is_enabled,
          src.priority_rank,
          src.notes,
        ]
      );
      sourceIdByCode.set(src.code, res.rows[0].id);
    }

    // 2. Seed Source Coverage Report
    for (const cov of VERIFIED_SOURCE_COVERAGE) {
      await db.query(
        `INSERT INTO source_coverage (
          competition_code, competition_name, season_code, available_fields,
          missing_fields, source_name, license, completeness_status,
          matches_covered, matches_expected, last_checked_date, known_gaps
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_DATE,$11)
        ON CONFLICT (competition_code, season_code, source_name) DO UPDATE SET
          available_fields = EXCLUDED.available_fields,
          missing_fields = EXCLUDED.missing_fields,
          completeness_status = EXCLUDED.completeness_status,
          matches_covered = EXCLUDED.matches_covered,
          matches_expected = EXCLUDED.matches_expected,
          last_checked_date = CURRENT_DATE,
          known_gaps = EXCLUDED.known_gaps;`,
        [
          cov.competition_code,
          cov.competition_name,
          cov.season_code,
          cov.available_fields,
          cov.missing_fields,
          cov.source_name,
          cov.license,
          cov.completeness_status,
          cov.matches_covered,
          cov.matches_expected,
          cov.known_gaps,
        ]
      );
    }

    // 3. Seed Competitions
    const competitionsList = [
      { code: 'LA_LIGA', name: 'La Liga (Primera División)', short_name: 'La Liga', historical_names: 'Campeonato Nacional de Liga de Primera División (1929–present)', type: 'DOMESTIC_LEAGUE', org: 'RFEF / La Liga', order: 1 },
      { code: 'UCL', name: 'UEFA Champions League', short_name: 'Champions League', historical_names: "European Champion Clubs' Cup (1955–1992); UEFA Champions League (1992–present)", type: 'EUROPEAN_CUP', org: 'UEFA', order: 2 },
      { code: 'COPA_DEL_REY', name: 'Copa del Rey', short_name: 'Copa del Rey', historical_names: 'Campeonato de España - Copa de S.M. el Rey (1903–present)', type: 'DOMESTIC_CUP', org: 'RFEF', order: 3 },
      { code: 'SUPERCOPA_ESP', name: 'Supercopa de España', short_name: 'Supercopa', historical_names: 'Supercopa de España (1982–present)', type: 'DOMESTIC_SUPER_CUP', org: 'RFEF', order: 4 },
      { code: 'UEFA_SUPER_CUP', name: 'UEFA Super Cup', short_name: 'UEFA Super Cup', historical_names: 'European Super Cup (1973–1994); UEFA Super Cup (1995–present)', type: 'EUROPEAN_SUPER_CUP', org: 'UEFA', order: 5 },
      { code: 'FIFA_CWC', name: 'FIFA Club World Cup', short_name: 'Club World Cup', historical_names: 'FIFA Club World Championship (2000–2005); FIFA Club World Cup (2006–present)', type: 'GLOBAL_CUP', org: 'FIFA', order: 6 },
      { code: 'INTERCONTINENTAL', name: 'FIFA Intercontinental Cup', short_name: 'Intercontinental Cup', historical_names: 'Intercontinental Cup (1960–2004); FIFA Intercontinental Cup (2024–present)', type: 'GLOBAL_CUP', org: 'FIFA / UEFA / CONMEBOL', order: 7 },
    ];

    const compIdByCode = new Map<string, number>();
    for (const c of competitionsList) {
      const res = await db.query<{ id: number }>(
        `INSERT INTO competitions (code, name, short_name, historical_names, competition_type, organizer, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           short_name = EXCLUDED.short_name,
           historical_names = EXCLUDED.historical_names
         RETURNING id;`,
        [c.code, c.name, c.short_name, c.historical_names, c.type, c.org, c.order]
      );
      compIdByCode.set(c.code, res.rows[0].id);
    }

    // 4. Seed Seasons (2011/12 through 2026/27)
    const seasonIdByCode = new Map<string, number>();
    for (let startYear = 2011; startYear <= 2026; startYear++) {
      const endYear = startYear + 1;
      const code = `${startYear}/${String(endYear).slice(-2)}`;
      const meta = SEASON_METADATA[code] || {
        manager: 'Real Madrid Head Coach',
        trophies: [],
        summary: `Official ${code} campaign.`,
        status: 'Verified' as const,
        notes: 'Verified from OpenFootball archive.',
      };
      const res = await db.query<{ id: number }>(
        `INSERT INTO seasons (
          code, start_year, end_year, is_detailed_archive,
          manager_names, trophies_won, season_summary,
          completeness_status, coverage_notes, source_id
        ) VALUES ($1,$2,$3,TRUE,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (code) DO UPDATE SET
          manager_names = EXCLUDED.manager_names,
          trophies_won = EXCLUDED.trophies_won,
          season_summary = EXCLUDED.season_summary,
          completeness_status = EXCLUDED.completeness_status,
          coverage_notes = EXCLUDED.coverage_notes
        RETURNING id;`,
        [
          code,
          startYear,
          endYear,
          meta.manager,
          meta.trophies,
          meta.summary,
          meta.status,
          meta.notes,
          sourceIdByCode.get('OPENFOOTBALL_ESPANA') ?? null,
        ]
      );
      seasonIdByCode.set(code, res.rows[0].id);
    }

    // 5. Seed Verified Players first so matches can link player_id!
    const playerIdBySlug = new Map<string, number>();
    const playerIdByNormalizedName = new Map<string, number>();

    for (const p of VERIFIED_PLAYERS) {
      const existing = await db.query<{ id: number; is_manual_override: boolean }>(
        `SELECT id, is_manual_override FROM players WHERE slug = $1;`,
        [p.slug]
      );
      if (existing.rows[0]?.is_manual_override && !forceReplace) {
        playerIdBySlug.set(p.slug, existing.rows[0].id);
        playerIdByNormalizedName.set(p.short_name.toLowerCase(), existing.rows[0].id);
        playerIdByNormalizedName.set(p.full_name.toLowerCase(), existing.rows[0].id);
        continue;
      }

      const res = await db.query<{ id: number }>(
        `INSERT INTO players (
          slug, external_id, full_name, short_name, position, detailed_position,
          nationality, birth_year, shirt_number, rm_tenure_start, rm_tenure_end,
          tenure_display, is_featured, is_legend, portrait_url, portrait_attribution,
          bio_summary, all_time_rm_apps, all_time_rm_goals, all_time_rm_assists,
          all_time_rm_minutes, all_time_rm_yellow_cards, all_time_rm_red_cards,
          all_time_rm_trophies, all_time_scope_note, archive_2011_rm_apps,
          archive_2011_rm_goals, archive_2011_rm_assists, archive_2011_rm_minutes,
          archive_2011_rm_starts, archive_2011_rm_sub_apps, archive_2011_rm_yellow_cards,
          archive_2011_rm_red_cards, archive_scope_note, major_honours,
          individual_awards, completeness_status, source_id, source_citation, source_url
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
          $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,
          $35,$36,$37,$38,$39,$40
        )
        ON CONFLICT (slug) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          short_name = EXCLUDED.short_name,
          position = EXCLUDED.position,
          detailed_position = EXCLUDED.detailed_position,
          tenure_display = EXCLUDED.tenure_display,
          is_featured = EXCLUDED.is_featured,
          is_legend = EXCLUDED.is_legend,
          portrait_url = EXCLUDED.portrait_url,
          bio_summary = EXCLUDED.bio_summary,
          all_time_rm_apps = EXCLUDED.all_time_rm_apps,
          all_time_rm_goals = EXCLUDED.all_time_rm_goals,
          all_time_rm_assists = EXCLUDED.all_time_rm_assists,
          all_time_rm_minutes = EXCLUDED.all_time_rm_minutes,
          all_time_rm_trophies = EXCLUDED.all_time_rm_trophies,
          all_time_scope_note = EXCLUDED.all_time_scope_note,
          archive_2011_rm_apps = EXCLUDED.archive_2011_rm_apps,
          archive_2011_rm_goals = EXCLUDED.archive_2011_rm_goals,
          archive_2011_rm_assists = EXCLUDED.archive_2011_rm_assists,
          archive_2011_rm_minutes = EXCLUDED.archive_2011_rm_minutes,
          archive_scope_note = EXCLUDED.archive_scope_note,
          major_honours = EXCLUDED.major_honours,
          individual_awards = EXCLUDED.individual_awards,
          last_updated_at = NOW()
        RETURNING id;`,
        [
          p.slug,
          p.external_id,
          p.full_name,
          p.short_name,
          p.position,
          p.detailed_position,
          p.nationality,
          p.birth_year,
          p.shirt_number,
          p.rm_tenure_start,
          p.rm_tenure_end,
          p.tenure_display,
          p.is_featured,
          p.is_legend,
          p.portrait_url,
          p.portrait_attribution,
          p.bio_summary,
          p.all_time_rm_apps,
          p.all_time_rm_goals,
          p.all_time_rm_assists,
          p.all_time_rm_minutes,
          p.all_time_rm_yellow_cards,
          p.all_time_rm_red_cards,
          p.all_time_rm_trophies,
          p.all_time_scope_note,
          p.archive_2011_rm_apps,
          p.archive_2011_rm_goals,
          p.archive_2011_rm_assists,
          p.archive_2011_rm_minutes,
          p.archive_2011_rm_starts,
          p.archive_2011_rm_sub_apps,
          p.archive_2011_rm_yellow_cards,
          p.archive_2011_rm_red_cards,
          p.archive_scope_note,
          p.major_honours,
          p.individual_awards,
          p.completeness_status,
          sourceIdByCode.get('CURATED_HISTORICAL_ARCHIVE') ?? null,
          p.source_citation,
          p.source_url,
        ]
      );
      const pid = res.rows[0].id;
      playerIdBySlug.set(p.slug, pid);
      playerIdByNormalizedName.set(p.short_name.toLowerCase(), pid);
      playerIdByNormalizedName.set(p.full_name.toLowerCase(), pid);
      // Also map accent-stripped name
      playerIdByNormalizedName.set(slugify(p.short_name).replace(/-/g, ' '), pid);
    }

    // 6. Seed Player Season & Competition Breakdowns
    for (const pss of VERIFIED_PLAYER_SEASON_STATS) {
      const pid = playerIdBySlug.get(pss.player_slug);
      const sid = seasonIdByCode.get(pss.season_code);
      const cid = compIdByCode.get(pss.competition_code);
      if (!pid || !sid || !cid) continue;

      await db.query(
        `INSERT INTO player_season_stats (
          player_id, season_id, competition_id, appearances, starts,
          sub_appearances, goals, assists, minutes_played, yellow_cards,
          red_cards, clean_sheets, completeness_status, source_citation
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Verified','Official La Liga & UEFA Season Statistics')
        ON CONFLICT (player_id, season_id, competition_id) DO UPDATE SET
          appearances = EXCLUDED.appearances,
          starts = EXCLUDED.starts,
          sub_appearances = EXCLUDED.sub_appearances,
          goals = EXCLUDED.goals,
          assists = EXCLUDED.assists,
          minutes_played = EXCLUDED.minutes_played,
          yellow_cards = EXCLUDED.yellow_cards,
          red_cards = EXCLUDED.red_cards
        WHERE player_season_stats.is_manual_override = FALSE;`,
        [
          pid,
          sid,
          cid,
          pss.appearances,
          pss.starts,
          pss.sub_appearances,
          pss.goals,
          pss.assists,
          pss.minutes_played,
          pss.yellow_cards,
          pss.red_cards,
          pss.clean_sheets,
        ]
      );
    }

    // 7. Combine all Verified Completed Matches (OpenFootball + 2011/12 La Liga + Finals Enrichment)
    const openFootballMatches = loadAllOpenFootballRealMadridMatches(process.cwd());
    const laLiga2011Matches = getVerified2011_12LaLigaMatches();
    const allMatchesMap = new Map<string, ParsedMatch>();

    for (const m of [...laLiga2011Matches, ...openFootballMatches]) {
      const compositeKey = `${m.seasonCode}|${m.competitionCode}|${m.matchDate}|${m.homeTeam}|${m.awayTeam}`;
      allMatchesMap.set(compositeKey, m);
    }

    // Enrich or add VERIFIED_MAJOR_FINALS_MATCHES (so UCL Finals have full lineups, events, venues, attendance!)
    for (const fin of VERIFIED_MAJOR_FINALS_MATCHES) {
      const compositeKey = `${fin.seasonCode}|${fin.competitionCode}|${fin.matchDate}|${fin.homeTeam}|${fin.awayTeam}`;
      allMatchesMap.set(compositeKey, fin);
    }

    const teamIdByName = new Map<string, number>();
    const ensureTeam = async (teamName: string): Promise<number> => {
      const cached = teamIdByName.get(teamName);
      if (cached) return cached;
      const slug = slugify(teamName);
      const isRM = teamName === 'Real Madrid CF';
      const res = await db.query<{ id: number }>(
        `INSERT INTO teams (slug, name, short_name, is_real_madrid)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (name) DO UPDATE SET is_real_madrid = EXCLUDED.is_real_madrid
         RETURNING id;`,
        [slug, teamName, teamName.replace(/\s+CF$|\s+FC$/i, ''), isRM]
      );
      const tid = res.rows[0].id;
      teamIdByName.set(teamName, tid);
      return tid;
    };

    const resolvePlayerId = (rawName: string): number | null => {
      const lower = rawName.toLowerCase().trim();
      if (playerIdByNormalizedName.has(lower)) {
        return playerIdByNormalizedName.get(lower)!;
      }
      const norm = slugify(rawName).replace(/-/g, ' ');
      if (playerIdByNormalizedName.has(norm)) {
        return playerIdByNormalizedName.get(norm)!;
      }
      // Match by surname for well-known players in 2025/26 full dataset
      for (const [k, id] of playerIdByNormalizedName.entries()) {
        if (norm.includes(k) || k.includes(norm)) {
          return id;
        }
      }
      return null;
    };

    const sortedMatches = Array.from(allMatchesMap.values()).sort((a, b) =>
      a.matchDate.localeCompare(b.matchDate)
    );

    for (const m of sortedMatches) {
      matchesProcessed++;
      const sid = seasonIdByCode.get(m.seasonCode);
      const cid = compIdByCode.get(m.competitionCode);
      if (!sid || !cid) continue;

      const homeTeamId = await ensureTeam(m.homeTeam);
      const awayTeamId = await ensureTeam(m.awayTeam);

      // Check if an existing match has a manual override!
      const existingMatch = await db.query<{
        id: number;
        is_manual_override: boolean;
      }>(
        `SELECT id, is_manual_override FROM matches
         WHERE season_id = $1 AND competition_id = $2 AND match_date = $3
           AND home_team_id = $4 AND away_team_id = $5;`,
        [sid, cid, m.matchDate, homeTeamId, awayTeamId]
      );

      const overrideRow = await db.query<{ id: number }>(
        `SELECT id FROM manual_overrides
         WHERE entity_table = 'matches' AND entity_key = $1 AND is_active = TRUE;`,
        [m.externalId]
      );

      if (
        (existingMatch.rows[0]?.is_manual_override ||
          overrideRow.rows.length > 0) &&
        !forceReplace
      ) {
        matchesSkippedManualOverride++;
        continue;
      }

      const sourceId = m.externalId.startsWith('openfootball_ucl')
        ? sourceIdByCode.get('OPENFOOTBALL_UCL')
        : m.externalId.startsWith('openfootball_')
        ? sourceIdByCode.get('OPENFOOTBALL_ESPANA')
        : sourceIdByCode.get('CURATED_HISTORICAL_ARCHIVE');

      const matchRes = await db.query<{ id: number }>(
        `INSERT INTO matches (
          external_id, season_id, competition_id, stage, matchday, match_date,
          kickoff_time, home_team_id, away_team_id, venue, city, attendance,
          referee, home_score, away_score, ht_home_score, ht_away_score,
          aet_home_score, aet_away_score, pen_home_score, pen_away_score,
          went_to_extra_time, went_to_penalties, rm_is_home, rm_goals,
          opponent_goals, rm_result, has_detailed_events, has_lineups,
          completeness_status, source_id, source_citation, last_synced_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
          $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,NOW(),NOW()
        )
        ON CONFLICT (season_id, competition_id, match_date, home_team_id, away_team_id)
        DO UPDATE SET
          stage = COALESCE(EXCLUDED.stage, matches.stage),
          matchday = COALESCE(EXCLUDED.matchday, matches.matchday),
          kickoff_time = COALESCE(EXCLUDED.kickoff_time, matches.kickoff_time),
          venue = COALESCE(EXCLUDED.venue, matches.venue),
          city = COALESCE(EXCLUDED.city, matches.city),
          attendance = COALESCE(EXCLUDED.attendance, matches.attendance),
          referee = COALESCE(EXCLUDED.referee, matches.referee),
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score,
          ht_home_score = COALESCE(EXCLUDED.ht_home_score, matches.ht_home_score),
          ht_away_score = COALESCE(EXCLUDED.ht_away_score, matches.ht_away_score),
          went_to_extra_time = EXCLUDED.went_to_extra_time,
          went_to_penalties = EXCLUDED.went_to_penalties,
          rm_goals = EXCLUDED.rm_goals,
          opponent_goals = EXCLUDED.opponent_goals,
          rm_result = EXCLUDED.rm_result,
          has_detailed_events = EXCLUDED.has_detailed_events OR matches.has_detailed_events,
          has_lineups = EXCLUDED.has_lineups OR matches.has_lineups,
          completeness_status = CASE
            WHEN EXCLUDED.completeness_status = 'Verified' THEN 'Verified'
            ELSE matches.completeness_status
          END,
          source_citation = EXCLUDED.source_citation,
          last_synced_at = NOW(),
          updated_at = NOW()
        RETURNING id;`,
        [
          m.externalId,
          sid,
          cid,
          m.stage,
          m.matchday,
          m.matchDate,
          m.kickoffTime,
          homeTeamId,
          awayTeamId,
          m.venue,
          m.city,
          m.attendance,
          m.referee,
          m.homeScore,
          m.awayScore,
          m.htHomeScore,
          m.htAwayScore,
          m.aetHomeScore,
          m.aetAwayScore,
          m.penHomeScore,
          m.penAwayScore,
          m.wentToExtraTime,
          m.wentToPenalties,
          m.rmIsHome,
          m.rmGoals,
          m.opponentGoals,
          m.rmResult,
          m.hasDetailedEvents,
          m.hasLineups,
          m.completenessStatus,
          sourceId ?? null,
          m.sourceCitation,
        ]
      );

      const matchId = matchRes.rows[0].id;
      matchesInsertedOrUpdated++;

      if (m.hasDetailedEvents || m.hasLineups) {
        detailedCount++;
      }

      // Insert Events if provided
      if (m.events.length > 0) {
        await db.query(`DELETE FROM match_events WHERE match_id = $1;`, [matchId]);
        for (const ev of m.events) {
          const evTeamId = ev.isRealMadrid
            ? m.rmIsHome
              ? homeTeamId
              : awayTeamId
            : m.rmIsHome
            ? awayTeamId
            : homeTeamId;
          const pid = ev.isRealMadrid ? resolvePlayerId(ev.playerName) : null;
          const assistPid =
            ev.isRealMadrid && ev.assistPlayerName
              ? resolvePlayerId(ev.assistPlayerName)
              : null;

          await db.query(
            `INSERT INTO match_events (
              match_id, team_id, is_real_madrid, event_type, minute,
              stoppage_minute, minute_display, player_id, player_name,
              assist_player_id, assist_player_name, notes, source_citation
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);`,
            [
              matchId,
              evTeamId,
              ev.isRealMadrid,
              ev.eventType,
              ev.minute,
              ev.stoppageMinute,
              ev.minuteDisplay,
              pid,
              ev.playerName,
              assistPid,
              ev.assistPlayerName ?? null,
              ev.notes ?? null,
              m.sourceCitation,
            ]
          );
        }
      }

      // Insert Lineups if provided
      if (m.lineups.length > 0) {
        await db.query(`DELETE FROM lineups WHERE match_id = $1;`, [matchId]);
        for (const lu of m.lineups) {
          const luTeamId = lu.isRealMadrid
            ? m.rmIsHome
              ? homeTeamId
              : awayTeamId
            : m.rmIsHome
            ? awayTeamId
            : homeTeamId;
          const pid = lu.isRealMadrid ? resolvePlayerId(lu.playerName) : null;

          await db.query(
            `INSERT INTO lineups (
              match_id, team_id, is_real_madrid, player_id, player_name,
              shirt_number, position, is_starting, is_captain, lineup_order
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            ON CONFLICT (match_id, team_id, player_name) DO NOTHING;`,
            [
              matchId,
              luTeamId,
              lu.isRealMadrid,
              pid,
              lu.playerName,
              lu.shirtNumber ?? null,
              lu.position ?? null,
              lu.isStarting,
              lu.isCaptain,
              lu.lineupOrder,
            ]
          );
        }
      }

      // Insert Substitutions if provided
      if (m.substitutions.length > 0) {
        await db.query(`DELETE FROM substitutions WHERE match_id = $1;`, [matchId]);
        for (const sub of m.substitutions) {
          const subTeamId = sub.isRealMadrid
            ? m.rmIsHome
              ? homeTeamId
              : awayTeamId
            : m.rmIsHome
            ? awayTeamId
            : homeTeamId;
          const pidIn = sub.isRealMadrid ? resolvePlayerId(sub.playerInName) : null;
          const pidOut = sub.isRealMadrid ? resolvePlayerId(sub.playerOutName) : null;

          await db.query(
            `INSERT INTO substitutions (
              match_id, team_id, is_real_madrid, minute, stoppage_minute,
              minute_display, player_in_id, player_in_name, player_out_id, player_out_name
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);`,
            [
              matchId,
              subTeamId,
              sub.isRealMadrid,
              sub.minute,
              sub.stoppageMinute,
              sub.minuteDisplay,
              pidIn,
              sub.playerInName,
              pidOut,
              sub.playerOutName,
            ]
          );
        }
      }

      // Populate player_match_stats for Real Madrid players in this match
      if (m.lineups.length > 0 || m.events.length > 0) {
        await db.query(`DELETE FROM player_match_stats WHERE match_id = $1;`, [
          matchId,
        ]);
        const rmTeamId = m.rmIsHome ? homeTeamId : awayTeamId;
        const matchDuration = m.wentToExtraTime ? 120 : 90;

        const rmStatsMap = new Map<
          string,
          {
            playerId: number | null;
            playerName: string;
            started: boolean;
            shirtNumber: number | null;
            position: string | null;
            minutesPlayed: number | null;
            goals: number;
            penaltyGoals: number;
            ownGoals: number;
            assists: number | null;
            yellowCards: number;
            redCards: number;
          }
        >();

        for (const lu of m.lineups.filter((l) => l.isRealMadrid)) {
          let mins = lu.isStarting ? matchDuration : 0;
          const subOut = m.substitutions.find(
            (s) => s.isRealMadrid && s.playerOutName === lu.playerName
          );
          const subIn = m.substitutions.find(
            (s) => s.isRealMadrid && s.playerInName === lu.playerName
          );
          if (lu.isStarting && subOut) {
            mins = Math.max(1, subOut.minute);
          } else if (!lu.isStarting && subIn) {
            mins = Math.max(1, matchDuration - subIn.minute);
          }

          rmStatsMap.set(lu.playerName, {
            playerId: resolvePlayerId(lu.playerName),
            playerName: lu.playerName,
            started: lu.isStarting,
            shirtNumber: lu.shirtNumber ?? null,
            position: lu.position ?? null,
            minutesPlayed: mins,
            goals: 0,
            penaltyGoals: 0,
            ownGoals: 0,
            assists: null,
            yellowCards: 0,
            redCards: 0,
          });
        }

        for (const ev of m.events.filter((e) => e.isRealMadrid)) {
          if (!rmStatsMap.has(ev.playerName)) {
            rmStatsMap.set(ev.playerName, {
              playerId: resolvePlayerId(ev.playerName),
              playerName: ev.playerName,
              started: true,
              shirtNumber: null,
              position: null,
              minutesPlayed: null, // Unknown minutes when lineup not present
              goals: 0,
              penaltyGoals: 0,
              ownGoals: 0,
              assists: null,
              yellowCards: 0,
              redCards: 0,
            });
          }
          const st = rmStatsMap.get(ev.playerName)!;
          if (ev.eventType === 'GOAL') st.goals += 1;
          if (ev.eventType === 'PENALTY_GOAL') {
            st.goals += 1;
            st.penaltyGoals += 1;
          }
          if (ev.eventType === 'OWN_GOAL') st.ownGoals += 1;
          if (ev.eventType === 'YELLOW_CARD') st.yellowCards += 1;
          if (
            ev.eventType === 'RED_CARD' ||
            ev.eventType === 'SECOND_YELLOW_RED'
          ) {
            st.redCards += 1;
          }

          if (ev.assistPlayerName) {
            if (!rmStatsMap.has(ev.assistPlayerName)) {
              rmStatsMap.set(ev.assistPlayerName, {
                playerId: resolvePlayerId(ev.assistPlayerName),
                playerName: ev.assistPlayerName,
                started: true,
                shirtNumber: null,
                position: null,
                minutesPlayed: null,
                goals: 0,
                penaltyGoals: 0,
                ownGoals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
              });
            }
            const ast = rmStatsMap.get(ev.assistPlayerName)!;
            ast.assists = (ast.assists ?? 0) + 1;
          }
        }

        for (const st of rmStatsMap.values()) {
          await db.query(
            `INSERT INTO player_match_stats (
              match_id, player_id, player_name, team_id, is_real_madrid,
              started, shirt_number, position, minutes_played, goals,
              penalty_goals, own_goals, assists, yellow_cards, red_cards, source_citation
            ) VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ON CONFLICT (match_id, team_id, player_name) DO NOTHING;`,
            [
              matchId,
              st.playerId,
              st.playerName,
              rmTeamId,
              st.started,
              st.shirtNumber,
              st.position,
              st.minutesPlayed,
              st.goals,
              st.penaltyGoals,
              st.ownGoals,
              st.assists,
              st.yellowCards,
              st.redCards,
              m.sourceCitation,
            ]
          );
        }
      }
    }

    // 8. Seed Transfers
    for (const tr of VERIFIED_TRANSFERS) {
      const pid = tr.player_slug ? playerIdBySlug.get(tr.player_slug) ?? null : null;
      await db.query(
        `INSERT INTO transfers (
          external_id, player_id, player_name, player_position, season_code,
          transfer_year, transfer_date, direction, previous_club, destination_club,
          fee_eur, fee_display, transfer_type, era_category, notes,
          source_name, source_url, verification_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (external_id) DO UPDATE SET
          fee_eur = EXCLUDED.fee_eur,
          fee_display = EXCLUDED.fee_display,
          notes = EXCLUDED.notes,
          verification_status = EXCLUDED.verification_status
        WHERE transfers.is_manual_override = FALSE;`,
        [
          tr.external_id,
          pid,
          tr.player_name,
          tr.player_position,
          tr.season_code,
          tr.transfer_year,
          tr.transfer_date,
          tr.direction,
          tr.previous_club,
          tr.destination_club,
          tr.fee_eur,
          tr.fee_display,
          tr.transfer_type,
          tr.era_category,
          tr.notes,
          tr.source_name,
          tr.source_url,
          tr.verification_status,
        ]
      );
    }

    // 9. Seed Managers
    for (const mgr of VERIFIED_MANAGERS) {
      await db.query(
        `INSERT INTO managers (
          slug, full_name, nationality, birth_year, tenure_display,
          first_year, last_year, matches_managed, wins, draws, losses,
          win_percentage, trophies_won, major_honours, portrait_url,
          portrait_attribution, bio_summary, source_name, source_url, verification_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        ON CONFLICT (slug) DO UPDATE SET
          matches_managed = EXCLUDED.matches_managed,
          wins = EXCLUDED.wins,
          draws = EXCLUDED.draws,
          losses = EXCLUDED.losses,
          trophies_won = EXCLUDED.trophies_won,
          bio_summary = EXCLUDED.bio_summary
        WHERE managers.is_manual_override = FALSE;`,
        [
          mgr.slug,
          mgr.full_name,
          mgr.nationality,
          mgr.birth_year,
          mgr.tenure_display,
          mgr.first_year,
          mgr.last_year,
          mgr.matches_managed,
          mgr.wins,
          mgr.draws,
          mgr.losses,
          mgr.win_percentage,
          mgr.trophies_won,
          mgr.major_honours,
          mgr.portrait_url,
          mgr.portrait_attribution,
          mgr.bio_summary,
          mgr.source_name,
          mgr.source_url,
          mgr.verification_status,
        ]
      );
    }

    // 10. Seed Trophies
    for (const tr of VERIFIED_TROPHIES) {
      await db.query(
        `INSERT INTO trophies (
          competition_code, competition_name, current_official_name, historical_names,
          category, is_homepage_featured, homepage_order, title_count,
          winning_seasons, runner_up_count, counting_methodology, historical_context,
          completeness_scope, source_name, source_url, verification_status, display_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (competition_code) DO UPDATE SET
          title_count = EXCLUDED.title_count,
          winning_seasons = EXCLUDED.winning_seasons,
          counting_methodology = EXCLUDED.counting_methodology,
          historical_context = EXCLUDED.historical_context
        WHERE trophies.is_manual_override = FALSE;`,
        [
          tr.competition_code,
          tr.competition_name,
          tr.current_official_name,
          tr.historical_names,
          tr.category,
          tr.is_homepage_featured,
          tr.homepage_order,
          tr.title_count,
          tr.winning_seasons,
          tr.runner_up_count,
          tr.counting_methodology,
          tr.historical_context,
          tr.completeness_scope,
          tr.source_name,
          tr.source_url,
          tr.verification_status,
          tr.display_order,
        ]
      );
    }

    // 11. Seed Historical Events
    for (const ev of VERIFIED_HISTORICAL_EVENTS) {
      await db.query(
        `INSERT INTO historical_events (
          slug, year_display, sort_year, era, title, summary, detailed_narrative,
          category, trophies_associated, key_figures, is_homepage_teaser,
          documentation_status, documentation_note, source_name, source_url
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          detailed_narrative = EXCLUDED.detailed_narrative,
          documentation_status = EXCLUDED.documentation_status,
          documentation_note = EXCLUDED.documentation_note
        WHERE historical_events.is_manual_override = FALSE;`,
        [
          ev.slug,
          ev.year_display,
          ev.sort_year,
          ev.era,
          ev.title,
          ev.summary,
          ev.detailed_narrative,
          ev.category,
          ev.trophies_associated,
          ev.key_figures,
          ev.is_homepage_teaser,
          ev.documentation_status,
          ev.documentation_note,
          ev.source_name,
          ev.source_url,
        ]
      );
    }

    // 12. Seed Legends
    for (const lg of VERIFIED_LEGENDS) {
      await db.query(
        `INSERT INTO legends (
          slug, full_name, role, position_or_title, era, tenure_display,
          nationality, birth_year, portrait_url, portrait_attribution,
          is_homepage_teaser, homepage_order, is_featured, concise_description,
          extended_biography, verified_achievements, rm_appearances, rm_goals,
          rm_assists, rm_trophies, linked_player_slug, linked_manager_slug,
          source_name, source_url, verification_status, display_order
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
        )
        ON CONFLICT (slug) DO UPDATE SET
          concise_description = EXCLUDED.concise_description,
          extended_biography = EXCLUDED.extended_biography,
          verified_achievements = EXCLUDED.verified_achievements,
          rm_appearances = EXCLUDED.rm_appearances,
          rm_goals = EXCLUDED.rm_goals,
          rm_assists = EXCLUDED.rm_assists,
          rm_trophies = EXCLUDED.rm_trophies
        WHERE legends.is_manual_override = FALSE;`,
        [
          lg.slug,
          lg.full_name,
          lg.role,
          lg.position_or_title,
          lg.era,
          lg.tenure_display,
          lg.nationality,
          lg.birth_year,
          lg.portrait_url,
          lg.portrait_attribution,
          lg.is_homepage_teaser,
          lg.homepage_order,
          lg.is_featured,
          lg.concise_description,
          lg.extended_biography,
          lg.verified_achievements,
          lg.rm_appearances,
          lg.rm_goals,
          lg.rm_assists,
          lg.rm_trophies,
          lg.linked_player_slug,
          lg.linked_manager_slug,
          lg.source_name,
          lg.source_url,
          lg.verification_status,
          lg.display_order,
        ]
      );
    }

    // 13. Seed Club Records
    for (const rec of VERIFIED_CLUB_RECORDS) {
      await db.query(
        `INSERT INTO club_records (
          record_code, record_scope, category, title, holder_name, holder_Context,
          stat_value_display, stat_numeric, unit, period_covered, competitions_covered,
          calculation_method, completeness_status, source_name, source_url, display_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (record_code) DO UPDATE SET
          holder_name = EXCLUDED.holder_name,
          holder_Context = EXCLUDED.holder_Context,
          stat_value_display = EXCLUDED.stat_value_display,
          stat_numeric = EXCLUDED.stat_numeric,
          calculation_method = EXCLUDED.calculation_method
        WHERE club_records.is_manual_override = FALSE;`,
        [
          rec.record_code,
          rec.record_scope,
          rec.category,
          rec.title,
          rec.holder_name,
          rec.holder_Context,
          rec.stat_value_display,
          rec.stat_numeric,
          rec.unit,
          rec.period_covered,
          rec.competitions_covered,
          rec.calculation_method,
          rec.completeness_status,
          rec.source_name,
          rec.source_url,
          rec.display_order,
        ]
      );
    }

    // 14. Seed Data Quality Issues
    for (const iss of VERIFIED_DATA_QUALITY_ISSUES) {
      await db.query(
        `INSERT INTO data_quality_issues (
          issue_code, issue_type, severity, entity_table, entity_ref,
          description, source_a_value, source_b_value, resolution_policy, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (issue_code) DO UPDATE SET
          description = EXCLUDED.description,
          resolution_policy = EXCLUDED.resolution_policy;`,
        [
          iss.issue_code,
          iss.issue_type,
          iss.severity,
          iss.entity_table,
          iss.entity_ref,
          iss.description,
          iss.source_a_value,
          iss.source_b_value,
          iss.resolution_policy,
          iss.status,
        ]
      );
    }

    const summaryText = `Imported ${matchesInsertedOrUpdated} official completed matches (${detailedCount} with detailed events/lineups; ${matchesSkippedManualOverride} manual overrides preserved), ${VERIFIED_PLAYERS.length} player profiles, ${VERIFIED_TRANSFERS.length} transfers, ${VERIFIED_TROPHIES.length} honour categories, ${VERIFIED_LEGENDS.length} legends, and ${VERIFIED_HISTORICAL_EVENTS.length} timeline milestones.`;

    await db.query(
      `UPDATE data_import_runs
       SET status = 'SUCCESS',
           records_processed = $1,
           records_inserted = $2,
           records_skipped_override = $3,
           summary = $4,
           completed_at = NOW()
       WHERE id = $5;`,
      [
        matchesProcessed,
        matchesInsertedOrUpdated,
        matchesSkippedManualOverride,
        summaryText,
        runId,
      ]
    );

    await db.query(
      `INSERT INTO sync_logs (import_run_id, log_level, component, message, details_json)
       VALUES ($1, 'INFO', 'HISTORICAL_IMPORT', $2, $3);`,
      [
        runId,
        summaryText,
        JSON.stringify({
          matchesProcessed,
          matchesInsertedOrUpdated,
          matchesSkippedManualOverride,
          detailedMatchesWithLineupsOrEvents: detailedCount,
        }),
      ]
    );

    return {
      runId,
      matchesProcessed,
      matchesInsertedOrUpdated,
      matchesSkippedManualOverride,
      detailedMatchesWithLineupsOrEvents: detailedCount,
      playersCount: VERIFIED_PLAYERS.length,
      transfersCount: VERIFIED_TRANSFERS.length,
      trophiesCount: VERIFIED_TROPHIES.length,
      legendsCount: VERIFIED_LEGENDS.length,
      historicalEventsCount: VERIFIED_HISTORICAL_EVENTS.length,
      recordsCount: VERIFIED_CLUB_RECORDS.length,
    };
  } catch (err) {
    await db.query(
      `UPDATE data_import_runs SET status = 'FAILED', errors_count = 1, summary = $1, completed_at = NOW() WHERE id = $2;`,
      [(err as Error).message, runId]
    );
    throw err;
  }
}

export async function runWeeklyHistoricalAudit(): Promise<{
  auditRunId: number;
  duplicateMatchesCount: number;
  partialSeasonsCount: number;
  openIssuesCount: number;
  activeOverridesCount: number;
  summary: string;
}> {
  const db = await getDb();
  const runInsert = await db.query<{ id: number }>(
    `INSERT INTO data_import_runs (run_type, source_name, status, summary)
     VALUES ('WEEKLY_AUDIT', 'PostgreSQL Integrity & Coverage Auditor', 'RUNNING', 'Weekly historical audit in progress')
     RETURNING id;`
  );
  const auditRunId = runInsert.rows[0].id;

  // 1. Check duplicate matches
  const dupRes = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM (
       SELECT match_date, home_team_id, away_team_id, COUNT(*) AS c
       FROM matches
       GROUP BY match_date, home_team_id, away_team_id
       HAVING COUNT(*) > 1
     ) sub;`
  );
  const duplicateMatchesCount = parseInt(dupRes.rows[0]?.cnt || '0', 10);

  // 2. Check partial seasons
  const partialRes = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM seasons WHERE completeness_status = 'Partial';`
  );
  const partialSeasonsCount = parseInt(partialRes.rows[0]?.cnt || '0', 10);

  // 3. Check open data quality issues
  const issuesRes = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM data_quality_issues WHERE status != 'RESOLVED_BY_ADMIN';`
  );
  const openIssuesCount = parseInt(issuesRes.rows[0]?.cnt || '0', 10);

  // 4. Count active manual overrides
  const overridesRes = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM manual_overrides WHERE is_active = TRUE;`
  );
  const activeOverridesCount = parseInt(overridesRes.rows[0]?.cnt || '0', 10);

  const summary = `Weekly Audit Complete: ${duplicateMatchesCount} duplicate matches found, ${partialSeasonsCount} partial season(s) flagged, ${openIssuesCount} documented coverage gap(s), ${activeOverridesCount} active manual override(s) protected.`;

  await db.query(
    `UPDATE data_import_runs
     SET status = 'SUCCESS',
         records_processed = $1,
         summary = $2,
         completed_at = NOW()
     WHERE id = $3;`,
    [
      duplicateMatchesCount + partialSeasonsCount + openIssuesCount,
      summary,
      auditRunId,
    ]
  );

  await db.query(
    `INSERT INTO sync_logs (import_run_id, log_level, component, message, details_json)
     VALUES ($1, 'INFO', 'WEEKLY_AUDIT', $2, $3);`,
    [
      auditRunId,
      summary,
      JSON.stringify({
        duplicateMatchesCount,
        partialSeasonsCount,
        openIssuesCount,
        activeOverridesCount,
      }),
    ]
  );

  return {
    auditRunId,
    duplicateMatchesCount,
    partialSeasonsCount,
    openIssuesCount,
    activeOverridesCount,
    summary,
  };
}

export async function runDailySync(options?: {
  runWeeklyAuditIfSunday?: boolean;
  forceWeeklyAudit?: boolean;
}): Promise<{
  syncRunId: number;
  importSummary: ImportSummary;
  fdoStatus: string;
  apiFootballStatus: string;
  weeklyAuditResult?: Awaited<ReturnType<typeof runWeeklyHistoricalAudit>>;
}> {
  const fdoRes = await fetchFootballDataOrgCompletedMatches();
  const apiRes = await fetchApiFootballCompletedMatches();

  const importSummary = await runFullHistoricalImport({
    forceReplaceOverrides: false,
  });

  const db = await getDb();
  await db.query(
    `INSERT INTO sync_logs (import_run_id, log_level, component, message, details_json)
     VALUES ($1, 'INFO', 'DAILY_SYNC_PROVIDERS', $2, $3);`,
    [
      importSummary.runId,
      `Daily sync verified OpenFootball & optional API adapters. FDO: ${fdoRes.statusMessage} | API-Football: ${apiRes.statusMessage}`,
      JSON.stringify({ fdo: fdoRes.statusMessage, apiFootball: apiRes.statusMessage }),
    ]
  );

  const isSunday = new Date().getUTCDay() === 0;
  let weeklyAuditResult:
    | Awaited<ReturnType<typeof runWeeklyHistoricalAudit>>
    | undefined;

  if (
    options?.forceWeeklyAudit ||
    (options?.runWeeklyAuditIfSunday !== false && isSunday)
  ) {
    weeklyAuditResult = await runWeeklyHistoricalAudit();
  }

  return {
    syncRunId: importSummary.runId,
    importSummary,
    fdoStatus: fdoRes.statusMessage,
    apiFootballStatus: apiRes.statusMessage,
    weeklyAuditResult,
  };
}
