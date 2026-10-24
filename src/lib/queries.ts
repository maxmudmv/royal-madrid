import { getDb } from './db';
import { runFullHistoricalImport } from './importer';

let seededChecked = false;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seededChecked) return;
  const db = await getDb();
  const countRes = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM trophies;`
  );
  const count = parseInt(countRes.rows[0]?.cnt || '0', 10);
  if (count === 0) {
    await runFullHistoricalImport({ forceReplaceOverrides: false });
  }
  seededChecked = true;
}

export async function getHomepageData() {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const [majorTrophies, timelineTeaser, legendsTeaser, archiveCounts] =
    await Promise.all([
      db.query<{
        id: number;
        competition_code: string;
        competition_name: string;
        current_official_name: string;
        historical_names: string;
        title_count: number;
        winning_seasons: string[];
        counting_methodology: string;
        source_name: string;
        source_url: string;
        verification_status: string;
        last_verified_at: string;
      }>(
        `SELECT id, competition_code, competition_name, current_official_name,
                historical_names, title_count, winning_seasons,
                counting_methodology, source_name, source_url,
                verification_status, last_verified_at::text
         FROM trophies
         WHERE is_homepage_featured = TRUE
         ORDER BY homepage_order ASC;`
      ),
      db.query<{
        id: number;
        slug: string;
        year_display: string;
        sort_year: number;
        era: string;
        title: string;
        summary: string;
        category: string;
        documentation_status: string;
        source_name: string;
      }>(
        `SELECT id, slug, year_display, sort_year, era, title, summary,
                category, documentation_status, source_name
         FROM historical_events
         WHERE is_homepage_teaser = TRUE
         ORDER BY sort_year ASC;`
      ),
      db.query<{
        id: number;
        slug: string;
        full_name: string;
        role: string;
        position_or_title: string;
        tenure_display: string;
        portrait_url: string | null;
        portrait_attribution: string | null;
        concise_description: string;
        rm_appearances: number | null;
        rm_goals: number | null;
        rm_trophies: number;
        linked_player_slug: string | null;
        verification_status: string;
      }>(
        `SELECT id, slug, full_name, role, position_or_title, tenure_display,
                portrait_url, portrait_attribution, concise_description,
                rm_appearances, rm_goals, rm_trophies, linked_player_slug,
                verification_status
         FROM legends
         WHERE is_homepage_teaser = TRUE
         ORDER BY homepage_order ASC
         LIMIT 3;`
      ),
      db.query<{
        matches_count: string;
        seasons_count: string;
        players_count: string;
        trophies_sum: string;
      }>(
        `SELECT
           (SELECT COUNT(*)::text FROM matches) AS matches_count,
           (SELECT COUNT(*)::text FROM seasons) AS seasons_count,
           (SELECT COUNT(*)::text FROM players) AS players_count,
           (SELECT COALESCE(SUM(title_count), 0)::text FROM trophies) AS trophies_sum;`
      ),
    ]);

  return {
    majorTrophies: majorTrophies.rows,
    timelineTeaser: timelineTeaser.rows,
    legendsTeaser: legendsTeaser.rows,
    stats: archiveCounts.rows[0],
  };
}

export async function getHistoryTimelineData() {
  await ensureDatabaseSeeded();
  const db = await getDb();
  const res = await db.query<{
    id: number;
    slug: string;
    year_display: string;
    sort_year: number;
    era: string;
    title: string;
    summary: string;
    detailed_narrative: string;
    category: string;
    trophies_associated: string[];
    key_figures: string[];
    documentation_status: string;
    documentation_note: string | null;
    source_name: string;
    source_url: string | null;
  }>(
    `SELECT id, slug, year_display, sort_year, era, title, summary,
            detailed_narrative, category, trophies_associated, key_figures,
            documentation_status, documentation_note, source_name, source_url
     FROM historical_events
     ORDER BY sort_year ASC;`
  );
  return res.rows;
}

export async function getHonoursData() {
  await ensureDatabaseSeeded();
  const db = await getDb();
  const [trophiesRes, coverageRes] = await Promise.all([
    db.query<{
      id: number;
      competition_code: string;
      competition_name: string;
      current_official_name: string;
      historical_names: string | null;
      category: string;
      is_homepage_featured: boolean;
      title_count: number;
      winning_seasons: string[];
      runner_up_count: number | null;
      counting_methodology: string;
      historical_context: string;
      completeness_scope: string;
      source_name: string;
      source_url: string | null;
      verification_status: string;
      last_verified_at: string;
    }>(
      `SELECT id, competition_code, competition_name, current_official_name,
              historical_names, category, is_homepage_featured, title_count,
              winning_seasons, runner_up_count, counting_methodology,
              historical_context, completeness_scope, source_name, source_url,
              verification_status, last_verified_at::text
       FROM trophies
       ORDER BY display_order ASC;`
    ),
    db.query<{
      id: number;
      competition_code: string;
      competition_name: string;
      season_code: string;
      available_fields: string[];
      missing_fields: string[];
      source_name: string;
      license: string;
      completeness_status: string;
      matches_covered: number | null;
      matches_expected: number | null;
      last_checked_date: string;
      known_gaps: string | null;
    }>(
      `SELECT id, competition_code, competition_name, season_code,
              available_fields, missing_fields, source_name, license,
              completeness_status, matches_covered, matches_expected,
              last_checked_date::text, known_gaps
       FROM source_coverage
       ORDER BY id ASC;`
    ),
  ]);

  return {
    trophies: trophiesRes.rows,
    coverageReport: coverageRes.rows,
  };
}

export async function getLegendsData() {
  await ensureDatabaseSeeded();
  const db = await getDb();
  const [legendsRes, managersRes] = await Promise.all([
    db.query<{
      id: number;
      slug: string;
      full_name: string;
      role: string;
      position_or_title: string;
      era: string;
      tenure_display: string;
      nationality: string;
      birth_year: number | null;
      portrait_url: string | null;
      portrait_attribution: string | null;
      is_homepage_teaser: boolean;
      is_featured: boolean;
      concise_description: string;
      extended_biography: string;
      verified_achievements: string[];
      rm_appearances: number | null;
      rm_goals: number | null;
      rm_assists: number | null;
      rm_trophies: number;
      linked_player_slug: string | null;
      linked_manager_slug: string | null;
      source_name: string;
      source_url: string | null;
      verification_status: string;
    }>(
      `SELECT id, slug, full_name, role, position_or_title, era, tenure_display,
              nationality, birth_year, portrait_url, portrait_attribution,
              is_homepage_teaser, is_featured, concise_description,
              extended_biography, verified_achievements, rm_appearances,
              rm_goals, rm_assists, rm_trophies, linked_player_slug,
              linked_manager_slug, source_name, source_url, verification_status
       FROM legends
       ORDER BY display_order ASC;`
    ),
    db.query<{
      id: number;
      slug: string;
      full_name: string;
      nationality: string;
      tenure_display: string;
      matches_managed: number | null;
      wins: number | null;
      draws: number | null;
      losses: number | null;
      win_percentage: string | null;
      trophies_won: number;
      major_honours: string[];
      portrait_url: string | null;
      bio_summary: string;
      source_name: string;
      verification_status: string;
    }>(
      `SELECT id, slug, full_name, nationality, tenure_display,
              matches_managed, wins, draws, losses, win_percentage::text,
              trophies_won, major_honours, portrait_url, bio_summary,
              source_name, verification_status
       FROM managers
       ORDER BY trophies_won DESC, matches_managed DESC;`
    ),
  ]);

  return {
    legends: legendsRes.rows,
    managers: managersRes.rows,
  };
}

export interface MatchArchiveFilterParams {
  season?: string;
  competition?: string;
  year?: string;
  opponent?: string;
  venue?: string; // 'HOME' | 'AWAY'
  outcome?: string; // 'W' | 'D' | 'L'
  score?: string; // e.g. '4-1' or '2-0'
  detailed?: string; // 'true'
  sort?: string; // 'date_desc' | 'date_asc' | 'goals_desc'
  page?: number;
  pageSize?: number;
}

export async function getMatchesArchive(filters: MatchArchiveFilterParams) {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.season && filters.season !== 'ALL') {
    params.push(filters.season);
    conditions.push(`s.code = $${params.length}`);
  }
  if (filters.competition && filters.competition !== 'ALL') {
    params.push(filters.competition);
    conditions.push(`c.code = $${params.length}`);
  }
  if (filters.year && filters.year !== 'ALL') {
    params.push(parseInt(filters.year, 10));
    conditions.push(`EXTRACT(YEAR FROM m.match_date) = $${params.length}`);
  }
  if (filters.opponent && filters.opponent.trim() !== '') {
    params.push(`%${filters.opponent.trim()}%`);
    conditions.push(
      `((m.rm_is_home = TRUE AND at.name ILIKE $${params.length}) OR (m.rm_is_home = FALSE AND ht.name ILIKE $${params.length}))`
    );
  }
  if (filters.venue === 'HOME') {
    conditions.push(`m.rm_is_home = TRUE`);
  } else if (filters.venue === 'AWAY') {
    conditions.push(`m.rm_is_home = FALSE`);
  }
  if (filters.outcome && ['W', 'D', 'L'].includes(filters.outcome)) {
    params.push(filters.outcome);
    conditions.push(`m.rm_result = $${params.length}`);
  }
  if (filters.score && /^\d+-\d+$/.test(filters.score.trim())) {
    const [h, a] = filters.score
      .trim()
      .split('-')
      .map((n) => parseInt(n, 10));
    params.push(h, a);
    conditions.push(
      `((m.home_score = $${params.length - 1} AND m.away_score = $${params.length}) OR (m.rm_goals = $${params.length - 1} AND m.opponent_goals = $${params.length}))`
    );
  }
  if (filters.detailed === 'true') {
    conditions.push(
      `(m.has_lineups = TRUE OR m.has_detailed_events = TRUE)`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'm.match_date DESC, m.id DESC';
  if (filters.sort === 'date_asc') {
    orderBy = 'm.match_date ASC, m.id ASC';
  } else if (filters.sort === 'goals_desc') {
    orderBy = 'm.rm_goals DESC, (m.home_score + m.away_score) DESC, m.match_date DESC';
  }

  const pageSize = Math.min(Math.max(filters.pageSize || 25, 10), 100);
  const page = Math.max(filters.page || 1, 1);
  const offset = (page - 1) * pageSize;

  const summarySql = `
    SELECT
      COUNT(*)::int AS total_matches,
      COUNT(*) FILTER (WHERE m.rm_result = 'W')::int AS wins,
      COUNT(*) FILTER (WHERE m.rm_result = 'D')::int AS draws,
      COUNT(*) FILTER (WHERE m.rm_result = 'L')::int AS losses,
      COALESCE(SUM(m.rm_goals), 0)::int AS goals_for,
      COALESCE(SUM(m.opponent_goals), 0)::int AS goals_against
    FROM matches m
    JOIN seasons s ON s.id = m.season_id
    JOIN competitions c ON c.id = m.competition_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    ${whereClause};
  `;

  const rowsSql = `
    SELECT
      m.id,
      m.external_id,
      s.code AS season_code,
      c.code AS competition_code,
      c.short_name AS competition_name,
      m.stage,
      m.matchday,
      m.match_date::text AS match_date,
      m.kickoff_time,
      ht.name AS home_team,
      at.name AS away_team,
      m.venue,
      m.city,
      m.attendance,
      m.home_score,
      m.away_score,
      m.ht_home_score,
      m.ht_away_score,
      m.pen_home_score,
      m.pen_away_score,
      m.went_to_extra_time,
      m.went_to_penalties,
      m.rm_is_home,
      m.rm_goals,
      m.opponent_goals,
      m.rm_result,
      m.has_detailed_events,
      m.has_lineups,
      m.completeness_status,
      m.source_citation
    FROM matches m
    JOIN seasons s ON s.id = m.season_id
    JOIN competitions c ON c.id = m.competition_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  const [summaryRes, matchesRes, seasonsList, compsList, yearsList] =
    await Promise.all([
      db.query<{
        total_matches: number;
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
      }>(summarySql, params),
      db.query<{
        id: number;
        external_id: string;
        season_code: string;
        competition_code: string;
        competition_name: string;
        stage: string | null;
        matchday: string | null;
        match_date: string;
        kickoff_time: string | null;
        home_team: string;
        away_team: string;
        venue: string | null;
        city: string | null;
        attendance: number | null;
        home_score: number;
        away_score: number;
        ht_home_score: number | null;
        ht_away_score: number | null;
        pen_home_score: number | null;
        pen_away_score: number | null;
        went_to_extra_time: boolean;
        went_to_penalties: boolean;
        rm_is_home: boolean;
        rm_goals: number;
        opponent_goals: number;
        rm_result: 'W' | 'D' | 'L';
        has_detailed_events: boolean;
        has_lineups: boolean;
        completeness_status: string;
        source_citation: string;
      }>(rowsSql, [...params, pageSize, offset]),
      db.query<{ code: string; completeness_status: string }>(
        `SELECT code, completeness_status FROM seasons ORDER BY start_year DESC;`
      ),
      db.query<{ code: string; short_name: string }>(
        `SELECT code, short_name FROM competitions ORDER BY display_order ASC;`
      ),
      db.query<{ yr: string }>(
        `SELECT DISTINCT EXTRACT(YEAR FROM match_date)::int::text AS yr FROM matches ORDER BY yr DESC;`
      ),
    ]);

  const summary = summaryRes.rows[0] || {
    total_matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
  };

  return {
    matches: matchesRes.rows,
    summary,
    pagination: {
      page,
      pageSize,
      totalMatches: summary.total_matches,
      totalPages: Math.max(1, Math.ceil(summary.total_matches / pageSize)),
    },
    filterOptions: {
      seasons: seasonsList.rows,
      competitions: compsList.rows,
      years: yearsList.rows.map((r) => r.yr),
    },
  };
}

