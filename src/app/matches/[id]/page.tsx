import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMatchDetailById } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MatchDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) return { title: 'Match Not Found' };
  const detail = await getMatchDetailById(matchId);
  if (!detail) return { title: 'Match Not Found' };
  const { match } = detail;
  return {
    title: `${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} (${match.match_date})`,
    description: `Official match archive sheet for ${match.home_team} vs ${match.away_team} in ${match.competition_name} (${match.season_code}).`,
  };
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const detail = await getMatchDetailById(matchId);
  if (!detail) notFound();

  const { match, events, lineups, substitutions, playerMatchStats } = detail;

  const goalEvents = events.filter((e) =>
    ['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.event_type)
  );
  const cardEvents = events.filter((e) =>
    ['YELLOW_CARD', 'SECOND_YELLOW_RED', 'RED_CARD'].includes(e.event_type)
  );

  const rmStarters = lineups.filter((l) => l.is_real_madrid && l.is_starting);
  const oppStarters = lineups.filter((l) => !l.is_real_madrid && l.is_starting);

  const rmSubs = substitutions.filter((s) => s.is_real_madrid);
  const oppSubs = substitutions.filter((s) => !s.is_real_madrid);

  const outcomeLabel =
    match.rm_result === 'W'
      ? 'Real Madrid Victory'
      : match.rm_result === 'D'
        ? 'Official Draw'
        : 'Real Madrid Defeat';

  const outcomeColor =
    match.rm_result === 'W'
      ? 'border-[#2E6B3E] bg-[#14291A] text-[#6CC070]'
      : match.rm_result === 'D'
        ? 'border-[#6E5623] bg-[#2B2210] text-[#E6D3A0]'
        : 'border-[#6B2E2E] bg-[#291414] text-[#E06C75]';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B] hover:text-[#E6D3A0]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches Archive
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={match.completeness_status} />
          {match.is_manual_override && (
            <span className="rounded border border-[#C9A64B] bg-[#C9A64B]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#E6D3A0]">
              Protected Admin Override
            </span>
          )}
        </div>
      </div>

      {/* Match Scoreboard Banner */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3B321F]/60 pb-4 text-xs text-[#AAA69C]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-2.5 py-0.5 font-mono font-semibold text-[#E6D3A0]">
              {match.season_code}
            </span>
            <span className="font-semibold uppercase tracking-wider text-[#F1EEE7]">
              {match.competition_name}
            </span>
            {(match.stage || match.matchday) && (
              <span className="text-[#AAA69C]">
                · {[match.stage, match.matchday].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <span
            className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${outcomeColor}`}
          >
            {outcomeLabel} ({match.rm_result})
          </span>
        </div>

        {/* Teams and Final Score */}
        <div className="my-8 grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <div className="text-center md:text-right">
            <span className="inline-block rounded bg-[#171717] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#AAA69C]">
              Home Club
            </span>
            <h1
              className={`mt-2 font-serif text-2xl font-bold sm:text-4xl ${
                match.rm_is_home ? 'text-[#E6D3A0]' : 'text-[#F1EEE7]'
              }`}
            >
              {match.home_team}
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="rounded border border-[#C9A64B]/50 bg-[#080808] px-8 py-4 font-mono text-4xl font-bold tracking-wider text-[#F1EEE7] sm:text-5xl">
              {match.home_score} <span className="text-[#C9A64B]">–</span>{' '}
              {match.away_score}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[#AAA69C]">
              <span>
                Half-Time:{' '}
                <strong className="font-mono text-[#F1EEE7]">
                  {match.ht_home_score !== null && match.ht_away_score !== null
                    ? `${match.ht_home_score}–${match.ht_away_score}`
                    : 'Unavailable'}
                </strong>
              </span>
              {match.went_to_extra_time && (
                <span>
                  · After Extra Time:{' '}
                  <strong className="font-mono text-[#E6D3A0]">
                    {match.aet_home_score ?? match.home_score}–
                    {match.aet_away_score ?? match.away_score}
                  </strong>
                </span>
              )}
              {match.went_to_penalties && (
                <span>
                  · Penalties:{' '}
                  <strong className="font-mono text-[#C9A64B]">
                    {match.pen_home_score}–{match.pen_away_score}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className="text-center md:text-left">
            <span className="inline-block rounded bg-[#171717] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#AAA69C]">
              Away Club
            </span>
            <h2
              className={`mt-2 font-serif text-2xl font-bold sm:text-4xl ${
                !match.rm_is_home ? 'text-[#E6D3A0]' : 'text-[#F1EEE7]'
              }`}
            >
              {match.away_team}
            </h2>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="grid grid-cols-1 gap-4 border-t border-[#3B321F]/60 pt-6 text-xs text-[#AAA69C] sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-[#C9A64B]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                Date &amp; Kickoff
              </p>
              <p className="font-mono font-medium text-[#F1EEE7]">
                {match.match_date}{' '}
                {match.kickoff_time ? `· ${match.kickoff_time} CET` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-[#C9A64B]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                Venue &amp; City
              </p>
              <p className="font-medium text-[#F1EEE7]">
                {match.venue
                  ? `${match.venue}${match.city ? `, ${match.city}` : ''}`
                  : 'Unavailable in source'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-[#C9A64B]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                Official Attendance
              </p>
              <p className="font-mono font-medium text-[#F1EEE7]">
                {match.attendance !== null
                  ? match.attendance.toLocaleString('en-US')
                  : 'Unavailable in source'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#C9A64B]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                Match Referee
              </p>
              <p className="font-medium text-[#F1EEE7]">
                {match.referee || 'Unavailable in source'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Cards Section */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Goalscorers & Goal Minutes */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
            <h3 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Goal Scorers &amp; Minutes
            </h3>
            <span className="text-[11px] uppercase tracking-wider text-[#C9A64B]">
              Distinguishing Penalties &amp; Own Goals
            </span>
          </div>

          {goalEvents.length === 0 ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              {match.home_score === 0 && match.away_score === 0 ? (
                <p className="text-[#F1EEE7]">
                  Goalless draw (0–0). No goals were scored in regulation or extra time.
                </p>
              ) : (
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A64B]" />
                  <div>
                    <p className="font-semibold text-[#E6D3A0]">
                      Minute-by-minute goalscorer breakdown unavailable in standard summary file
                    </p>
                    <p className="mt-1 leading-relaxed">
                      In accordance with strict archive rules, goalscorers are never inferred or fabricated from the final score ({match.home_score}–{match.away_score}). Only verified match sheets display individual scorer minutes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#3B321F]/40">
              {goalEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex w-12 justify-center rounded border border-[#C9A64B]/40 bg-[#080808] py-0.5 font-mono text-[11px] font-bold text-[#E6D3A0]">
                      {ev.minute_display}
                    </span>
                    <div>
                      {ev.player_slug ? (
                        <Link
                          href={`/players/${ev.player_slug}`}
                          className="font-semibold text-[#F1EEE7] hover:text-[#C9A64B]"
                        >
                          {ev.player_name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#F1EEE7]">
                          {ev.player_name}
                        </span>
                      )}
                      {ev.event_type === 'PENALTY_GOAL' && (
                        <span className="ml-2 rounded border border-[#C9A64B]/50 bg-[#C9A64B]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#E6D3A0]">
                          Penalty
                        </span>
                      )}
                      {ev.event_type === 'OWN_GOAL' && (
                        <span className="ml-2 rounded border border-[#6B2E2E] bg-[#291414] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#E06C75]">
                          Own Goal (o.g.)
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      ev.is_real_madrid
                        ? 'bg-[#C9A64B]/15 text-[#E6D3A0]'
                        : 'bg-[#171717] text-[#AAA69C]'
                    }`}
                  >
                    {ev.is_real_madrid ? 'Real Madrid' : 'Opponent'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Yellow and Red Cards */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
            <h3 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Disciplinary Record (Yellow &amp; Red Cards)
            </h3>
            <span className="text-[11px] uppercase tracking-wider text-[#AAA69C]">
              Official Match Bookings
            </span>
          </div>

          {cardEvents.length === 0 ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              {match.has_lineups ? (
                <p>No disciplinary bookings recorded in this match sheet.</p>
              ) : (
                <p>
                  Booking minutes are <strong className="text-[#E6D3A0]">Unavailable</strong> for matches sourced from competition scoreline summaries.
                </p>
              )}
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#3B321F]/40">
              {cardEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex w-12 justify-center rounded border border-[#3B321F] bg-[#080808] py-0.5 font-mono text-[11px] text-[#AAA69C]">
                      {ev.minute_display}
                    </span>
                    <span
                      className={`inline-block h-3.5 w-2.5 rounded-xs ${
                        ev.event_type === 'YELLOW_CARD'
                          ? 'bg-[#E6B800]'
                          : 'bg-[#E04F5F]'
                      }`}
                      title={ev.event_type}
                    />
                    {ev.player_slug ? (
                      <Link
                        href={`/players/${ev.player_slug}`}
                        className="font-medium text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        {ev.player_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#F1EEE7]">
                        {ev.player_name}
                      </span>
                    )}
                    {ev.event_type !== 'YELLOW_CARD' && (
                      <span className="rounded bg-[#291414] px-1.5 py-0.5 text-[10px] font-semibold text-[#E06C75]">
                        {ev.event_type === 'SECOND_YELLOW_RED'
                          ? '2nd Yellow / Red'
                          : 'Direct Red'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#AAA69C]">
                    {ev.is_real_madrid ? 'Real Madrid' : 'Opponent'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Starting Lineups & Substitutions */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Starting XI */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
            <h3 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Starting Lineups (Starting XI)
            </h3>
            <StatusBadge status={match.has_lineups ? 'Verified' : 'Unavailable'} />
          </div>

          {!match.has_lineups || rmStarters.length === 0 ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              <p className="font-semibold text-[#E6D3A0]">
                Starting lineups unavailable in public-domain summary file
              </p>
              <p className="mt-1 leading-relaxed">
                Full starting XI and tactical substitutions are verified for all 38 La Liga fixtures in 2025/26 (`1-liga-full.txt`) and major European/Domestic Finals. Standard historical league files contain verified scorelines only.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="border-b border-[#C9A64B]/40 pb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
                  Real Madrid Starting XI
                </h4>
                <ol className="mt-3 space-y-2 text-xs">
                  {rmStarters.map((p, idx) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded bg-[#171717] px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 font-mono text-[10px] text-[#AAA69C]">
                          {p.shirt_number ?? idx + 1}
                        </span>
                        {p.player_slug ? (
                          <Link
                            href={`/players/${p.player_slug}`}
                            className="font-medium text-[#F1EEE7] hover:text-[#C9A64B]"
                          >
                            {p.player_name}
                          </Link>
                        ) : (
                          <span className="font-medium text-[#F1EEE7]">
                            {p.player_name}
                          </span>
                        )}
                      </div>
                      {p.is_captain && (
                        <span className="rounded border border-[#C9A64B] px-1 text-[9px] font-bold text-[#C9A64B]">
                          C
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="border-b border-[#3B321F] pb-2 text-xs font-semibold uppercase tracking-widest text-[#AAA69C]">
                  {match.rm_is_home ? match.away_team : match.home_team} XI
                </h4>
                {oppStarters.length === 0 ? (
                  <p className="mt-3 text-xs text-[#AAA69C]">
                    Opponent starting XI not itemized in this record.
                  </p>
                ) : (
                  <ol className="mt-3 space-y-2 text-xs">
                    {oppStarters.map((p, idx) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded bg-[#171717]/60 px-3 py-1.5 text-[#AAA69C]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 font-mono text-[10px] text-[#AAA69C]/60">
                            {idx + 1}
                          </span>
                          <span>{p.player_name}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Substitutions */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center justify-between border-b border-[#3B321F]/60 pb-3">
            <h3 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Official Substitutions
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#AAA69C]">
              <ArrowRightLeft className="h-3.5 w-3.5 text-[#C9A64B]" />
              In / Out Log
            </span>
          </div>

          {substitutions.length === 0 ? (
            <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-5 text-xs text-[#AAA69C]">
              Substitution logs are <strong className="text-[#E6D3A0]">Unavailable</strong> for this fixture in the free open dataset.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
                  Real Madrid Substitutions ({rmSubs.length})
                </h4>
                <ul className="mt-2 divide-y divide-[#3B321F]/40 text-xs">
                  {rmSubs.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded border border-[#C9A64B]/40 bg-[#080808] px-2 py-0.5 font-mono text-[11px] text-[#E6D3A0]">
                          {s.minute_display}
                        </span>
                        <span className="text-[#6CC070]">
                          IN: <strong>{s.player_in_name}</strong>
                        </span>
                      </div>
                      <span className="text-[#AAA69C]">
                        OUT: {s.player_out_name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {oppSubs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#AAA69C]">
                    Opponent Substitutions ({oppSubs.length})
                  </h4>
                  <ul className="mt-2 divide-y divide-[#3B321F]/40 text-xs">
                    {oppSubs.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between py-2 text-[#AAA69C]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="rounded bg-[#080808] px-2 py-0.5 font-mono text-[11px]">
                            {s.minute_display}
                          </span>
                          <span className="text-[#F1EEE7]">
                            IN: {s.player_in_name}
                          </span>
                        </div>
                        <span>OUT: {s.player_out_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Individual Player Match Statistics & Team Statistics */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3B321F]/60 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#F1EEE7]">
              Real Madrid Individual Player Match Statistics
            </h3>
            <p className="mt-1 text-xs text-[#AAA69C]">
              Verified minutes played, goals, penalties, bookings, and official rating availability. Missing metrics are never shown as zero.
            </p>
          </div>
          <span className="text-xs text-[#AAA69C]">
            Source: <strong className="text-[#E6D3A0]">{match.source_citation}</strong>
          </span>
        </div>

        {playerMatchStats.length === 0 ? (
          <div className="mt-6 rounded border border-[#3B321F]/60 bg-[#171717] p-6 text-xs text-[#AAA69C]">
            Individual player match minutes and statistics are <strong className="text-[#E6D3A0]">Unavailable</strong> for this fixture in the free open dataset.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Minutes</th>
                  <th className="px-4 py-3 text-right">Goals</th>
                  <th className="px-4 py-3 text-right">Penalties</th>
                  <th className="px-4 py-3 text-right">Assists</th>
                  <th className="px-4 py-3 text-right">Yellow / Red</th>
                  <th className="px-4 py-3 text-right">Official Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {playerMatchStats.map((pms) => (
                  <tr key={pms.id} className="hover:bg-[#171717]/60">
                    <td className="px-4 py-3 font-medium text-[#F1EEE7]">
                      {pms.player_slug ? (
                        <Link
                          href={`/players/${pms.player_slug}`}
                          className="text-[#E6D3A0] hover:underline"
                        >
                          {pms.player_name}
                        </Link>
                      ) : (
                        pms.player_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#AAA69C]">
                      {pms.started ? (
                        <span className="rounded bg-[#C9A64B]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#E6D3A0]">
                          Starter
                        </span>
                      ) : (
                        <span className="rounded bg-[#171717] px-1.5 py-0.5 text-[10px] text-[#AAA69C]">
                          Substitute
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F1EEE7]">
                      {pms.minutes_played !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#C9A64B]" />
                          {pms.minutes_played}&apos;
                        </span>
                      ) : (
                        <span className="text-[#AAA69C]">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#C9A64B]">
                      {pms.goals}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#AAA69C]">
                      {pms.penalty_goals}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#AAA69C]">
                      {pms.assists !== null ? pms.assists : '— (Unavailable)'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className="text-[#E6B800]">{pms.yellow_cards}Y</span>{' '}
                      / <span className="text-[#E04F5F]">{pms.red_cards}R</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-[#AAA69C]">
                      {pms.official_rating ?? 'Unavailable (No Free Source)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
