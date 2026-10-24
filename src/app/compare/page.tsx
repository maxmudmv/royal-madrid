import React from 'react';
import type { Metadata } from 'next';
import { getPlayersArchive } from '@/lib/queries';
import { getDb } from '@/lib/db';
import { CompareClient, type ComparePlayerItem } from '@/components/CompareClient';

export const metadata: Metadata = {
  title: 'Player Comparison Matrix (2 to 4 Real Madrid Players)',
  description:
    'Compare 2 to 4 Real Madrid CF first-team players side-by-side across appearances, goals, assists, minutes, cards, trophies, and seasonal/competition breakdowns.',
};

interface ComparePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const sp = await searchParams;
  const rawPlayersParam = Array.isArray(sp.players)
    ? sp.players.join(',')
    : sp.players || '';

  const initialSlugs = rawPlayersParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const { allPlayers } = await getPlayersArchive();
  const db = await getDb();

  const seasonStatsRes = await db.query<{
    player_id: number;
    season_code: string;
    competition_name: string;
    appearances: number | null;
    goals: number | null;
    assists: number | null;
    minutes_played: number | null;
  }>(
    `SELECT pss.player_id, s.code AS season_code, c.short_name AS competition_name,
            pss.appearances, pss.goals, pss.assists, pss.minutes_played
     FROM player_season_stats pss
     JOIN seasons s ON s.id = pss.season_id
     JOIN competitions c ON c.id = pss.competition_id
     ORDER BY s.start_year DESC, c.display_order ASC;`
  );

  const statsByPlayerId = new Map<
    number,
    ComparePlayerItem['seasonBreakdowns']
  >();
  for (const row of seasonStatsRes.rows) {
    const arr = statsByPlayerId.get(row.player_id) || [];
    arr.push({
      season_code: row.season_code,
      competition_name: row.competition_name,
      appearances: row.appearances,
      goals: row.goals,
      assists: row.assists,
      minutes_played: row.minutes_played,
    });
    statsByPlayerId.set(row.player_id, arr);
  }

  const compareItems: ComparePlayerItem[] = allPlayers.map((p) => ({
    ...p,
    seasonBreakdowns: statsByPlayerId.get(p.id) || [],
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          Side-by-Side Statistical Benchmarking
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          PLAYER COMPARISON MATRIX
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          Compare between 2 and 4 Real Madrid CF first-team players across appearances, goals, assists, minutes played, disciplinary cards, trophies won, and seasonal/competition breakdowns.
        </p>
      </div>

      <div className="mt-8">
        <CompareClient players={compareItems} initialSlugs={initialSlugs} />
      </div>
    </div>
  );
}
