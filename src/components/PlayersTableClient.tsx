'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { Search, ArrowUpDown, UserCheck } from 'lucide-react';

export interface PlayerArchiveRow {
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
}

function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString('en-US');
}

export function PlayersTableClient({ players }: { players: PlayerArchiveRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [eraFilter, setEraFilter] = useState('ALL'); // 'ALL' | '2011_PLUS' | 'PRE_2011' | 'ACTIVE'
  const [scopeView, setScopeView] = useState<'ALL_TIME' | 'ARCHIVE_2011'>('ALL_TIME');
  const [sortBy, setSortBy] = useState<'goals' | 'apps' | 'trophies' | 'tenure'>('goals');

  const positions = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.position) set.add(p.position);
    });
    return Array.from(set);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (positionFilter !== 'ALL' && p.position !== positionFilter) {
          return false;
        }
        if (eraFilter === '2011_PLUS') {
          const playedSince2011 =
            p.rm_tenure_end === null || p.rm_tenure_end >= 2011 || p.rm_tenure_start >= 2011;
          if (!playedSince2011) return false;
        } else if (eraFilter === 'PRE_2011') {
          if (p.rm_tenure_start >= 2011) return false;
        } else if (eraFilter === 'ACTIVE') {
          if (p.rm_tenure_end !== null) return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            p.full_name.toLowerCase().includes(q) ||
            p.short_name.toLowerCase().includes(q) ||
            p.nationality.toLowerCase().includes(q) ||
            (p.detailed_position || '').toLowerCase().includes(q) ||
            p.tenure_display.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'goals') {
          const ga =
            scopeView === 'ALL_TIME'
              ? (a.all_time_rm_goals ?? -1)
              : (a.archive_2011_rm_goals ?? -1);
          const gb =
            scopeView === 'ALL_TIME'
              ? (b.all_time_rm_goals ?? -1)
              : (b.archive_2011_rm_goals ?? -1);
          return gb - ga;
        }
        if (sortBy === 'apps') {
          const aa =
            scopeView === 'ALL_TIME'
              ? (a.all_time_rm_apps ?? -1)
              : (a.archive_2011_rm_apps ?? -1);
          const ab =
            scopeView === 'ALL_TIME'
              ? (b.all_time_rm_apps ?? -1)
              : (b.archive_2011_rm_apps ?? -1);
          return ab - aa;
        }
        if (sortBy === 'trophies') {
          return (b.all_time_rm_trophies ?? -1) - (a.all_time_rm_trophies ?? -1);
        }
        return b.rm_tenure_start - a.rm_tenure_start;
      });
  }, [players, positionFilter, eraFilter, searchQuery, sortBy, scopeView]);

  return (
    <div>
      {/* Filter & Scope Controls */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#3B321F]/60 pb-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
              Statistical Scope Toggle
            </p>
            <p className="mt-1 text-xs text-[#AAA69C]">
              Switch table metrics between All-Time Real Madrid Career Totals and 2011/12+ Detailed Archive Totals.
            </p>
          </div>
          <div className="inline-flex rounded border border-[#3B321F] bg-[#080808] p-1">
            <button
              type="button"
              onClick={() => setScopeView('ALL_TIME')}
              className={`rounded px-3.5 py-1.5 text-xs font-semibold transition ${
                scopeView === 'ALL_TIME'
                  ? 'bg-[#C9A64B] text-[#080808]'
                  : 'text-[#AAA69C] hover:text-[#F1EEE7]'
              }`}
            >
              All-Time RM Career Totals
            </button>
            <button
              type="button"
              onClick={() => setScopeView('ARCHIVE_2011')}
              className={`rounded px-3.5 py-1.5 text-xs font-semibold transition ${
                scopeView === 'ARCHIVE_2011'
                  ? 'bg-[#C9A64B] text-[#080808]'
                  : 'text-[#AAA69C] hover:text-[#F1EEE7]'
              }`}
            >
              2011/12+ Detailed Archive Totals
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="player-search" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Search Player / Nationality
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#AAA69C]" />
              <input
                id="player-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cristiano, Modrić, Raúl, France..."
                className="w-full rounded border border-[#3B321F] bg-[#171717] py-2 pl-9 pr-3 text-xs text-[#F1EEE7] placeholder-[#AAA69C]/50 focus:border-[#C9A64B] focus:outline-none"
              />
            </div>
          </div>

          {/* Position Filter */}
          <div>
            <label htmlFor="player-pos" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Position
            </label>
            <select
              id="player-pos"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Era / Season Filter */}
          <div>
            <label htmlFor="player-era" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              Tenure &amp; Season Scope
            </label>
            <select
              id="player-era"
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Historical &amp; Modern Eras</option>
              <option value="2011_PLUS">Active in 2011/12+ Detailed Era</option>
              <option value="ACTIVE">Current Squad Members</option>
              <option value="PRE_2011">Debuted Prior to 2011/12</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="player-sort" className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]">
              <span className="inline-flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Sort By
              </span>
            </label>
            <select
              id="player-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'goals' | 'apps' | 'trophies' | 'tenure')
              }
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="goals">Real Madrid Goals (Highest First)</option>
              <option value="apps">Real Madrid Appearances (Highest First)</option>
              <option value="trophies">Official Club Trophies Won</option>
              <option value="tenure">Real Madrid Debut Year (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded border border-[#3B321F] bg-[#111111]">
        <div className="flex items-center justify-between border-b border-[#3B321F] bg-[#171717] px-6 py-3 text-xs">
          <span className="font-semibold text-[#F1EEE7]">
            Showing {filteredPlayers.length} Verified Real Madrid First-Team Players
          </span>
          <span className="text-[#C9A64B]">
            Scope:{' '}
            {scopeView === 'ALL_TIME'
              ? 'All-Time Real Madrid Career Totals'
              : '2011/12+ Detailed Archive Totals'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#141414] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-4 py-3.5">Player</th>
                <th className="px-4 py-3.5">Position</th>
                <th className="px-4 py-3.5">Nationality</th>
                <th className="px-4 py-3.5">RM Tenure</th>
                <th className="px-4 py-3.5 text-right">
                  {scopeView === 'ALL_TIME' ? 'All-Time Apps' : '2011/12+ Apps'}
                </th>
                <th className="px-4 py-3.5 text-right">
                  {scopeView === 'ALL_TIME' ? 'All-Time Goals' : '2011/12+ Goals'}
                </th>
                <th className="px-4 py-3.5 text-right">
                  {scopeView === 'ALL_TIME' ? 'All-Time Assists' : '2011/12+ Assists'}
                </th>
                <th className="px-4 py-3.5 text-right">RM Trophies</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              {filteredPlayers.map((p) => {
                const apps =
                  scopeView === 'ALL_TIME'
                    ? p.all_time_rm_apps
                    : p.archive_2011_rm_apps;
                const goals =
                  scopeView === 'ALL_TIME'
                    ? p.all_time_rm_goals
                    : p.archive_2011_rm_goals;
                const assists =
                  scopeView === 'ALL_TIME'
                    ? p.all_time_rm_assists
                    : p.archive_2011_rm_assists;

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-[#171717]/80"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/players/${p.slug}`}
                        className="font-serif text-sm font-bold text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        {p.short_name}
                      </Link>
                      <p className="text-[11px] text-[#AAA69C]">{p.full_name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded border border-[#3B321F] bg-[#171717] px-2 py-0.5 text-[11px] text-[#E6D3A0]">
                        {p.position}
                      </span>
                      {p.detailed_position && (
                        <p className="mt-0.5 text-[10px] text-[#AAA69C]">
                          {p.detailed_position}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#F1EEE7]">{p.nationality}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-[#AAA69C]">
                      {p.tenure_display}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#F1EEE7]">
                      {formatStat(apps)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-[#C9A64B]">
                      {formatStat(goals)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-[#AAA69C]">
                      {formatStat(assists)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#E6D3A0]">
                      {formatStat(p.all_time_rm_trophies)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.completeness_status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <Link
                        href={`/players/${p.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A64B] hover:text-[#E6D3A0]"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Dossier
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
