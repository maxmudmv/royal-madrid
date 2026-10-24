import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getSeasonDashboard } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';
import { SeasonChartsClient } from '@/components/SeasonChartsClient';
import { Trophy, AlertTriangle, Users, Calendar, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Seasons & Competitions Dashboard (2011/12 Onward)',
  description:
    'Season-by-season statistical dashboard for Real Madrid CF starting from the 2011/12 campaign, including competition breakdowns, player rankings, trophies, and match archives.',
};

interface SeasonsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SeasonsPage({ searchParams }: SeasonsPageProps) {
  const sp = await searchParams;
  const rawSeason = Array.isArray(sp.season) ? sp.season[0] : sp.season;

  const {
    allSeasons,
    activeSeason,
    competitionBreakdown,
    matches,
    playerRankings,
  } = await getSeasonDashboard(rawSeason);

  const totals = competitionBreakdown.reduce(
    (acc, c) => {
      acc.matches += c.matches_played;
      acc.wins += c.wins;
      acc.draws += c.draws;
      acc.losses += c.losses;
      acc.gf += c.goals_for;
      acc.ga += c.goals_against;
      return acc;
    },
    { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
  );

  const winPct =
    totals.matches > 0 ? ((totals.wins / totals.matches) * 100).toFixed(1) : '0.0';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          Seasonal Archive &amp; Competition Ledger · 2011/12 Onward
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          SEASONS &amp; COMPETITIONS
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          Inspect Real Madrid CF’s seasonal performance from 2011/12 onward across La Liga, UEFA Champions League, Copa del Rey, Supercopa de España, UEFA Super Cup, and FIFA Club World Cup.
        </p>
      </div>

      {/* Interactive Season Selector Bar */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            Select Archive Season (2011/12 – Present)
          </span>
          <span className="text-xs text-[#AAA69C]">
            Active Selection:{' '}
            <strong className="font-mono text-[#E6D3A0]">
              {activeSeason.code}
            </strong>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {allSeasons.map((s) => {
            const isSelected = s.code === activeSeason.code;
            return (
              <Link
                key={s.code}
                href={`/seasons?season=${encodeURIComponent(s.code)}`}
                className={`rounded border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                  isSelected
                    ? 'border-[#C9A64B] bg-[#C9A64B] text-[#080808]'
                    : 'border-[#3B321F] bg-[#171717] text-[#F1EEE7] hover:border-[#C9A64B]/60 hover:text-[#E6D3A0]'
                }`}
              >
                {s.code}
                {s.completeness_status === 'Partial' && (
                  <span
                    className={`ml-1.5 text-[10px] ${
                      isSelected ? 'text-[#080808]/80' : 'text-[#E6D3A0]'
                    }`}
                  >
                    (Partial)
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Partial Season Warning Banner (Never present a partial season as complete) */}
      {activeSeason.completeness_status !== 'Verified' && (
        <div className="mt-6 flex items-start gap-3 rounded border border-[#C9A64B] bg-[#2B2210]/70 p-4 text-xs text-[#E6D3A0]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A64B]" />
          <div>
            <p className="font-semibold uppercase tracking-wider text-[#F1EEE7]">
              Incomplete / Partial Season Notice ({activeSeason.code})
            </p>
            <p className="mt-1 leading-relaxed text-[#E6D3A0]/90">
              {activeSeason.coverage_notes ||
                `The ${activeSeason.code} campaign is partially completed in the open dataset. Only completed official matches with final scores are included below; unplayed future fixtures are excluded.`}
            </p>
          </div>
        </div>
      )}

      {/* Active Season Overview Banner */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#3B321F]/60 pb-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-[#C9A64B]">
                SEASON {activeSeason.code}
              </span>
              <StatusBadge status={activeSeason.completeness_status} />
            </div>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#F1EEE7]">
              {activeSeason.code} First-Team Campaign Dossier
            </h2>
            {activeSeason.manager_names && (
              <p className="mt-1 text-xs text-[#AAA69C]">
                First-Team Manager(s):{' '}
                <strong className="text-[#F1EEE7]">
                  {activeSeason.manager_names}
                </strong>
              </p>
            )}
          </div>

          {/* Trophies Won Pill List */}
          <div className="flex flex-wrap items-center gap-2">
            {activeSeason.trophies_won && activeSeason.trophies_won.length > 0 ? (
              activeSeason.trophies_won.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded border border-[#C9A64B]/60 bg-[#C9A64B]/15 px-3 py-1.5 text-xs font-semibold text-[#E6D3A0]"
                >
                  <Trophy className="h-3.5 w-3.5 text-[#C9A64B]" />
                  {t}
                </span>
              ))
            ) : (
              <span className="rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-xs text-[#AAA69C]">
                {activeSeason.completeness_status === 'Partial'
                  ? 'Campaign in progress / Partial coverage'
                  : 'No major club trophies won in this campaign'}
              </span>
            )}
          </div>
        </div>

        {activeSeason.season_summary && (
          <p className="mt-4 text-sm leading-relaxed text-[#F1EEE7]/90">
            {activeSeason.season_summary}
          </p>
        )}

        {/* Headline KPI Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Competitions
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
              {competitionBreakdown.length}
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Matches Played
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
              {totals.matches}
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Wins (W)
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#6CC070]">
              {totals.wins}
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Draws (D)
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#E6D3A0]">
              {totals.draws}
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Losses (L)
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#E06C75]">
              {totals.losses}
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Goals For / Against
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#C9A64B]">
              {totals.gf}{' '}
              <span className="text-sm font-normal text-[#AAA69C]">
                / {totals.ga}
              </span>
            </p>
          </div>
          <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Win Percentage
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-[#E6D3A0]">
              {winPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="mt-8">
        <SeasonChartsClient data={competitionBreakdown} />
      </div>

      {/* Competition Breakdown & Top Scorers Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Competition Table */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <h3 className="font-serif text-xl font-bold text-[#F1EEE7]">
            Competition-by-Competition Breakdown ({activeSeason.code})
          </h3>
          <p className="mt-1 text-xs text-[#AAA69C]">
            Aggregated directly from verified completed matches in the PostgreSQL database.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-3 py-2.5">Competition</th>
                  <th className="px-3 py-2.5 text-right">MP</th>
                  <th className="px-3 py-2.5 text-right">W</th>
                  <th className="px-3 py-2.5 text-right">D</th>
                  <th className="px-3 py-2.5 text-right">L</th>
                  <th className="px-3 py-2.5 text-right">GF</th>
                  <th className="px-3 py-2.5 text-right">GA</th>
                  <th className="px-3 py-2.5 text-right">GD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {competitionBreakdown.map((c) => (
                  <tr key={c.competition_code} className="hover:bg-[#171717]/60">
                    <td className="px-3 py-3 font-semibold text-[#F1EEE7]">
                      {c.competition_name}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#F1EEE7]">
                      {c.matches_played}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#6CC070]">
                      {c.wins}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#E6D3A0]">
                      {c.draws}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#E06C75]">
                      {c.losses}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-[#C9A64B]">
                      {c.goals_for}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#AAA69C]">
                      {c.goals_against}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[#F1EEE7]">
                      {c.goals_for - c.goals_against >= 0
                        ? `+${c.goals_for - c.goals_against}`
                        : c.goals_for - c.goals_against}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Scorers & Player Rankings */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#F1EEE7]">
                Season Player Rankings ({activeSeason.code})
              </h3>
              <p className="mt-1 text-xs text-[#AAA69C]">
                Verified season scorers and appearance leaders in the archive.
              </p>
            </div>
            <Users className="h-5 w-5 text-[#C9A64B]" />
          </div>

          {playerRankings.length === 0 ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              Individual player seasonal splits for {activeSeason.code} are not itemized in the free dataset. Career totals remain available on the{' '}
              <Link href="/players" className="text-[#C9A64B] underline">
                Players Archive
              </Link>
              .
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                    <th className="px-3 py-2.5">Player</th>
                    <th className="px-3 py-2.5">Pos</th>
                    <th className="px-3 py-2.5 text-right">Apps</th>
                    <th className="px-3 py-2.5 text-right">Goals</th>
                    <th className="px-3 py-2.5 text-right">Assists</th>
                    <th className="px-3 py-2.5 text-right">Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3B321F]/40">
                  {playerRankings.map((pr, idx) => (
                    <tr key={idx} className="hover:bg-[#171717]/60">
                      <td className="px-3 py-2.5 font-semibold text-[#F1EEE7]">
                        {pr.player_slug ? (
                          <Link
                            href={`/players/${pr.player_slug}`}
                            className="text-[#E6D3A0] hover:underline"
                          >
                            {pr.player_name}
                          </Link>
                        ) : (
                          pr.player_name
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[#AAA69C]">
                        {pr.position || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#F1EEE7]">
                        {pr.appearances}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-[#C9A64B]">
                        {pr.goals}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#AAA69C]">
                        {pr.assists ?? 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#AAA69C]">
                        {pr.minutes_played !== null
                          ? `${pr.minutes_played.toLocaleString('en-US')}'`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Season Match Archive Table */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3B321F]/60 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C9A64B]" />
            <h3 className="font-serif text-xl font-bold text-[#F1EEE7]">
              Complete {activeSeason.code} Match Log ({matches.length} Completed Fixtures)
            </h3>
          </div>
          <Link
            href={`/matches?season=${encodeURIComponent(activeSeason.code)}`}
            className="text-xs font-semibold text-[#C9A64B] hover:text-[#E6D3A0]"
          >
            Open in Full Matches Filter &rarr;
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Competition</th>
                <th className="px-4 py-2.5">Stage / Round</th>
                <th className="px-4 py-2.5">Home Team</th>
                <th className="px-4 py-2.5 text-center">Score</th>
                <th className="px-4 py-2.5">Away Team</th>
                <th className="px-4 py-2.5 text-center">Result</th>
                <th className="px-4 py-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              {matches.map((m) => {
                const badge =
                  m.rm_result === 'W'
                    ? 'border-[#2E6B3E] bg-[#14291A] text-[#6CC070]'
                    : m.rm_result === 'D'
                      ? 'border-[#6E5623] bg-[#2B2210] text-[#E6D3A0]'
                      : 'border-[#6B2E2E] bg-[#291414] text-[#E06C75]';
                return (
                  <tr key={m.id} className="hover:bg-[#171717]/60">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[#F1EEE7]">
                      {m.match_date}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[#E6D3A0]">
                      {m.competition_name}
                    </td>
                    <td className="px-4 py-2.5 text-[#AAA69C]">
                      {[m.stage, m.matchday].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td
                      className={`px-4 py-2.5 ${
                        m.rm_is_home
                          ? 'font-semibold text-[#F1EEE7]'
                          : 'text-[#AAA69C]'
                      }`}
                    >
                      {m.home_team}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Link
                        href={`/matches/${m.id}`}
                        className="rounded border border-[#3B321F] bg-[#080808] px-2.5 py-0.5 font-mono font-bold text-[#E6D3A0] hover:border-[#C9A64B]"
                      >
                        {m.home_score}–{m.away_score}
                      </Link>
                    </td>
                    <td
                      className={`px-4 py-2.5 ${
                        !m.rm_is_home
                          ? 'font-semibold text-[#F1EEE7]'
                          : 'text-[#AAA69C]'
                      }`}
                    >
                      {m.away_team}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] font-bold ${badge}`}
                      >
                        {m.rm_result}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/matches/${m.id}`}
                        className="inline-flex items-center gap-1 text-[#C9A64B] hover:text-[#E6D3A0]"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Sheet
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
