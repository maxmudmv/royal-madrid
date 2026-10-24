-- ============================================================================
-- ROYAL MADRID — POSTGRESQL DATABASE SCHEMA (001_initial_schema.sql)
-- Normalized historical & statistical schema with provenance, NULL-safe stats,
-- manual override protection, audit logging, and Row-Level Security (RLS).
-- ============================================================================

BEGIN;

-- 1. DATA SOURCES
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  provider_type VARCHAR(64) NOT NULL, -- 'OPEN_DATASET' | 'REST_API' | 'CURATED_ARCHIVE'
  base_url TEXT NOT NULL,
  license VARCHAR(160) NOT NULL,
  terms_summary TEXT NOT NULL,
  free_tier_limits TEXT NOT NULL,
  rate_limit_per_minute INTEGER,
  daily_quota_limit INTEGER,
  daily_quota_used INTEGER DEFAULT 0,
  quota_reset_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'Verified', -- 'Verified' | 'Partial' | 'Unavailable' | 'Unverified'
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority_rank INTEGER NOT NULL DEFAULT 10, -- Lower number = higher priority (1 = Manual Override, 2 = Official/Curated, 3 = OpenFootball, 4 = API)
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SOURCE COVERAGE REPORT ENTRIES
CREATE TABLE IF NOT EXISTS source_coverage (
  id SERIAL PRIMARY KEY,
  competition_code VARCHAR(64) NOT NULL,
  competition_name VARCHAR(160) NOT NULL,
  season_code VARCHAR(32) NOT NULL, -- e.g. '2023/24' or 'All-Time'
  available_fields TEXT[] NOT NULL,
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
  source_name VARCHAR(160) NOT NULL,
  license VARCHAR(160) NOT NULL,
  completeness_status VARCHAR(32) NOT NULL CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  matches_covered INTEGER,
  matches_expected INTEGER,
  last_checked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  known_gaps TEXT,
  UNIQUE (competition_code, season_code, source_name)
);

-- 3. COMPETITIONS
CREATE TABLE IF NOT EXISTS competitions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'LA_LIGA', 'UCL', 'COPA_DEL_REY', 'SUPERCOPA_ESP', 'UEFA_SUPER_CUP', 'FIFA_CWC', 'INTERCONTINENTAL'
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(64) NOT NULL,
  historical_names TEXT,
  competition_type VARCHAR(64) NOT NULL, -- 'DOMESTIC_LEAGUE' | 'DOMESTIC_CUP' | 'DOMESTIC_SUPER_CUP' | 'EUROPEAN_CUP' | 'EUROPEAN_SUPER_CUP' | 'GLOBAL_CUP'
  organizer VARCHAR(120) NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SEASONS
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL, -- e.g. '2011/12', '2023/24'
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  is_detailed_archive BOOLEAN NOT NULL DEFAULT TRUE, -- True for 2011/12 onward
  manager_names VARCHAR(200),
  trophies_won TEXT[] DEFAULT '{}',
  season_summary TEXT,
  completeness_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  coverage_notes TEXT,
  source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasons_start_year ON seasons(start_year DESC);