export async function getMatchDetailById(matchId: number) {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const matchRes = await db.query<{
    id: number;
    external_id: string;
    season_code: string;
    competition_code: string;
    competition_name: string;
    stage: string | null;
    matchday: string | null;
    match_date: string;
    kickoff_time: string | null;
    home_team: string;
    away_team: string;
    venue: string | null;
    city: string | null;
    attendance: number | null;
    referee: string | null;
    home_score: number;
    away_score: number;
    ht_home_score: number | null;
    ht_away_score: number | null;
    aet_home_score: number | null;
    aet_away_score: number | null;
    pen_home_score: number | null;
    pen_away_score: number | null;
    went_to_extra_time: boolean;
    went_to_penalties: boolean;
    rm_is_home: boolean;
    rm_goals: number;
    opponent_goals: number;
    rm_result: 'W' | 'D' | 'L';
    has_detailed_events: boolean;
    has_lineups: boolean;
    has_team_stats: boolean;
    team_stats_json: Record<string, unknown> | null;
    completeness_status: string;
    source_citation: string;
    is_manual_override: boolean;
    last_synced_at: string;
  }>(
    `SELECT
       m.id, m.external_id, s.code AS season_code,
       c.code AS competition_code, c.name AS competition_name,
       m.stage, m.matchday, m.match_date::text AS match_date,
       m.kickoff_time, ht.name AS home_team, at.name AS away_team,
       m.venue, m.city, m.attendance, m.referee,
       m.home_score, m.away_score, m.ht_home_score, m.ht_away_score,
       m.aet_home_score, m.aet_away_score, m.pen_home_score, m.pen_away_score,
       m.went_to_extra_time, m.went_to_penalties, m.rm_is_home,
       m.rm_goals, m.opponent_goals, m.rm_result,
       m.has_detailed_events, m.has_lineups, m.has_team_stats,
       m.team_stats_json, m.completeness_status, m.source_citation,
       m.is_manual_override, m.last_synced_at::text
     FROM matches m
     JOIN seasons s ON s.id = m.season_id
     JOIN competitions c ON c.id = m.competition_id
     JOIN teams ht ON ht.id = m.home_team_id
     JOIN teams at ON at.id = m.away_team_id
     WHERE m.id = $1;`,
    [matchId]
  );

  if (matchRes.rows.length === 0) return null;
  const match = matchRes.rows[0];

  const [eventsRes, lineupsRes, subsRes, playerStatsRes] = await Promise.all([
    db.query<{
      id: number;
      is_real_madrid: boolean;
      event_type: string;
      minute: number;
      stoppage_minute: number | null;
      minute_display: string;
      player_name: string;
      player_slug: string | null;
      assist_player_name: string | null;
      notes: string | null;
    }>(
      `SELECT e.id, e.is_real_madrid, e.event_type, e.minute, e.stoppage_minute,
              e.minute_display, e.player_name, p.slug AS player_slug,
              e.assist_player_name, e.notes
       FROM match_events e
       LEFT JOIN players p ON p.id = e.player_id
       WHERE e.match_id = $1
       ORDER BY e.minute ASC, COALESCE(e.stoppage_minute, 0) ASC, e.id ASC;`,
      [matchId]
    ),
    db.query<{
      id: number;
      is_real_madrid: boolean;
      player_name: string;
      player_slug: string | null;
      shirt_number: number | null;
      position: string | null;
      is_starting: boolean;
      is_captain: boolean;
      lineup_order: number;
    }>(
      `SELECT l.id, l.is_real_madrid, l.player_name, p.slug AS player_slug,
              l.shirt_number, l.position, l.is_starting, l.is_captain, l.lineup_order
       FROM lineups l
       LEFT JOIN players p ON p.id = l.player_id
       WHERE l.match_id = $1
       ORDER BY l.is_real_madrid DESC, l.is_starting DESC, l.lineup_order ASC;`,
      [matchId]
    ),
    db.query<{
      id: number;
      is_real_madrid: boolean;
      minute: number;
      minute_display: string;
      player_in_name: string;
      player_out_name: string;
    }>(
      `SELECT id, is_real_madrid, minute, minute_display, player_in_name, player_out_name
       FROM substitutions
       WHERE match_id = $1
       ORDER BY minute ASC, id ASC;`,
      [matchId]
    ),
    db.query<{
      id: number;
      player_name: string;
      player_slug: string | null;
      started: boolean;
      shirt_number: number | null;
      position: string | null;
      minutes_played: number | null;
      goals: number;
      penalty_goals: number;
      own_goals: number;
      assists: number | null;
      yellow_cards: number;
      red_cards: number;
      official_rating: string | null;
    }>(
      `SELECT pms.id, pms.player_name, p.slug AS player_slug, pms.started,
              pms.shirt_number, pms.position, pms.minutes_played,
              pms.goals, pms.penalty_goals, pms.own_goals, pms.assists,
              pms.yellow_cards, pms.red_cards, pms.official_rating::text
       FROM player_match_stats pms
       LEFT JOIN players p ON p.id = pms.player_id
       WHERE pms.match_id = $1 AND pms.is_real_madrid = TRUE
       ORDER BY pms.started DESC, pms.goals DESC, pms.minutes_played DESC NULLS LAST;`,
      [matchId]
    ),
  ]);

  return {
    match,
    events: eventsRes.rows,
    lineups: lineupsRes.rows,
    substitutions: subsRes.rows,
    playerMatchStats: playerStatsRes.rows,
  };
}

