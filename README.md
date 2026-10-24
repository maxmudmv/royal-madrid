# ROYAL MADRID — Historical & Statistical Archive

**ROYAL MADRID** is an independent, production-oriented historical and statistical archive dedicated exclusively to **Real Madrid CF’s first-team men’s football team**.

> **Disclaimer:** *ROYAL MADRID is an independent historical and statistical archive project and is not affiliated with, endorsed by, or connected to Real Madrid Club de Fútbol.*

---

## 1. Architecture & Technical Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server API Routes, TypeScript)
- **Database:** PostgreSQL (`pg` Pool for Supabase Free Tier / remote PostgreSQL, with automatic persistent local PostgreSQL cluster fallback via `@electric-sql/pglite` at `./data/pglite-cluster`)
- **Schema & Security:** 23 normalized PostgreSQL tables ([migrations/001_initial_schema.sql](migrations/001_initial_schema.sql)) with foreign keys, composite unique constraints, indexes, and PostgreSQL **Row-Level Security (RLS)** policies (`SELECT` open to public read role; mutations restricted to server-side database credentials)
- **Visual Design:** Matte black (`#080808`, `#111111`, `#171717`) and fine gold (`#C9A64B`, `#E6D3A0`, `#3B321F`) editorial layout with `Cinzel` serif headings, `Plus Jakarta Sans` body typography, and `JetBrains Mono` statistical figures

---

## 2. Setup Instructions

### Prerequisites
- Node.js `v20+` or `v22 LTS`
- PostgreSQL database (optional for local development since a persistent embedded PostgreSQL cluster is automatically created in `./data/pglite-cluster` when `DATABASE_URL` is omitted)

### Step-by-Step Installation
```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env

# 3. Run PostgreSQL DDL migrations (creates all 23 tables, indexes & RLS policies)
npm run db:migrate

# 4. Run full idempotent historical data import (OpenFootball + verified registries)
npm run db:import

# 5. Run automated verification & test suite
npm test

# 6. Start the development server
npm run dev
```

---

## 3. Environment Variables (`.env`)

All secrets are read strictly on the server and are never exposed to client-side bundles (`NEXT_PUBLIC_*` is never used for credentials):

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Optional locally / Required on Vercel | Standard PostgreSQL connection URI (e.g., Supabase Free Tier `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`). If left blank locally, `./data/pglite-cluster` is used automatically. |
| `PGLITE_DATA_DIR` | Optional | Directory path for local embedded PostgreSQL storage (default: `./data/pglite-cluster`). |
| `ADMIN_USERNAME` | Yes | Server-side administrator username for `/admin` (default in `.env.example`: `admin`). |
| `ADMIN_PASSWORD` | Yes | Server-side administrator password for `/admin` (default in `.env.example`: `RoyalMadridAdmin!2026`). |
| `ADMIN_SESSION_SECRET` | Yes | 64-character secret key used to sign HTTP-only HMAC-SHA256 admin session cookies (`rm_admin_session`). |
| `CRON_SECRET` | Yes | Bearer token secret protecting `/api/cron/sync` for scheduled daily/weekly jobs. |
| `FOOTBALL_DATA_ORG_API_KEY` | Optional | Free-tier API token for `football-data.org` v4 (`10 req/min`). |
| `API_FOOTBALL_KEY` | Optional | Free-tier API key for `API-Football` v3 (`100 req/day`). |

---

## 4. Database Creation, Migration & Historical Data Import

### Database Schema (`migrations/001_initial_schema.sql`)
Run `npm run db:migrate` to execute [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql). It creates 23 normalized tables:
1. `seasons`
2. `competitions`
3. `teams`
4. `matches`
5. `match_events`
6. `lineups`
7. `substitutions`
8. `players`
9. `player_season_stats`
10. `player_match_stats`
11. `managers`
12. `trophies`
13. `historical_events`
14. `legends`
15. `transfers`
16. `club_records`
17. `data_sources`
18. `source_coverage`
19. `data_import_runs`
20. `sync_logs`
21. `data_quality_issues`
22. `manual_overrides`
23. `admin_audit_log`

