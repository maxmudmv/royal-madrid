import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlayerProfileBySlug } from '@/lib/queries';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ArrowLeft,
  Trophy,
  Award,
  ArrowRightLeft,
  Calendar,
  ExternalLink,
  Scale,
} from 'lucide-react';

interface PlayerProfilePageProps {
  params: Promise<{ slug: string }>;
}

function fmtStat(val: number | null | undefined, suffix = ''): string {
  if (val === null || val === undefined) return 'Unavailable (NULL)';
  return `${val.toLocaleString('en-US')}${suffix}`;
}

export async function generateMetadata({
  params,
}: PlayerProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPlayerProfileBySlug(slug);
  if (!profile) return { title: 'Player Not Found' };
  const { player } = profile;
  return {
    title: `${player.short_name} (${player.tenure_display}) — Real Madrid Profile`,
    description:
      player.bio_summary ||
      `Official Real Madrid CF career statistics and archive dossier for ${player.full_name}.`,
  };
}

export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps) {
  const { slug } = await params;
  const profile = await getPlayerProfileBySlug(slug);
  if (!profile) notFound();

  const { player, seasonStats, matchAppearances, transfers } = profile;

  // Aggregate competition-by-competition breakdown from seasonStats
  const compBreakdownMap = new Map<
    string,
    {
      competition_code: string;
      competition_name: string;
      seasons_count: number;
      appearances: number;
      goals: number;
      assists: number | null;
      minutes_played: number | null;
    }
  >();

  for (const row of seasonStats) {
    const existing = compBreakdownMap.get(row.competition_code);
    if (!existing) {
      compBreakdownMap.set(row.competition_code, {
        competition_code: row.competition_code,
        competition_name: row.competition_name,
        seasons_count: 1,
        appearances: row.appearances ?? 0,
        goals: row.goals ?? 0,
        assists: row.assists !== null ? row.assists : null,
        minutes_played: row.minutes_played !== null ? row.minutes_played : null,
      });
    } else {
      existing.seasons_count += 1;
      existing.appearances += row.appearances ?? 0;
      existing.goals += row.goals ?? 0;
      if (row.assists !== null) {
        existing.assists = (existing.assists ?? 0) + row.assists;
      }
      if (row.minutes_played !== null) {
        existing.minutes_played =
          (existing.minutes_played ?? 0) + row.minutes_played;
      }
    }
  }
  const competitionBreakdown = Array.from(compBreakdownMap.values());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B] hover:text-[#E6D3A0]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Players Archive
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/compare?players=${player.slug}`}
            className="inline-flex items-center gap-1.5 rounded border border-[#C9A64B]/50 bg-[#171717] px-3 py-1.5 text-xs font-semibold text-[#E6D3A0] hover:border-[#C9A64B]"
          >
            <Scale className="h-3.5 w-3.5" />
            Compare with Another Player
          </Link>
          <StatusBadge status={player.completeness_status} />
        </div>
      </div>

      {/* Hero Bio Card */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-6 sm:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <PlayerPortrait
            name={player.short_name}
            portraitUrl={player.portrait_url}
            attribution={player.portrait_attribution}
            subtitle={player.position}
            className="h-64 w-52 shrink-0 rounded"
          />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded border border-[#C9A64B] bg-[#C9A64B]/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#E6D3A0]">
                {player.position}
                {player.detailed_position ? ` · ${player.detailed_position}` : ''}
              </span>
              {player.shirt_number !== null && (
                <span className="rounded border border-[#3B321F] bg-[#171717] px-2.5 py-0.5 font-mono text-xs font-bold text-[#C9A64B]">
                  Shirt #{player.shirt_number}
                </span>
              )}
              <span className="font-mono text-xs text-[#AAA69C]">
                RM Tenure: <strong className="text-[#F1EEE7]">{player.tenure_display}</strong>
              </span>
            </div>

            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
              {player.short_name}
            </h1>
            <p className="mt-1 text-sm text-[#AAA69C]">
              Full Legal Name: <span className="text-[#F1EEE7]">{player.full_name}</span> · Nationality:{' '}
              <span className="text-[#F1EEE7]">{player.nationality}</span>
              {player.birth_year ? ` · Born: ${player.birth_year}` : ''}
            </p>

            {player.bio_summary && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#F1EEE7]/90">
                {player.bio_summary}
              </p>
            )}

            {/* Quick Headline Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  All-Time RM Apps
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
                  {player.all_time_rm_apps !== null
                    ? player.all_time_rm_apps.toLocaleString('en-US')
                    : 'N/A'}
                </p>
              </div>
              <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  All-Time RM Goals
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#C9A64B]">
                  {player.all_time_rm_goals !== null
                    ? player.all_time_rm_goals.toLocaleString('en-US')
                    : 'N/A'}
                </p>
              </div>
              <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  All-Time RM Assists
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
                  {player.all_time_rm_assists !== null
                    ? player.all_time_rm_assists.toLocaleString('en-US')
                    : 'N/A'}
                </p>
              </div>
              <div className="rounded border border-[#3B321F]/80 bg-[#171717] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  Official RM Trophies
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#E6D3A0]">
                  {player.all_time_rm_trophies !== null
                    ? player.all_time_rm_trophies
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Scope Comparison: All-Time Real Madrid Career Totals vs 2011/12+ Detailed Archive Totals */}
      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Scope A: All-Time Real Madrid Career Totals */}
        <div className="rounded border border-[#C9A64B]/50 bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F] pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A64B]">
                Scope A · Complete Club Tenure ({player.tenure_display})
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold text-[#F1EEE7]">
                All-Time Real Madrid Career Totals
              </h2>
            </div>
            <StatusBadge status="Verified" />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#AAA69C]">
            {player.all_time_scope_note ||
              `Official career totals across all competitive first-team matches played for Real Madrid CF (${player.tenure_display}).`}
          </p>

          <dl className="mt-5 divide-y divide-[#3B321F]/50 text-xs">
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Official Appearances</dt>
              <dd className="font-mono font-bold text-[#F1EEE7]">
                {fmtStat(player.all_time_rm_apps)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Official Goals Scored</dt>
              <dd className="font-mono font-bold text-[#C9A64B]">
                {fmtStat(player.all_time_rm_goals)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Recorded Assists</dt>
              <dd className="font-mono font-semibold text-[#F1EEE7]">
                {fmtStat(player.all_time_rm_assists)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Minutes Played</dt>
              <dd className="font-mono text-[#F1EEE7]">
                {fmtStat(player.all_time_rm_minutes, "'")}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Yellow Cards / Red Cards</dt>
              <dd className="font-mono text-[#F1EEE7]">
                {fmtStat(player.all_time_rm_yellow_cards)} /{' '}
                {fmtStat(player.all_time_rm_red_cards)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-[#AAA69C]">Official Club Honours Won</dt>
              <dd className="font-mono font-bold text-[#E6D3A0]">
                {fmtStat(player.all_time_rm_trophies, ' Trophies')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Scope B: 2011/12+ Detailed Archive Totals */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F] pb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AAA69C]">
                Scope B · Modern Detailed Era (2011/12 Season Onward)
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold text-[#F1EEE7]">
                2011/12+ Detailed Archive Totals
              </h2>
            </div>
            <StatusBadge
              status={
                player.archive_2011_rm_apps !== null ? 'Verified' : 'Unavailable'
              }
            />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#AAA69C]">
            {player.archive_scope_note ||
              'Statistics recorded specifically from the 2011/12 season onward within the detailed match archive.'}
          </p>

          {player.archive_2011_rm_apps === null ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              <p className="font-semibold text-[#E6D3A0]">
                Pre-2011/12 Historical Tenure ({player.tenure_display})
              </p>
              <p className="mt-1 leading-relaxed">
                {player.short_name} concluded his Real Madrid first-team career prior to the 2011/12 season. His verified all-time club career totals are preserved in Scope A on the left, while 2011/12+ archive columns remain explicitly <code className="text-[#C9A64B]">NULL</code> rather than zero.
              </p>
            </div>
          ) : (
            <dl className="mt-5 divide-y divide-[#3B321F]/50 text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">2011/12+ Appearances</dt>
                <dd className="font-mono font-bold text-[#F1EEE7]">
                  {fmtStat(player.archive_2011_rm_apps)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">Starts / Substitute Appearances</dt>
                <dd className="font-mono text-[#F1EEE7]">
                  {fmtStat(player.archive_2011_rm_starts)} Starts /{' '}
                  {fmtStat(player.archive_2011_rm_sub_apps)} Sub
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">2011/12+ Goals Scored</dt>
                <dd className="font-mono font-bold text-[#C9A64B]">
                  {fmtStat(player.archive_2011_rm_goals)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">2011/12+ Assists</dt>
                <dd className="font-mono font-semibold text-[#F1EEE7]">
                  {fmtStat(player.archive_2011_rm_assists)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">2011/12+ Minutes Played</dt>
                <dd className="font-mono text-[#F1EEE7]">
                  {fmtStat(player.archive_2011_rm_minutes, "'")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#AAA69C]">2011/12+ Yellow / Red Cards</dt>
                <dd className="font-mono text-[#F1EEE7]">
                  {fmtStat(player.archive_2011_rm_yellow_cards)} /{' '}
                  {fmtStat(player.archive_2011_rm_red_cards)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* Season-by-Season & Competition-by-Competition Breakdowns */}
      <section className="mt-10 rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="border-b border-[#3B321F]/60 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            Granular Statistical Ledger
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
            Season-by-Season &amp; Competition Breakdown (2011/12+)
          </h2>
        </div>

        {seasonStats.length === 0 ? (
          <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
            Granular season-by-season rows in this database begin with the 2011/12 season. See Scope A above for verified all-time Real Madrid career totals.
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Competition Summary */}
            {competitionBreakdown.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#E6D3A0]">
                  Competition-by-Competition Summary (Sampled Seasons)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                        <th className="px-4 py-2.5">Competition</th>
                        <th className="px-4 py-2.5 text-right">Seasons</th>
                        <th className="px-4 py-2.5 text-right">Appearances</th>
                        <th className="px-4 py-2.5 text-right">Goals</th>
                        <th className="px-4 py-2.5 text-right">Assists</th>
                        <th className="px-4 py-2.5 text-right">Minutes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3B321F]/40">
                      {competitionBreakdown.map((c) => (
                        <tr key={c.competition_code}>
                          <td className="px-4 py-2.5 font-semibold text-[#F1EEE7]">
                            {c.competition_name}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                            {c.seasons_count}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#F1EEE7]">
                            {c.appearances}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-[#C9A64B]">
                            {c.goals}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                            {c.assists ?? 'N/A'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                            {c.minutes_played !== null
                              ? `${c.minutes_played.toLocaleString('en-US')}'`
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Season-by-Season Table */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#E6D3A0]">
                Season-by-Season Competition Rows
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                      <th className="px-4 py-2.5">Season</th>
                      <th className="px-4 py-2.5">Competition</th>
                      <th className="px-4 py-2.5 text-right">Apps</th>
                      <th className="px-4 py-2.5 text-right">Starts / Sub</th>
                      <th className="px-4 py-2.5 text-right">Goals</th>
                      <th className="px-4 py-2.5 text-right">Assists</th>
                      <th className="px-4 py-2.5 text-right">Minutes</th>
                      <th className="px-4 py-2.5 text-right">Y / R Cards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3B321F]/40">
                    {seasonStats.map((row) => (
                      <tr key={row.id} className="hover:bg-[#171717]/60">
                        <td className="px-4 py-2.5 font-mono font-semibold text-[#C9A64B]">
                          <Link
                            href={`/seasons?season=${encodeURIComponent(row.season_code)}`}
                            className="hover:underline"
                          >
                            {row.season_code}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[#F1EEE7]">
                          {row.competition_name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#F1EEE7]">
                          {row.appearances ?? 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                          {row.starts ?? '—'} / {row.sub_appearances ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-[#C9A64B]">
                          {row.goals ?? 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                          {row.assists ?? 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                          {row.minutes_played !== null
                            ? `${row.minutes_played.toLocaleString('en-US')}'`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#AAA69C]">
                          {row.yellow_cards ?? '—'} / {row.red_cards ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Honours & Transfers Grid */}
      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Honours & Individual Awards */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2 border-b border-[#3B321F]/60 pb-3">
            <Trophy className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
              Real Madrid Honours &amp; Awards
            </h2>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
              Collective Club Trophies ({player.all_time_rm_trophies ?? 0})
            </h3>
            {player.major_honours && player.major_honours.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {player.major_honours.map((h, i) => (
                  <li
                    key={i}
                    className="rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-xs text-[#F1EEE7]"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[#AAA69C]">
                No collective honours itemized.
              </p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E6D3A0]">
              <Award className="h-3.5 w-3.5 text-[#C9A64B]" />
              Verified Individual Recognitions at Real Madrid
            </h3>
            {player.individual_awards && player.individual_awards.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {player.individual_awards.map((aw, i) => (
                  <li
                    key={i}
                    className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-3 py-1.5 text-xs text-[#E6D3A0]"
                  >
                    {aw}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[#AAA69C]">
                None recorded in primary dataset.
              </p>
            )}
          </div>
        </div>

        {/* Transfers */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-[#C9A64B]" />
              <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
                Real Madrid Transfer Records
              </h2>
            </div>
            <Link
              href="/transfers"
              className="text-xs text-[#C9A64B] hover:text-[#E6D3A0]"
            >
              Full Transfer Archive &rarr;
            </Link>
          </div>

          {transfers.length === 0 ? (
            <p className="mt-4 text-xs text-[#AAA69C]">
              Youth academy graduate (La Fábrica) or transfer transaction not separately itemized.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#3B321F]/50 text-xs">
              {transfers.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        t.direction === 'IN'
                          ? 'bg-[#14291A] text-[#6CC070]'
                          : 'bg-[#291414] text-[#E06C75]'
                      }`}
                    >
                      {t.direction === 'IN' ? 'Arrival (IN)' : 'Departure (OUT)'}
                    </span>
                    <span className="font-mono text-[#C9A64B]">
                      {t.season_code} {t.transfer_date ? `· ${t.transfer_date}` : ''}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#F1EEE7]">
                    {t.previous_club} &rarr; {t.destination_club}
                  </p>
                  <p className="mt-1 text-[#AAA69C]">
                    Reported Fee: <strong className="text-[#E6D3A0]">{t.fee_display}</strong> ({t.transfer_type})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Detailed Match Appearances Log */}
      {matchAppearances.length > 0 && (
        <section className="mt-10 rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C9A64B]" />
              <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
                Verified Match-by-Match Appearances (Detailed Match Sheets)
              </h2>
            </div>
            <span className="text-xs text-[#AAA69C]">
              Showing {matchAppearances.length} verified match sheets
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Season &amp; Comp</th>
                  <th className="px-4 py-2.5">Fixture</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5 text-right">Minutes</th>
                  <th className="px-4 py-2.5 text-right">Goals</th>
                  <th className="px-4 py-2.5 text-right">Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {matchAppearances.map((m) => (
                  <tr key={m.match_id} className="hover:bg-[#171717]/60">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[#F1EEE7]">
                      {m.match_date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[#C9A64B]">{m.season_code}</span>{' '}
                      · {m.competition_name}
                    </td>
                    <td className="px-4 py-2.5 text-[#F1EEE7]">
                      {m.home_team} vs {m.away_team}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-[#E6D3A0]">
                      {m.home_score}–{m.away_score}
                    </td>
                    <td className="px-4 py-2.5 text-[#AAA69C]">
                      {m.started ? 'Starter' : 'Substitute'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#F1EEE7]">
                      {m.minutes_played !== null ? `${m.minutes_played}'` : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-[#C9A64B]">
                      {m.goals}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/matches/${m.match_id}`}
                        className="text-[#C9A64B] hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Source Citation Footer */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded border border-[#3B321F]/60 bg-[#111111] px-6 py-4 text-xs text-[#AAA69C]">
        <div>
          Primary Source Attribution:{' '}
          <strong className="text-[#F1EEE7]">{player.source_citation}</strong>
        </div>
        {player.source_url && (
          <a
            href={player.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#C9A64B] hover:text-[#E6D3A0]"
          >
            External Reference
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