export async function getPlayersArchive() {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const playersRes = await db.query<{
    id: number;
    slug: string;
    full_name: string;
    short_name: string;
    position: string;
    detailed_position: string | null;
    nationality: string;
    birth_year: number | null;
    shirt_number: number | null;
    rm_tenure_start: number;
    rm_tenure_end: number | null;
    tenure_display: string;
    is_featured: boolean;
    is_legend: boolean;
    portrait_url: string | null;
    all_time_rm_apps: number | null;
    all_time_rm_goals: number | null;
    all_time_rm_assists: number | null;
    all_time_rm_minutes: number | null;
    all_time_rm_yellow_cards: number | null;
    all_time_rm_red_cards: number | null;
    all_time_rm_trophies: number | null;
    archive_2011_rm_apps: number | null;
    archive_2011_rm_goals: number | null;
    archive_2011_rm_assists: number | null;
    archive_2011_rm_minutes: number | null;
    archive_2011_rm_yellow_cards: number | null;
    archive_2011_rm_red_cards: number | null;
    completeness_status: string;
    source_citation: string;
  }>(
    `SELECT
       id, slug, full_name, short_name, position, detailed_position,
       nationality, birth_year, shirt_number, rm_tenure_start, rm_tenure_end,
       tenure_display, is_featured, is_legend, portrait_url,
       all_time_rm_apps, all_time_rm_goals, all_time_rm_assists,
       all_time_rm_minutes, all_time_rm_yellow_cards, all_time_rm_red_cards,
       all_time_rm_trophies, archive_2011_rm_apps, archive_2011_rm_goals,
       archive_2011_rm_assists, archive_2011_rm_minutes,
       archive_2011_rm_yellow_cards, archive_2011_rm_red_cards,
       completeness_status, source_citation
     FROM players
     ORDER BY COALESCE(all_time_rm_goals, 0) DESC, COALESCE(all_time_rm_apps, 0) DESC;`
  );

  return {
    featuredPlayers: playersRes.rows.filter((p) => p.is_featured),
    allPlayers: playersRes.rows,
  };
}

