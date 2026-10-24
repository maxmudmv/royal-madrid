import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { searchGlobalArchive } from '@/lib/queries';
import { Search, User, Calendar, Trophy, ArrowRightLeft, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Global Archive Search',
  description:
    'Search across Real Madrid CF players, official completed matches, seasons, managers, transfers, and historical timeline milestones.',
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GlobalSearchPage({
  searchParams,
}: SearchPageProps) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q || '').trim();

  const results = await searchGlobalArchive(q || 'Madrid');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          Database-Backed Grouped Index
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          GLOBAL ARCHIVE SEARCH
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          Query the PostgreSQL archive across players, official completed matches (2011/12+), seasons, managers, transfers, and historical events.
        </p>

        <form method="GET" action="/search" className="mt-6 flex max-w-2xl gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#C9A64B]" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search e.g. Cristiano, 2013/14, Bayern, Ancelotti, Décima..."
              className="w-full rounded border border-[#3B321F] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-[#F1EEE7] placeholder-[#AAA69C]/60 focus:border-[#C9A64B] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded border border-[#C9A64B] bg-[#C9A64B] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#080808] hover:bg-[#E6D3A0]"
          >
            Search Archive
          </button>
        </form>
      </div>

      {/* Grouped Results Grid */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Players */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 border-b border-[#3B321F]/60 pb-3">
            <User className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Players ({results.players.length})
            </h2>
          </div>
          {results.players.length === 0 ? (
            <p className="mt-4 text-xs text-[#AAA69C]">No matching players.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#3B321F]/40 text-xs">
              {results.players.map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between py-2.5"
                >
                  <Link
                    href={`/players/${p.slug}`}
                    className="font-semibold text-[#E6D3A0] hover:underline"
                  >
                    {p.short_name}{' '}
                    <span className="font-normal text-[#AAA69C]">
                      ({p.position} · {p.tenure_display})
                    </span>
                  </Link>
                  <span className="font-mono text-[#C9A64B]">
                    {p.all_time_rm_goals ?? 'N/A'} goals /{' '}
                    {p.all_time_rm_apps ?? 'N/A'} apps
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Matches */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 border-b border-[#3B321F]/60 pb-3">
            <Calendar className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Official Matches ({results.matches.length})
            </h2>
          </div>
          {results.matches.length === 0 ? (
            <p className="mt-4 text-xs text-[#AAA69C]">No matching fixtures.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#3B321F]/40 text-xs">
              {results.matches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <Link
                      href={`/matches/${m.id}`}
                      className="font-semibold text-[#F1EEE7] hover:text-[#C9A64B]"
                    >
                      {m.home_team} {m.home_score}–{m.away_score} {m.away_team}
                    </Link>
                    <p className="text-[10px] text-[#AAA69C]">
                      {m.match_date} · {m.season_code} {m.competition_name}
                    </p>
                  </div>
                  <Link
                    href={`/matches/${m.id}`}
                    className="font-mono text-[11px] text-[#C9A64B] hover:underline"
                  >
                    Sheet &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Seasons & Managers */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 border-b border-[#3B321F]/60 pb-3">
            <Trophy className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Seasons ({results.seasons.length}) &amp; Managers ({results.managers.length})
            </h2>
          </div>
          <div className="mt-3 space-y-4 text-xs">
            {results.seasons.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A64B]">
                  Seasons
                </p>
                <ul className="mt-1.5 divide-y divide-[#3B321F]/40">
                  {results.seasons.map((s) => (
                    <li
                      key={s.code}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href={`/seasons?season=${encodeURIComponent(s.code)}`}
                        className="font-mono font-bold text-[#E6D3A0] hover:underline"
                      >
                        Season {s.code}
                      </Link>
                      <span className="text-[#AAA69C]">
                        {s.manager_names || s.completeness_status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.managers.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A64B]">
                  Managers
                </p>
                <ul className="mt-1.5 divide-y divide-[#3B321F]/40">
                  {results.managers.map((mg) => (
                    <li
                      key={mg.slug}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href="/legends"
                        className="font-semibold text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        {mg.full_name} ({mg.tenure_display})
                      </Link>
                      <span className="font-mono text-[#E6D3A0]">
                        {mg.trophies_won} Trophies
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Transfers & Historical Timeline */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 border-b border-[#3B321F]/60 pb-3">
            <ArrowRightLeft className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Transfers ({results.transfers.length}) &amp; History ({results.historicalEvents.length})
            </h2>
          </div>
          <div className="mt-3 space-y-4 text-xs">
            {results.transfers.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A64B]">
                  Transfers
                </p>
                <ul className="mt-1.5 divide-y divide-[#3B321F]/40">
                  {results.transfers.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href="/transfers"
                        className="text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        <strong>{t.player_name}</strong> ({t.season_code} ·{' '}
                        {t.direction})
                      </Link>
                      <span className="font-mono text-[#E6D3A0]">
                        {t.fee_display}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.historicalEvents.length > 0 && (
              <div>
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A64B]">
                  <Clock className="h-3 w-3" /> Historical Milestones
                </p>
                <ul className="mt-1.5 divide-y divide-[#3B321F]/40">
                  {results.historicalEvents.map((ev) => (
                    <li
                      key={ev.slug}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href="/history"
                        className="text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        <strong className="font-mono text-[#C9A64B]">
                          {ev.year_display}
                        </strong>{' '}
                        — {ev.title}
                      </Link>
                      <span className="text-[10px] text-[#AAA69C]">{ev.era}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
