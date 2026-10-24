import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRecordsData } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';
import { Award, Database, ShieldCheck, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Official Club Records (All-Time vs. 2011/12 Onward)',
  description:
    'Verified Real Madrid CF club records strictly separated into All-Time Club Records (1902–Present) and Modern Detailed Records (2011/12 Onward).',
};

export default async function RecordsPage() {
  const {
    allTimeRecords,
    modernRecords,
    sqlLargestWins,
    sqlHighestScoringMatches,
    sqlBestModernSeasons,
  } = await getRecordsData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          Statistical Benchmarks &amp; Milestones
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          CLUB RECORDS ARCHIVE
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          Real Madrid CF’s statistical milestones are strictly partitioned into two methodological scopes: <strong className="text-[#E6D3A0]">All-Time Club Records (1902–Present)</strong> verified by official club and UEFA/FIFA registries, and <strong className="text-[#E6D3A0]">Modern Detailed Records (2011/12 Onward)</strong> derived from the granular match archive.
        </p>
      </div>

      {/* Category 1: All-Time Club Records */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C9A64B]/50 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
              <Award className="h-4 w-4" />
              Category I · Historical Club Registry (1902–Present)
            </div>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#F1EEE7]">
              All-Time Club Records
            </h2>
          </div>
          <span className="text-xs text-[#AAA69C]">
            Scope: Complete Official First-Team History
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allTimeRecords.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col justify-between rounded border border-[#3B321F] bg-[#111111] p-6 transition hover:border-[#C9A64B]/70"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E6D3A0]">
                    {rec.category}
                  </span>
                  <StatusBadge status={rec.completeness_status} />
                </div>

                <h3 className="mt-4 font-serif text-lg font-bold text-[#F1EEE7]">
                  {rec.title}
                </h3>

                <div className="mt-3 flex items-baseline gap-2 border-y border-[#3B321F]/60 py-3">
                  <span className="font-serif text-3xl font-bold text-[#C9A64B]">
                    {rec.stat_value_display}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#E6D3A0]">
                    Record Holder: {rec.holder_name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#AAA69C]">
                    {rec.holder_context}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1.5 border-t border-[#3B321F]/50 pt-3 text-[11px] text-[#AAA69C]">
                <div className="flex justify-between">
                  <span>Period Covered:</span>
                  <strong className="font-mono text-[#F1EEE7]">
                    {rec.period_covered}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Competitions:</span>
                  <span className="text-right text-[#F1EEE7]">
                    {rec.competitions_covered}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Methodology:</span>
                  <span className="text-right text-[#E6D3A0]">
                    {rec.calculation_method}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Source: {rec.source_name}</span>
                  {rec.source_url && (
                    <a
                      href={rec.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#C9A64B] hover:underline"
                    >
                      Verify
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category 2: Modern Detailed Records (2011/12 Onward) */}
      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C9A64B]/50 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
              <Database className="h-4 w-4" />
              Category II · Modern Detailed Archive (2011/12 Season Onward)
            </div>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#F1EEE7]">
              Modern Detailed Records (2011/12 Onward)
            </h2>
          </div>
          <span className="text-xs text-[#AAA69C]">
            Scope: 2011/12 – Present Match &amp; Seasonal Database
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modernRecords.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col justify-between rounded border border-[#3B321F] bg-[#111111] p-6 transition hover:border-[#C9A64B]/70"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-[#3B321F] bg-[#171717] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9A64B]">
                    2011/12+ · {rec.category}
                  </span>
                  <StatusBadge status={rec.completeness_status} />
                </div>

                <h3 className="mt-4 font-serif text-lg font-bold text-[#F1EEE7]">
                  {rec.title}
                </h3>

                <div className="mt-3 flex items-baseline gap-2 border-y border-[#3B321F]/60 py-3">
                  <span className="font-serif text-3xl font-bold text-[#E6D3A0]">
                    {rec.stat_value_display}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
                    Holder: {rec.holder_name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#AAA69C]">
                    {rec.holder_context}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1.5 border-t border-[#3B321F]/50 pt-3 text-[11px] text-[#AAA69C]">
                <div className="flex justify-between">
                  <span>Period Covered:</span>
                  <strong className="font-mono text-[#F1EEE7]">
                    {rec.period_covered}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Competitions:</span>
                  <span className="text-right text-[#F1EEE7]">
                    {rec.competitions_covered}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Calculation:</span>
                  <span className="text-right text-[#E6D3A0]">
                    {rec.calculation_method}
                  </span>
                </div>
                <div className="pt-1 text-[10px] text-[#AAA69C]">
                  Source: {rec.source_name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live SQL-Calculated Modern Tables */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Largest Margins of Victory (2011/12+) */}
          <div className="rounded border border-[#3B321F] bg-[#111111] p-5">
            <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
              <h3 className="font-serif text-base font-bold text-[#F1EEE7]">
                Largest Victory Margins (2011/12+)
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#C9A64B]" />
            </div>
            <p className="mt-1.5 text-[11px] text-[#AAA69C]">
              Live SQL query (`ORDER BY (rm_goals - opponent_goals) DESC`) across 782 archive matches.
            </p>
            <ul className="mt-4 divide-y divide-[#3B321F]/40 text-xs">
              {sqlLargestWins.map((m) => (
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
                  <span className="rounded border border-[#C9A64B]/40 bg-[#080808] px-2 py-0.5 font-mono text-xs font-bold text-[#C9A64B]">
                    +{m.margin}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Highest-Scoring Matches (2011/12+) */}
          <div className="rounded border border-[#3B321F] bg-[#111111] p-5">
            <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
              <h3 className="font-serif text-base font-bold text-[#F1EEE7]">
                Highest-Scoring Fixtures (2011/12+)
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#C9A64B]" />
            </div>
            <p className="mt-1.5 text-[11px] text-[#AAA69C]">
              Live SQL query (`ORDER BY (home_score + away_score) DESC`) from `matches`.
            </p>
            <ul className="mt-4 divide-y divide-[#3B321F]/40 text-xs">
              {sqlHighestScoringMatches.map((m) => (
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
                  <span className="rounded border border-[#3B321F] bg-[#080808] px-2 py-0.5 font-mono text-xs font-bold text-[#E6D3A0]">
                    {m.total_goals} Goals
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Most Wins & Goals by Verified Season (2011/12+) */}
          <div className="rounded border border-[#3B321F] bg-[#111111] p-5">
            <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
              <h3 className="font-serif text-base font-bold text-[#F1EEE7]">
                Top Archive Seasons by Wins
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#C9A64B]" />
            </div>
            <p className="mt-1.5 text-[11px] text-[#AAA69C]">
              Live SQL aggregation across verified completed seasons (`2011/12`–`2025/26`).
            </p>
            <ul className="mt-4 divide-y divide-[#3B321F]/40 text-xs">
              {sqlBestModernSeasons.map((s) => (
                <li
                  key={s.season_code}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <Link
                      href={`/seasons?season=${encodeURIComponent(s.season_code)}`}
                      className="font-mono font-bold text-[#E6D3A0] hover:underline"
                    >
                      Season {s.season_code}
                    </Link>
                    <p className="text-[10px] text-[#AAA69C]">
                      {s.matches} archive matches · {s.goals_for} RM goals
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#6CC070]">
                      {s.wins} Wins
                    </span>
                    <p className="font-mono text-[10px] text-[#AAA69C]">
                      {s.win_pct}% Win Rate
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