export async function getPlayerProfileBySlug(slug: string) {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const playerRes = await db.query<{
    id: number;
    slug: string;
    full_name: string;
    short_name: string;
    position: string;
    detailed_position: string | null;
    nationality: string;
    birth_year: number | null;
    shirt_number: number | null;
    rm_tenure_start: number;
    rm_tenure_end: number | null;
    tenure_display: string;
    is_featured: boolean;
    is_legend: boolean;
    portrait_url: string | null;
    portrait_attribution: string | null;
    bio_summary: string | null;
    all_time_rm_apps: number | null;
    all_time_rm_goals: number | null;
    all_time_rm_assists: number | null;
    all_time_rm_minutes: number | null;
    all_time_rm_yellow_cards: number | null;
    all_time_rm_red_cards: number | null;
    all_time_rm_trophies: number | null;
    all_time_scope_note: string | null;
    archive_2011_rm_apps: number | null;
    archive_2011_rm_goals: number | null;
    archive_2011_rm_assists: number | null;
    archive_2011_rm_minutes: number | null;
    archive_2011_rm_starts: number | null;
    archive_2011_rm_sub_apps: number | null;
    archive_2011_rm_yellow_cards: number | null;
    archive_2011_rm_red_cards: number | null;
    archive_scope_note: string | null;
    major_honours: string[];
    individual_awards: string[];
    completeness_status: string;
    source_citation: string;
    source_url: string | null;
    last_updated_at: string;
  }>(`SELECT * FROM players WHERE slug = $1;`, [slug]);

  if (playerRes.rows.length === 0) return null;
  const player = playerRes.rows[0];

  const [seasonStatsRes, matchAppearancesRes, transfersRes] = await Promise.all([
    db.query<{
      id: number;
      season_code: string;
      competition_code: string;
      competition_name: string;
      appearances: number | null;
      starts: number | null;
      sub_appearances: number | null;
      goals: number | null;
      assists: number | null;
      minutes_played: number | null;
      yellow_cards: number | null;
      red_cards: number | null;
      completeness_status: string;
    }>(
      `SELECT pss.id, s.code AS season_code, c.code AS competition_code,
              c.short_name AS competition_name, pss.appearances, pss.starts,
              pss.sub_appearances, pss.goals, pss.assists, pss.minutes_played,
              pss.yellow_cards, pss.red_cards, pss.completeness_status
       FROM player_season_stats pss
       JOIN seasons s ON s.id = pss.season_id
       JOIN competitions c ON c.id = pss.competition_id
       WHERE pss.player_id = $1
       ORDER BY s.start_year DESC, c.display_order ASC;`,
      [player.id]
    ),
    db.query<{
      match_id: number;
      match_date: string;
      season_code: string;
      competition_name: string;
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
      rm_result: string;
      started: boolean;
      minutes_played: number | null;
      goals: number;
      penalty_goals: number;
      assists: number | null;
      yellow_cards: number;
      red_cards: number;
    }>(
      `SELECT
         m.id AS match_id, m.match_date::text AS match_date,
         s.code AS season_code, c.short_name AS competition_name,
         ht.name AS home_team, at.name AS away_team,
         m.home_score, m.away_score, m.rm_result,
         pms.started, pms.minutes_played, pms.goals,
         pms.penalty_goals, pms.assists, pms.yellow_cards, pms.red_cards
       FROM player_match_stats pms
       JOIN matches m ON m.id = pms.match_id
       JOIN seasons s ON s.id = m.season_id
       JOIN competitions c ON c.id = m.competition_id
       JOIN teams ht ON ht.id = m.home_team_id
       JOIN teams at ON at.id = m.away_team_id
       WHERE pms.player_id = $1
       ORDER BY m.match_date DESC
       LIMIT 60;`,
      [player.id]
    ),
    db.query<{
      id: number;
      season_code: string;
      transfer_date: string | null;
      direction: string;
      previous_club: string;
      destination_club: string;
      fee_display: string;
      transfer_type: string;
      source_name: string;
    }>(
      `SELECT id, season_code, transfer_date::text, direction, previous_club,
              destination_club, fee_display, transfer_type, source_name
       FROM transfers
       WHERE player_id = $1
       ORDER BY transfer_year DESC;`,
      [player.id]
    ),
  ]);

  return {
    player,
    seasonStats: seasonStatsRes.rows,
    matchAppearances: matchAppearancesRes.rows,
    transfers: transfersRes.rows,
  };
}