### Historical Data Import (`npm run db:import`)
Run `npm run db:import` to execute [scripts/import-historical-data.ts](scripts/import-historical-data.ts).
- Parses local `openfootball/espana` and `openfootball/champions-league` repositories (`CC0-1.0` Public Domain) for all completed Real Madrid first-team men’s matches from `2011/12` onward (`782` total official completed matches, including `83` matches with full starting lineups, substitutions, cards, and goalscorer minutes).
- Strictly excludes friendly matches, reserve matches (`Real Madrid Castilla`), and unplayed future fixtures.
- Imports verified all-time club honours, historical timeline milestones, legends, managers, player profiles (separating **All-Time Real Madrid Career Totals** from **2011/12+ Detailed Archive Totals**), transfers (preserving unknown fees as `NULL`), and club records.
- **Idempotent & Override-Safe:** Re-running `npm run db:import` updates records without creating duplicates and skips any row locked in `manual_overrides` (`is_manual_override = TRUE`).

---

## 5. Scheduled Updates (Daily Sync & Weekly Audit)

Scheduled synchronization is supported via three mechanisms:
1. **CLI Scripts:**
   - **Daily Sync:** `npm run db:sync` ([scripts/sync-daily.ts](scripts/sync-daily.ts)) — checks configured API adapters (`football-data.org` / `API-Football`), re-verifies OpenFootball files, preserves manual overrides, and logs quota usage.
   - **Weekly Historical Audit:** `npm run db:audit` ([scripts/audit-weekly.ts](scripts/audit-weekly.ts)) — audits duplicate match constraints, partial season flags, open coverage gaps, and active manual overrides.
2. **Vercel Cron (`vercel.json`):**
   - Configured in [vercel.json](vercel.json) to invoke `GET /api/cron/sync` daily at `04:00 UTC` (`0 4 * * *`). On Sundays, `runDailySync` automatically executes the weekly historical audit as well.
3. **Manual Trigger in Admin Panel:**
   - Authenticated administrators can click **Trigger Daily Sync** or **Run Weekly Audit** directly inside `/admin`.

---

## 6. Protected Admin Access & Manual Override Protection

- Visit `/admin` and sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Authentication is verified on the server via timing-safe comparison (`crypto.timingSafeEqual`) and stored in an HTTP-only signed cookie (`rm_admin_session`).
- When an administrator edits a match or player in `/admin`:
  1. The record is flagged with `is_manual_override = TRUE`.
  2. The override is persisted in the `manual_overrides` table.
  3. An immutable entry is written to `admin_audit_log` (recording actor, action, table, entity key, old values, new values, timestamp, and reason).
  4. Normal automated resyncs (`npm run db:sync` and `npm run db:import`) will **never overwrite** the manually overridden record unless the administrator explicitly clicks **Release Lock** in `/admin`.

---

## 7. Free-Tier Deployment Guide (Vercel + Supabase Free)

1. **Create a Free PostgreSQL Database on Supabase (or Neon Free Tier):**
   - Create a new project on [Supabase](https://supabase.com/) (Free Tier includes 500 MB PostgreSQL storage).
   - Copy the PostgreSQL connection URI from **Project Settings → Database**.
2. **Initialize the Remote Database:**
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" npm run db:migrate
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" npm run db:import
   ```
3. **Deploy to Vercel Hobby (Free Tier):**
   - Push this repository to GitHub and import it into [Vercel](https://vercel.com/).
   - Add `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET` in Vercel Environment Variables.
   - Vercel automatically configures the daily cron job defined in `vercel.json`.

---

## 8. Database Backup & Restore Steps

### Using Remote PostgreSQL (Supabase / Standard Postgres)
```bash
# Backup entire database to a compressed SQL dump
pg_dump "$DATABASE_URL" --format=custom --file=royal_madrid_backup.dump

# Restore from backup
pg_restore --clean --if-exists --dbname="$DATABASE_URL" royal_madrid_backup.dump
```

### Using Local Embedded PostgreSQL Cluster (`./data/pglite-cluster`)
```bash
# Backup the local PostgreSQL data directory
tar -czf royal_madrid_pglite_backup.tar.gz ./data/pglite-cluster

# Restore or rebuild from scratch at any time
npm run db:migrate && npm run db:import
```