-- 5. TEAMS (Real Madrid CF + Official Opponents / Transfer Clubs)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(160) UNIQUE NOT NULL,
  short_name VARCHAR(80) NOT NULL,
  country VARCHAR(80) DEFAULT 'Spain',
  is_real_madrid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. OFFICIAL COMPLETED MATCHES (First-Team Men's Only, 2011/12 Onward)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(160) UNIQUE NOT NULL,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE RESTRICT,
  stage VARCHAR(120),
  matchday VARCHAR(64),
  match_date DATE NOT NULL,
  kickoff_time VARCHAR(32),
  home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  venue VARCHAR(180),
  city VARCHAR(120),
  attendance INTEGER, -- NULL when unknown, never 0 for unknown
  referee VARCHAR(160),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  ht_home_score INTEGER, -- NULL when unknown
  ht_away_score INTEGER, -- NULL when unknown
  aet_home_score INTEGER,
  aet_away_score INTEGER,
  pen_home_score INTEGER,
  pen_away_score INTEGER,
  went_to_extra_time BOOLEAN NOT NULL DEFAULT FALSE,
  went_to_penalties BOOLEAN NOT NULL DEFAULT FALSE,
  rm_is_home BOOLEAN NOT NULL,
  rm_goals INTEGER NOT NULL,
  opponent_goals INTEGER NOT NULL,
  rm_result CHAR(1) NOT NULL CHECK (rm_result IN ('W', 'D', 'L')),
  has_detailed_events BOOLEAN NOT NULL DEFAULT FALSE,
  has_lineups BOOLEAN NOT NULL DEFAULT FALSE,
  has_team_stats BOOLEAN NOT NULL DEFAULT FALSE,
  team_stats_json JSONB, -- Verified possession, shots, corners when available; NULL otherwise
  completeness_status VARCHAR(32) NOT NULL DEFAULT 'Partial' CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
  source_citation TEXT NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (season_id, competition_id, match_date, home_team_id, away_team_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_result ON matches(rm_result);

-- 7. PLAYERS (Real Madrid First-Team Men's Players)
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  external_id VARCHAR(120) UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  short_name VARCHAR(120) NOT NULL,
  position VARCHAR(64) NOT NULL, -- 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'
  detailed_position VARCHAR(80),
  nationality VARCHAR(80) NOT NULL,
  birth_year INTEGER,
  birth_date DATE,
  shirt_number INTEGER,
  rm_tenure_start INTEGER NOT NULL,
  rm_tenure_end INTEGER, -- NULL if currently active
  tenure_display VARCHAR(64) NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_legend BOOLEAN NOT NULL DEFAULT FALSE,
  portrait_url TEXT,
  portrait_attribution TEXT,
  bio_summary TEXT,
  -- All-Time Verified Real Madrid Career Totals (NULL if unverified/unavailable, NEVER 0 for unknown)
  all_time_rm_apps INTEGER,
  all_time_rm_goals INTEGER,
  all_time_rm_assists INTEGER,
  all_time_rm_minutes INTEGER,
  all_time_rm_yellow_cards INTEGER,
  all_time_rm_red_cards INTEGER,
  all_time_rm_trophies INTEGER,
  all_time_scope_note TEXT,
  -- 2011/12+ Detailed Archive Totals (Computed/Verified for seasons >= 2011/12)
  archive_2011_rm_apps INTEGER,
  archive_2011_rm_goals INTEGER,
  archive_2011_rm_assists INTEGER,
  archive_2011_rm_minutes INTEGER,
  archive_2011_rm_starts INTEGER,
  archive_2011_rm_sub_apps INTEGER,
  archive_2011_rm_yellow_cards INTEGER,
  archive_2011_rm_red_cards INTEGER,
  archive_scope_note TEXT,
  major_honours TEXT[] DEFAULT '{}',
  individual_awards TEXT[] DEFAULT '{}',
  completeness_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
  source_citation TEXT NOT NULL,
  source_url TEXT,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_featured ON players(is_featured);

-- 8. PLAYER SEASON & COMPETITION STATISTICS (Real Madrid Career Only)
CREATE TABLE IF NOT EXISTS player_season_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE RESTRICT,
  appearances INTEGER, -- NULL if unknown
  starts INTEGER,
  sub_appearances INTEGER,
  goals INTEGER,
  assists INTEGER,
  minutes_played INTEGER,
  yellow_cards INTEGER,
  red_cards INTEGER,
  clean_sheets INTEGER,
  completeness_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  source_citation TEXT NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (player_id, season_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_player_season_stats_player ON player_season_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_season_stats_season ON player_season_stats(season_id);

-- 9. PLAYER MATCH STATISTICS (2011/12+ Detailed Match Appearances)
CREATE TABLE IF NOT EXISTS player_match_stats (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name VARCHAR(160) NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_real_madrid BOOLEAN NOT NULL DEFAULT TRUE,
  started BOOLEAN NOT NULL DEFAULT TRUE,
  shirt_number INTEGER,
  position VARCHAR(32),
  minutes_played INTEGER, -- NULL when unknown
  goals INTEGER NOT NULL DEFAULT 0,
  penalty_goals INTEGER NOT NULL DEFAULT 0,
  own_goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER, -- NULL when assist data is unavailable from source
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  official_rating NUMERIC(3,1), -- Only populated if legitimate official source provides it, else NULL
  source_citation TEXT NOT NULL,
  UNIQUE (match_id, team_id, player_name)
);

CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);

-- 10. MATCH EVENTS (Goals, Penalties, Own Goals, Cards)
CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_real_madrid BOOLEAN NOT NULL,
  event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('GOAL', 'PENALTY_GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'SECOND_YELLOW_RED', 'RED_CARD', 'MISSED_PENALTY')),
  minute INTEGER NOT NULL,
  stoppage_minute INTEGER,
  minute_display VARCHAR(24) NOT NULL,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name VARCHAR(160) NOT NULL,
  assist_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  assist_player_name VARCHAR(160),
  notes VARCHAR(160),
  source_citation TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id, minute);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);

-- 11. LINEUPS
CREATE TABLE IF NOT EXISTS lineups (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_real_madrid BOOLEAN NOT NULL,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name VARCHAR(160) NOT NULL,
  shirt_number INTEGER,
  position VARCHAR(32),
  is_starting BOOLEAN NOT NULL DEFAULT TRUE,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  lineup_order INTEGER NOT NULL DEFAULT 1,
  UNIQUE (match_id, team_id, player_name)
);

CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);

-- 12. SUBSTITUTIONS
CREATE TABLE IF NOT EXISTS substitutions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_real_madrid BOOLEAN NOT NULL,
  minute INTEGER NOT NULL,
  stoppage_minute INTEGER,
  minute_display VARCHAR(24) NOT NULL,
  player_in_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_in_name VARCHAR(160) NOT NULL,
  player_out_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_out_name VARCHAR(160) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_substitutions_match ON substitutions(match_id);

-- 13. TRANSFERS
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(120) UNIQUE NOT NULL,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name VARCHAR(160) NOT NULL,
  player_position VARCHAR(64),
  season_code VARCHAR(16) NOT NULL,
  transfer_year INTEGER NOT NULL,
  transfer_date DATE,
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('IN', 'OUT')),
  previous_club VARCHAR(160) NOT NULL,
  destination_club VARCHAR(160) NOT NULL,
  fee_eur BIGINT, -- NULL when unknown/undisclosed or free; never 0 for unknown
  fee_display VARCHAR(120) NOT NULL, -- e.g. '€103.0M', 'Free Transfer', 'Undisclosed / Unknown', 'Loan'
  transfer_type VARCHAR(64) NOT NULL DEFAULT 'Permanent', -- 'Permanent' | 'Free Transfer' | 'Loan' | 'End of Contract' | 'Academy Promotion'
  era_category VARCHAR(64) NOT NULL DEFAULT 'Modern (2011/12+)', -- 'Historical (<2011/12)' | 'Modern (2011/12+)'
  notes TEXT,
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_year ON transfers(transfer_year DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_direction ON transfers(direction);

-- 14. MANAGERS
CREATE TABLE IF NOT EXISTS managers (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  nationality VARCHAR(80) NOT NULL,
  birth_year INTEGER,
  tenure_display VARCHAR(120) NOT NULL,
  first_year INTEGER NOT NULL,
  last_year INTEGER,
  matches_managed INTEGER, -- NULL if partial
  wins INTEGER,
  draws INTEGER,
  losses INTEGER,
  win_percentage NUMERIC(5,2),
  trophies_won INTEGER NOT NULL,
  major_honours TEXT[] NOT NULL DEFAULT '{}',
  portrait_url TEXT,
  portrait_attribution TEXT,
  bio_summary TEXT NOT NULL,
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE
);

-- 15. TROPHIES & HONOURS
CREATE TABLE IF NOT EXISTS trophies (
  id SERIAL PRIMARY KEY,
  competition_code VARCHAR(64) UNIQUE NOT NULL,
  competition_name VARCHAR(160) NOT NULL,
  current_official_name VARCHAR(160) NOT NULL,
  historical_names VARCHAR(240),
  category VARCHAR(64) NOT NULL, -- 'Major Three' | 'European & Global' | 'Domestic & Historical'
  is_homepage_featured BOOLEAN NOT NULL DEFAULT FALSE,
  homepage_order INTEGER,
  title_count INTEGER NOT NULL,
  winning_seasons TEXT[] NOT NULL,
  runner_up_count INTEGER,
  counting_methodology TEXT NOT NULL,
  historical_context TEXT NOT NULL,
  completeness_scope VARCHAR(160) NOT NULL,
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  last_verified_at DATE NOT NULL DEFAULT CURRENT_DATE,
  display_order INTEGER NOT NULL DEFAULT 10,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE
);

-- 16. HISTORICAL EVENTS (Club History Timeline)
CREATE TABLE IF NOT EXISTS historical_events (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  year_display VARCHAR(32) NOT NULL,
  sort_year INTEGER NOT NULL,
  era VARCHAR(80) NOT NULL, -- '1902–1943: Foundation & Royal Title' | '1943–1978: The Bernabéu & Di Stéfano Era' | '1978–2000: La Quinta & La Séptima' | '2000–2011: The Galácticos Era' | '2011–Present: Modern Golden Era'
  title VARCHAR(200) NOT NULL,
  summary TEXT NOT NULL,
  detailed_narrative TEXT NOT NULL,
  category VARCHAR(64) NOT NULL, -- 'Foundation' | 'European Glory' | 'Domestic Milestone' | 'Institutional' | 'Legendary Signing'
  trophies_associated TEXT[] DEFAULT '{}',
  key_figures TEXT[] DEFAULT '{}',
  is_homepage_teaser BOOLEAN NOT NULL DEFAULT FALSE,
  documentation_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (documentation_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  documentation_note TEXT,
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_historical_events_year ON historical_events(sort_year ASC);

-- 17. LEGENDS ARCHIVE (Players & Great Managers)
CREATE TABLE IF NOT EXISTS legends (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  role VARCHAR(64) NOT NULL, -- 'Player' | 'Manager' | 'Player & Manager' | 'President & Player'
  position_or_title VARCHAR(100) NOT NULL,
  era VARCHAR(80) NOT NULL,
  tenure_display VARCHAR(100) NOT NULL,
  nationality VARCHAR(80) NOT NULL,
  birth_year INTEGER,
  portrait_url TEXT,
  portrait_attribution TEXT,
  is_homepage_teaser BOOLEAN NOT NULL DEFAULT FALSE,
  homepage_order INTEGER,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  concise_description TEXT NOT NULL,
  extended_biography TEXT NOT NULL,
  verified_achievements TEXT[] NOT NULL DEFAULT '{}',
  rm_appearances INTEGER, -- NULL when non-applicable or unverified
  rm_goals INTEGER,
  rm_assists INTEGER,
  rm_trophies INTEGER NOT NULL,
  linked_player_slug VARCHAR(120),
  linked_manager_slug VARCHAR(120),
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  display_order INTEGER NOT NULL DEFAULT 10,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE
);

-- 18. CLUB RECORDS (Separated into All-Time vs. 2011/12+ Modern Archive)
CREATE TABLE IF NOT EXISTS club_records (
  id SERIAL PRIMARY KEY,
  record_code VARCHAR(100) UNIQUE NOT NULL,
  record_scope VARCHAR(32) NOT NULL CHECK (record_scope IN ('ALL_TIME', 'MODERN_2011_ONWARD')),
  category VARCHAR(64) NOT NULL, -- 'Goalscoring' | 'Appearances' | 'Assists & Playmaking' | 'Team & Match Records' | 'Coaching & Managerial'
  title VARCHAR(180) NOT NULL,
  holder_name VARCHAR(160) NOT NULL,
  holder_Context VARCHAR(180) NOT NULL,
  stat_value_display VARCHAR(64) NOT NULL,
  stat_numeric NUMERIC(12,2),
  unit VARCHAR(40) NOT NULL,
  period_covered VARCHAR(80) NOT NULL,
  competitions_covered VARCHAR(160) NOT NULL,
  calculation_method TEXT NOT NULL,
  completeness_status VARCHAR(32) NOT NULL DEFAULT 'Verified' CHECK (completeness_status IN ('Verified', 'Partial', 'Unavailable', 'Unverified')),
  source_name VARCHAR(160) NOT NULL,
  source_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 10,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE
);

-- 19. DATA IMPORT RUNS & SYNC LOGS
CREATE TABLE IF NOT EXISTS data_import_runs (
  id SERIAL PRIMARY KEY,
  run_type VARCHAR(64) NOT NULL, -- 'INITIAL_SEED' | 'OPENFOOTBALL_IMPORT' | 'DAILY_SYNC' | 'WEEKLY_AUDIT' | 'ADMIN_MANUAL_IMPORT'
  source_name VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED')),
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_skipped_override INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  import_run_id INTEGER REFERENCES data_import_runs(id) ON DELETE CASCADE,
  log_level VARCHAR(16) NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR')),
  component VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. DATA QUALITY ISSUES & CONFLICTS
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id SERIAL PRIMARY KEY,
  issue_code VARCHAR(120) UNIQUE NOT NULL,
  issue_type VARCHAR(64) NOT NULL, -- 'MISSING_COVERAGE' | 'SOURCE_CONFLICT' | 'PARTIAL_MATCH_EVENTS' | 'IDENTITY_REVIEW'
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  entity_table VARCHAR(64) NOT NULL,
  entity_ref VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  source_a_value TEXT,
  source_b_value TEXT,
  resolution_policy TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED_BY_ADMIN', 'DOCUMENTED_GAP')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 21. MANUAL OVERRIDES (Survives API Synchronization)
CREATE TABLE IF NOT EXISTS manual_overrides (
  id SERIAL PRIMARY KEY,
  entity_table VARCHAR(64) NOT NULL,
  entity_key VARCHAR(160) NOT NULL,
  field_name VARCHAR(80) NOT NULL,
  override_value_json JSONB NOT NULL,
  previous_value_json JSONB,
  reason TEXT NOT NULL,
  created_by VARCHAR(80) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_table, entity_key, field_name)
);

-- 22. ADMIN AUDIT LOG
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  actor VARCHAR(80) NOT NULL,
  action VARCHAR(64) NOT NULL, -- 'MANUAL_EDIT' | 'CREATE_RECORD' | 'CSV_JSON_IMPORT' | 'TRIGGER_SYNC' | 'RESOLVE_CONFLICT' | 'OVERRIDE_PROTECTION'
  entity_table VARCHAR(64) NOT NULL,
  entity_id VARCHAR(160) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT NOT NULL,
  ip_or_context VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR SUPABASE / POSTGRESQL
-- Public visitors have read-only access to public archive tables;
-- Only service_role / postgres administrator can mutate or read admin tables.
-- ============================================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'data_sources', 'source_coverage', 'competitions', 'seasons', 'teams',
    'matches', 'players', 'player_season_stats', 'player_match_stats',
    'match_events', 'lineups', 'substitutions', 'transfers', 'managers',
    'trophies', 'historical_events', 'legends', 'club_records'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS public_read_%I ON %I;', t, t);
    EXECUTE format('CREATE POLICY public_read_%I ON %I FOR SELECT USING (true);', t, t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'data_import_runs', 'sync_logs', 'data_quality_issues', 'manual_overrides', 'admin_audit_log'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

COMMIT;