export async function getSeasonDashboard(selectedSeasonCode?: string) {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const seasonsRes = await db.query<{
    id: number;
    code: string;
    start_year: number;
    end_year: number;
    manager_names: string | null;
    trophies_won: string[];
    season_summary: string | null;
    completeness_status: string;
    coverage_notes: string | null;
  }>(`SELECT * FROM seasons ORDER BY start_year DESC;`);

  const allSeasons = seasonsRes.rows;
  const activeSeason =
    allSeasons.find((s) => s.code === selectedSeasonCode) ||
    allSeasons.find((s) => s.code === '2023/24') ||
    allSeasons[0];

  const [compBreakdownRes, matchesRes, seasonScorersRes] = await Promise.all([
    db.query<{
      competition_code: string;
      competition_name: string;
      matches_played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    }>(
      `SELECT
         c.code AS competition_code,
         c.name AS competition_name,
         COUNT(m.id)::int AS matches_played,
         COUNT(m.id) FILTER (WHERE m.rm_result = 'W')::int AS wins,
         COUNT(m.id) FILTER (WHERE m.rm_result = 'D')::int AS draws,
         COUNT(m.id) FILTER (WHERE m.rm_result = 'L')::int AS losses,
         COALESCE(SUM(m.rm_goals), 0)::int AS goals_for,
         COALESCE(SUM(m.opponent_goals), 0)::int AS goals_against
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE m.season_id = $1
       GROUP BY c.id, c.code, c.name, c.display_order
       ORDER BY c.display_order ASC;`,
      [activeSeason.id]
    ),
    db.query<{
      id: number;
      match_date: string;
      competition_code: string;
      competition_name: string;
      stage: string | null;
      matchday: string | null;
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
      rm_is_home: boolean;
      rm_goals: number;
      opponent_goals: number;
      rm_result: 'W' | 'D' | 'L';
      has_lineups: boolean;
      has_detailed_events: boolean;
      completeness_status: string;
    }>(
      `SELECT
         m.id, m.match_date::text AS match_date,
         c.code AS competition_code, c.short_name AS competition_name,
         m.stage, m.matchday, ht.name AS home_team, at.name AS away_team,
         m.home_score, m.away_score, m.rm_is_home, m.rm_goals,
         m.opponent_goals, m.rm_result, m.has_lineups, m.has_detailed_events,
         m.completeness_status
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       JOIN teams ht ON ht.id = m.home_team_id
       JOIN teams at ON at.id = m.away_team_id
       WHERE m.season_id = $1
       ORDER BY m.match_date ASC;`,
      [activeSeason.id]
    ),
    db.query<{
      player_slug: string | null;
      player_name: string;
      position: string | null;
      appearances: number;
      goals: number;
      assists: number | null;
      minutes_played: number | null;
    }>(
      `SELECT
         p.slug AS player_slug,
         p.short_name AS player_name,
         p.position,
         SUM(COALESCE(pss.appearances, 0))::int AS appearances,
         SUM(COALESCE(pss.goals, 0))::int AS goals,
         SUM(pss.assists)::int AS assists,
         SUM(pss.minutes_played)::int AS minutes_played
       FROM player_season_stats pss
       JOIN players p ON p.id = pss.player_id
       WHERE pss.season_id = $1
       GROUP BY p.id, p.slug, p.short_name, p.position
       ORDER BY goals DESC, appearances DESC;`,
      [activeSeason.id]
    ),
  ]);

  // If player_season_stats doesn't have entries for this season (e.g. 2025/26 where we have full match_events/player_match_stats), compute from player_match_stats!
  let playerRankings = seasonScorersRes.rows;
  if (playerRankings.length === 0) {
    const derivedRes = await db.query<{
      player_slug: string | null;
      player_name: string;
      position: string | null;
      appearances: number;
      goals: number;
      assists: number | null;
      minutes_played: number | null;
    }>(
      `SELECT
         p.slug AS player_slug,
         pms.player_name,
         COALESCE(p.position, pms.position) AS position,
         COUNT(pms.id)::int AS appearances,
         SUM(pms.goals)::int AS goals,
         SUM(pms.assists)::int AS assists,
         SUM(pms.minutes_played)::int AS minutes_played
       FROM player_match_stats pms
       JOIN matches m ON m.id = pms.match_id
       LEFT JOIN players p ON p.id = pms.player_id
       WHERE m.season_id = $1 AND pms.is_real_madrid = TRUE
       GROUP BY p.slug, pms.player_name, COALESCE(p.position, pms.position)
       ORDER BY goals DESC, appearances DESC
       LIMIT 15;`,
      [activeSeason.id]
    );
    playerRankings = derivedRes.rows;
  }

  return {
    allSeasons,
    activeSeason,
    competitionBreakdown: compBreakdownRes.rows,
    matches: matchesRes.rows,
    playerRankings,
  };
}

