import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getMatchesArchive } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileText, RotateCcw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Matches Archive (2011/12 Onward)',
  description:
    'Official completed first-team men’s matches of Real Madrid CF starting from the 2011/12 season, with SQL-backed filtering, sorting, and verified match sheets.',
};

interface MatchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(val: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(val)) return val[0] || fallback;
  return val || fallback;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const sp = await searchParams;
  const season = getParam(sp.season, 'ALL');
  const competition = getParam(sp.competition, 'ALL');
  const year = getParam(sp.year, 'ALL');
  const opponent = getParam(sp.opponent, '');
  const venue = getParam(sp.venue, 'ALL');
  const outcome = getParam(sp.outcome, 'ALL');
  const score = getParam(sp.score, '');
  const detailed = getParam(sp.detailed, '');
  const sort = getParam(sp.sort, 'date_desc');
  const page = Math.max(1, parseInt(getParam(sp.page, '1'), 10) || 1);

  const archive = await getMatchesArchive({
    season: season !== 'ALL' ? season : undefined,
    competition: competition !== 'ALL' ? competition : undefined,
    year: year !== 'ALL' ? year : undefined,
    opponent: opponent || undefined,
    venue: venue !== 'ALL' ? venue : undefined,
    outcome: outcome !== 'ALL' ? outcome : undefined,
    score: score || undefined,
    detailed: detailed === 'true' ? 'true' : undefined,
    sort,
    page,
    pageSize: 25,
  });

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (season !== 'ALL') params.set('season', season);
    if (competition !== 'ALL') params.set('competition', competition);
    if (year !== 'ALL') params.set('year', year);
    if (opponent) params.set('opponent', opponent);
    if (venue !== 'ALL') params.set('venue', venue);
    if (outcome !== 'ALL') params.set('outcome', outcome);
    if (score) params.set('score', score);
    if (detailed === 'true') params.set('detailed', 'true');
    if (sort !== 'date_desc') params.set('sort', sort);
    params.set('page', String(targetPage));
    return `/matches?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          Official First-Team Match Registry · 2011/12 Onward
        </p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
              COMPLETED MATCHES ARCHIVE
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
              Every official completed match contested by Real Madrid CF’s first-team men’s squad from the 2011/12 season onward. Friendly matches, reserve fixtures (Castilla), and future schedules are strictly excluded.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#AAA69C]">
            <StatusBadge status="Verified" />
            <span>SQL Server-Side Filtered &amp; Paginated</span>
          </div>
        </div>
      </div>

      {/* Filter Form (GET URL-addressable) */}
      <form
        method="GET"
        action="/matches"
        className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            <Filter className="h-3.5 w-3.5" />
            Archive Query Filters
          </div>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 text-xs text-[#AAA69C] hover:text-[#E6D3A0]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Season */}
          <div>
            <label htmlFor="filter-season" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Season
            </label>
            <select
              id="filter-season"
              name="season"
              defaultValue={season}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Seasons (2011/12+)</option>
              {archive.filterOptions.seasons.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} {s.completeness_status === 'Partial' ? '(Partial)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Competition */}
          <div>
            <label htmlFor="filter-comp" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Competition
            </label>
            <select
              id="filter-comp"
              name="competition"
              defaultValue={competition}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Competitions</option>
              {archive.filterOptions.competitions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.short_name}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Year */}
          <div>
            <label htmlFor="filter-year" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Calendar Year
            </label>
            <select
              id="filter-year"
              name="year"
              defaultValue={year}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Years</option>
              {archive.filterOptions.years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Opponent */}
          <div>
            <label htmlFor="filter-opponent" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Opponent Club
            </label>
            <input
              id="filter-opponent"
              type="text"
              name="opponent"
              defaultValue={opponent}
              placeholder="e.g., Barcelona, Bayern, Atlético..."
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] placeholder-[#AAA69C]/50 focus:border-[#C9A64B] focus:outline-none"
            />
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="filter-venue" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Home / Away
            </label>
            <select
              id="filter-venue"
              name="venue"
              defaultValue={venue}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Venues</option>
              <option value="HOME">Home (Santiago Bernabéu / Di Stéfano)</option>
              <option value="AWAY">Away / Neutral Final</option>
            </select>
          </div>

          {/* Result W/D/L */}
          <div>
            <label htmlFor="filter-outcome" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Outcome (W / D / L)
            </label>
            <select
              id="filter-outcome"
              name="outcome"
              defaultValue={outcome}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="W">Win (W)</option>
              <option value="D">Draw (D)</option>
              <option value="L">Loss (L)</option>
            </select>
          </div>

          {/* Exact Score */}
          <div>
            <label htmlFor="filter-score" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Final Score (e.g., 4-1)
            </label>
            <input
              id="filter-score"
              type="text"
              name="score"
              defaultValue={score}
              placeholder="e.g., 4-0 or 3-1"
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] placeholder-[#AAA69C]/50 focus:border-[#C9A64B] focus:outline-none"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="filter-sort" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              <span className="inline-flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Sort Order
              </span>
            </label>
            <select
              id="filter-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First (2011/12+)</option>
              <option value="goals_desc">Real Madrid Goals: Highest First</option>
            </select>
          </div>

          {/* Detailed Match Sheet filter + Submit */}
          <div className="flex flex-col justify-between sm:col-span-2 lg:col-span-2">
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-[#F1EEE7]">
              <input
                type="checkbox"
                name="detailed"
                value="true"
                defaultChecked={detailed === 'true'}
                className="h-4 w-4 rounded border-[#3B321F] bg-[#171717] text-[#C9A64B] focus:ring-[#C9A64B]"
              />
              <span>Only matches with full lineups or goalscorer minutes</span>
            </label>
            <button
              type="submit"
              className="mt-3 w-full rounded border border-[#C9A64B] bg-[#C9A64B] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#080808] transition hover:bg-[#E6D3A0]"
            >
              Apply Archive Query
            </button>
          </div>
        </div>
      </form>

      {/* Filtered Summary Bar */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Matching Fixtures
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
            {archive.summary.total_matches}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Wins (W)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#6CC070]">
            {archive.summary.wins}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Draws (D)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#E6D3A0]">
            {archive.summary.draws}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Losses (L)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#E06C75]">
            {archive.summary.losses}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            RM Goals Scored
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#C9A64B]">
            {archive.summary.goals_for}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Goals Conceded
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#AAA69C]">
            {archive.summary.goals_against}
          </p>
        </div>
      </div>

      {/* Matches Table */}
      <div className="mt-6 overflow-hidden rounded border border-[#3B321F] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Season &amp; Competition</th>
                <th className="px-4 py-3.5">Venue</th>
                <th className="px-4 py-3.5">Home Team</th>
                <th className="px-4 py-3.5 text-center">Score</th>
                <th className="px-4 py-3.5">Away Team</th>
                <th className="px-4 py-3.5 text-center">Outcome</th>
                <th className="px-4 py-3.5">Coverage</th>
                <th className="px-4 py-3.5 text-right">Match Sheet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              {archive.matches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-[#AAA69C]">
                    No official completed matches matched your filter criteria.
                  </td>
                </tr>
              ) : (
                archive.matches.map((m) => {
                  const outcomeBadge =
                    m.rm_result === 'W'
                      ? 'border-[#2E6B3E] bg-[#14291A] text-[#6CC070]'
                      : m.rm_result === 'D'
                        ? 'border-[#6E5623] bg-[#2B2210] text-[#E6D3A0]'
                        : 'border-[#6B2E2E] bg-[#291414] text-[#E06C75]';

                  return (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-[#171717]/80"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-[#F1EEE7]">
                        {m.match_date}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#C9A64B]">
                            {m.season_code}
                          </span>
                          <span className="text-[#F1EEE7]">{m.competition_name}</span>
                        </div>
                        {(m.stage || m.matchday) && (
                          <p className="mt-0.5 text-[10px] text-[#AAA69C]">
                            {[m.stage, m.matchday].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-[#AAA69C]">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            m.rm_is_home
                              ? 'bg-[#C9A64B]/15 text-[#E6D3A0]'
                              : 'bg-[#171717] text-[#AAA69C]'
                          }`}
                        >
                          {m.rm_is_home ? 'HOME' : 'AWAY'}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3.5 text-sm ${
                          m.rm_is_home
                            ? 'font-semibold text-[#F1EEE7]'
                            : 'text-[#AAA69C]'
                        }`}
                      >
                        {m.home_team}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <Link
                          href={`/matches/${m.id}`}
                          className="inline-block rounded border border-[#3B321F] bg-[#080808] px-3 py-1 font-mono text-sm font-bold text-[#E6D3A0] transition hover:border-[#C9A64B]"
                        >
                          {m.home_score} – {m.away_score}
                        </Link>
                        {m.went_to_penalties &&
                          m.pen_home_score !== null &&
                          m.pen_away_score !== null && (
                            <p className="mt-0.5 font-mono text-[10px] text-[#C9A64B]">
                              ({m.pen_home_score}–{m.pen_away_score} pen)
                            </p>
                          )}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-sm ${
                          !m.rm_is_home
                            ? 'font-semibold text-[#F1EEE7]'
                            : 'text-[#AAA69C]'
                        }`}
                      >
                        {m.away_team}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded border font-mono text-xs font-bold ${outcomeBadge}`}
                        >
                          {m.rm_result}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.has_lineups && (
                            <span className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-1.5 py-0.5 text-[10px] text-[#E6D3A0]">
                              XI + Events
                            </span>
                          )}
                          {!m.has_lineups && m.has_detailed_events && (
                            <span className="rounded border border-[#3B321F] bg-[#171717] px-1.5 py-0.5 text-[10px] text-[#AAA69C]">
                              Scorers
                            </span>
                          )}
                          {!m.has_lineups && !m.has_detailed_events && (
                            <span className="text-[10px] text-[#AAA69C]">Scoreline</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <Link
                          href={`/matches/${m.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A64B] hover:text-[#E6D3A0]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#3B321F] bg-[#171717] px-6 py-4 sm:flex-row">
          <p className="text-xs text-[#AAA69C]">
            Showing page{' '}
            <span className="font-semibold text-[#F1EEE7]">
              {archive.pagination.page}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[#F1EEE7]">
              {archive.pagination.totalPages}
            </span>{' '}
            ({archive.pagination.totalMatches} total official matches)
          </p>
          <div className="flex items-center gap-2">
            {archive.pagination.page > 1 ? (
              <Link
                href={buildPageHref(archive.pagination.page - 1)}
                className="inline-flex items-center gap-1 rounded border border-[#3B321F] bg-[#111111] px-3 py-1.5 text-xs font-medium text-[#F1EEE7] hover:border-[#C9A64B] hover:text-[#E6D3A0]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-[#3B321F]/40 bg-[#111111]/40 px-3 py-1.5 text-xs text-[#AAA69C]/40">
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </span>
            )}

            {archive.pagination.page < archive.pagination.totalPages ? (
              <Link
                href={buildPageHref(archive.pagination.page + 1)}
                className="inline-flex items-center gap-1 rounded border border-[#3B321F] bg-[#111111] px-3 py-1.5 text-xs font-medium text-[#F1EEE7] hover:border-[#C9A64B] hover:text-[#E6D3A0]"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-[#3B321F]/40 bg-[#111111]/40 px-3 py-1.5 text-xs text-[#AAA69C]/40">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