export async function getRecordsData() {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const [recordsRes, largestWinsRes, highestScoringRes, seasonSummaryRes] =
    await Promise.all([
      db.query<{
        id: number;
        record_code: string;
        record_scope: 'ALL_TIME' | 'MODERN_2011_ONWARD';
        category: string;
        title: string;
        holder_name: string;
        holder_context: string;
        stat_value_display: string;
        stat_numeric: string | null;
        unit: string;
        period_covered: string;
        competitions_covered: string;
        calculation_method: string;
        completeness_status: string;
        source_name: string;
        source_url: string | null;
      }>(
        `SELECT id, record_code, record_scope, category, title, holder_name,
                holder_context, stat_value_display, stat_numeric::text, unit,
                period_covered, competitions_covered, calculation_method,
                completeness_status, source_name, source_url
         FROM club_records
         ORDER BY display_order ASC;`
      ),
      db.query<{
        id: number;
        match_date: string;
        season_code: string;
        competition_name: string;
        home_team: string;
        away_team: string;
        home_score: number;
        away_score: number;
        rm_goals: number;
        opponent_goals: number;
        margin: number;
      }>(
        `SELECT
           m.id, m.match_date::text AS match_date, s.code AS season_code,
           c.short_name AS competition_name, ht.name AS home_team,
           at.name AS away_team, m.home_score, m.away_score,
           m.rm_goals, m.opponent_goals,
           (m.rm_goals - m.opponent_goals) AS margin
         FROM matches m
         JOIN seasons s ON s.id = m.season_id
         JOIN competitions c ON c.id = m.competition_id
         JOIN teams ht ON ht.id = m.home_team_id
         JOIN teams at ON at.id = m.away_team_id
         WHERE m.rm_result = 'W'
         ORDER BY margin DESC, m.rm_goals DESC, m.match_date DESC
         LIMIT 8;`
      ),
      db.query<{
        id: number;
        match_date: string;
        season_code: string;
        competition_name: string;
        home_team: string;
        away_team: string;
        home_score: number;
        away_score: number;
        total_goals: number;
      }>(
        `SELECT
           m.id, m.match_date::text AS match_date, s.code AS season_code,
           c.short_name AS competition_name, ht.name AS home_team,
           at.name AS away_team, m.home_score, m.away_score,
           (m.home_score + m.away_score) AS total_goals
         FROM matches m
         JOIN seasons s ON s.id = m.season_id
         JOIN competitions c ON c.id = m.competition_id
         JOIN teams ht ON ht.id = m.home_team_id
         JOIN teams at ON at.id = m.away_team_id
         ORDER BY total_goals DESC, m.rm_goals DESC, m.match_date DESC
         LIMIT 8;`
      ),
      db.query<{
        season_code: string;
        matches: number;
        wins: number;
        goals_for: number;
        win_pct: string;
      }>(
        `SELECT
           s.code AS season_code,
           COUNT(m.id)::int AS matches,
           COUNT(m.id) FILTER (WHERE m.rm_result = 'W')::int AS wins,
           COALESCE(SUM(m.rm_goals), 0)::int AS goals_for,
           ROUND((COUNT(m.id) FILTER (WHERE m.rm_result = 'W')::numeric / NULLIF(COUNT(m.id), 0)) * 100, 1)::text AS win_pct
         FROM seasons s
         JOIN matches m ON m.season_id = s.id
         WHERE s.completeness_status = 'Verified'
         GROUP BY s.id, s.code, s.start_year
         ORDER BY wins DESC, goals_for DESC
         LIMIT 8;`
      ),
    ]);

  return {
    allTimeRecords: recordsRes.rows.filter((r) => r.record_scope === 'ALL_TIME'),
    modernRecords: recordsRes.rows.filter(
      (r) => r.record_scope === 'MODERN_2011_ONWARD'
    ),
    sqlLargestWins: largestWinsRes.rows,
    sqlHighestScoringMatches: highestScoringRes.rows,
    sqlBestModernSeasons: seasonSummaryRes.rows,
  };
}

export async function getTransfersArchive() {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const res = await db.query<{
    id: number;
    external_id: string;
    player_id: number | null;
    player_slug: string | null;
    player_name: string;
    player_position: string | null;
    season_code: string;
    transfer_year: number;
    transfer_date: string | null;
    direction: 'IN' | 'OUT';
    previous_club: string;
    destination_club: string;
    fee_eur: string | null;
    fee_display: string;
    transfer_type: string;
    era_category: string;
    notes: string | null;
    source_name: string;
    source_url: string | null;
    verification_status: string;
  }>(
    `SELECT
       t.id, t.external_id, t.player_id, p.slug AS player_slug,
       t.player_name, t.player_position, t.season_code, t.transfer_year,
       t.transfer_date::text AS transfer_date, t.direction,
       t.previous_club, t.destination_club, t.fee_eur::text,
       t.fee_display, t.transfer_type, t.era_category, t.notes,
       t.source_name, t.source_url, t.verification_status
     FROM transfers t
     LEFT JOIN players p ON p.id = t.player_id
     ORDER BY t.transfer_year DESC, t.transfer_date DESC NULLS LAST, t.id ASC;`
  );

  return res.rows;
}

export async function searchGlobalArchive(rawQuery: string) {
  await ensureDatabaseSeeded();
  const q = rawQuery.trim();
  if (!q) {
    return {
      players: [],
      matches: [],
      seasons: [],
      managers: [],
      transfers: [],
      historicalEvents: [],
    };
  }

  const db = await getDb();
  const pattern = `%${q}%`;

  const [players, matches, seasons, managers, transfers, historicalEvents] =
    await Promise.all([
      db.query<{
        slug: string;
        short_name: string;
        position: string;
        tenure_display: string;
        all_time_rm_goals: number | null;
        all_time_rm_apps: number | null;
      }>(
        `SELECT slug, short_name, position, tenure_display, all_time_rm_goals, all_time_rm_apps
         FROM players
         WHERE full_name ILIKE $1 OR short_name ILIKE $1 OR position ILIKE $1 OR nationality ILIKE $1
         ORDER BY COALESCE(all_time_rm_goals, 0) DESC
         LIMIT 6;`,
        [pattern]
      ),
      db.query<{
        id: number;
        match_date: string;
        season_code: string;
        competition_name: string;
        home_team: string;
        away_team: string;
        home_score: number;
        away_score: number;
      }>(
        `SELECT m.id, m.match_date::text AS match_date, s.code AS season_code,
                c.short_name AS competition_name, ht.name AS home_team,
                at.name AS away_team, m.home_score, m.away_score
         FROM matches m
         JOIN seasons s ON s.id = m.season_id
         JOIN competitions c ON c.id = m.competition_id
         JOIN teams ht ON ht.id = m.home_team_id
         JOIN teams at ON at.id = m.away_team_id
         WHERE ht.name ILIKE $1 OR at.name ILIKE $1 OR s.code ILIKE $1
               OR c.name ILIKE $1 OR COALESCE(m.venue, '') ILIKE $1
               OR COALESCE(m.stage, '') ILIKE $1
         ORDER BY m.match_date DESC
         LIMIT 8;`,
        [pattern]
      ),
      db.query<{
        code: string;
        manager_names: string | null;
        trophies_won: string[];
        completeness_status: string;
      }>(
        `SELECT code, manager_names, trophies_won, completeness_status
         FROM seasons
         WHERE code ILIKE $1 OR COALESCE(manager_names, '') ILIKE $1 OR COALESCE(season_summary, '') ILIKE $1
         ORDER BY start_year DESC
         LIMIT 5;`,
        [pattern]
      ),
      db.query<{
        slug: string;
        full_name: string;
        tenure_display: string;
        trophies_won: number;
      }>(
        `SELECT slug, full_name, tenure_display, trophies_won
         FROM managers
         WHERE full_name ILIKE $1 OR tenure_display ILIKE $1 OR bio_summary ILIKE $1
         ORDER BY trophies_won DESC
         LIMIT 5;`,
        [pattern]
      ),
      db.query<{
        id: number;
        player_name: string;
        season_code: string;
        direction: string;
        previous_club: string;
        destination_club: string;
        fee_display: string;
      }>(
        `SELECT id, player_name, season_code, direction, previous_club, destination_club, fee_display
         FROM transfers
         WHERE player_name ILIKE $1 OR previous_club ILIKE $1 OR destination_club ILIKE $1 OR season_code ILIKE $1
         ORDER BY transfer_year DESC
         LIMIT 6;`,
        [pattern]
      ),
      db.query<{
        slug: string;
        year_display: string;
        title: string;
        era: string;
      }>(
        `SELECT slug, year_display, title, era
         FROM historical_events
         WHERE title ILIKE $1 OR summary ILIKE $1 OR year_display ILIKE $1 OR era ILIKE $1
         ORDER BY sort_year ASC
         LIMIT 6;`,
        [pattern]
      ),
    ]);

  return {
    players: players.rows,
    matches: matches.rows,
    seasons: seasons.rows,
    managers: managers.rows,
    transfers: transfers.rows,
    historicalEvents: historicalEvents.rows,
  };
}

export async function getAdminDashboardData() {
  await ensureDatabaseSeeded();
  const db = await getDb();

  const [
    sourcesRes,
    coverageRes,
    importRunsRes,
    syncLogsRes,
    issuesRes,
    overridesRes,
    auditLogRes,
  ] = await Promise.all([
    db.query<{
      id: number;
      code: string;
      name: string;
      provider_type: string;
      base_url: string;
      license: string;
      free_tier_limits: string;
      daily_quota_limit: number | null;
      daily_quota_used: number | null;
      status: string;
      priority_rank: number;
      last_checked_at: string | null;
      last_sync_at: string | null;
      notes: string | null;
    }>(`SELECT * FROM data_sources ORDER BY priority_rank ASC, id ASC;`),
    db.query<{
      id: number;
      competition_code: string;
      competition_name: string;
      season_code: string;
      available_fields: string[];
      missing_fields: string[];
      source_name: string;
      license: string;
      completeness_status: string;
      matches_covered: number | null;
      matches_expected: number | null;
      last_checked_date: string;
      known_gaps: string | null;
    }>(`SELECT * FROM source_coverage ORDER BY id ASC;`),
    db.query<{
      id: number;
      run_type: string;
      source_name: string;
      status: string;
      records_processed: number;
      records_inserted: number;
      records_skipped_override: number;
      errors_count: number;
      summary: string | null;
      started_at: string;
      completed_at: string | null;
    }>(`SELECT * FROM data_import_runs ORDER BY id DESC LIMIT 15;`),
    db.query<{
      id: number;
      import_run_id: number | null;
      log_level: string;
      component: string;
      message: string;
      created_at: string;
    }>(`SELECT * FROM sync_logs ORDER BY id DESC LIMIT 25;`),
    db.query<{
      id: number;
      issue_code: string;
      issue_type: string;
      severity: string;
      entity_table: string;
      entity_ref: string;
      description: string;
      source_a_value: string | null;
      source_b_value: string | null;
      resolution_policy: string;
      status: string;
      detected_at: string;
    }>(`SELECT * FROM data_quality_issues ORDER BY id ASC;`),
    db.query<{
      id: number;
      entity_table: string;
      entity_key: string;
      field_name: string;
      override_value_json: unknown;
      previous_value_json: unknown;
      reason: string;
      created_by: string;
      is_active: boolean;
      created_at: string;
    }>(`SELECT * FROM manual_overrides ORDER BY id DESC;`),
    db.query<{
      id: number;
      actor: string;
      action: string;
      entity_table: string;
      entity_id: string;
      old_values: unknown;
      new_values: unknown;
      reason: string;
      created_at: string;
    }>(`SELECT * FROM admin_audit_log ORDER BY id DESC LIMIT 50;`),
  ]);

  return {
    sources: sourcesRes.rows,
    coverage: coverageRes.rows,
    importRuns: importRunsRes.rows,
    syncLogs: syncLogsRes.rows,
    issues: issuesRes.rows,
    overrides: overridesRes.rows,
    auditLog: auditLogRes.rows,
  };
}
