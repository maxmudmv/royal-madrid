'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  HelpCircle,
} from 'lucide-react';

export interface TransferRow {
  id: number;
  external_id: string;
  player_id: number | null;
  player_slug: string | null;
  player_name: string;
  player_position: string | null;
  season_code: string;
  transfer_year: number;
  transfer_date: string | null;
  direction: 'IN' | 'OUT';
  previous_club: string;
  destination_club: string;
  fee_eur: string | null;
  fee_display: string;
  transfer_type: string;
  era_category: string;
  notes: string | null;
  source_name: string;
  source_url: string | null;
  verification_status: string;
}

export function TransfersClient({ transfers }: { transfers: TransferRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT'>(
    'ALL'
  );
  const [seasonFilter, setSeasonFilter] = useState('ALL');
  const [eraFilter, setEraFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');

  const seasons = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => set.add(t.season_code));
    return Array.from(set);
  }, [transfers]);

  const eras = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => set.add(t.era_category));
    return Array.from(set);
  }, [transfers]);

  const positions = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => {
      if (t.player_position) set.add(t.player_position);
    });
    return Array.from(set);
  }, [transfers]);

  const filtered = useMemo(() => {
    return transfers.filter((t) => {
      if (directionFilter !== 'ALL' && t.direction !== directionFilter)
        return false;
      if (seasonFilter !== 'ALL' && t.season_code !== seasonFilter)
        return false;
      if (eraFilter !== 'ALL' && t.era_category !== eraFilter) return false;
      if (positionFilter !== 'ALL' && t.player_position !== positionFilter)
        return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          t.player_name.toLowerCase().includes(q) ||
          t.previous_club.toLowerCase().includes(q) ||
          t.destination_club.toLowerCase().includes(q) ||
          t.season_code.toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    transfers,
    directionFilter,
    seasonFilter,
    eraFilter,
    positionFilter,
    searchQuery,
  ]);

  const summary = useMemo(() => {
    const arrivals = filtered.filter((t) => t.direction === 'IN').length;
    const departures = filtered.filter((t) => t.direction === 'OUT').length;
    const undisclosed = filtered.filter((t) => t.fee_eur === null).length;
    return { arrivals, departures, undisclosed };
  }, [filtered]);

  return (
    <div>
      {/* Filter Controls */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            <Filter className="h-3.5 w-3.5" />
            Transfer Registry Filters
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setDirectionFilter('ALL');
              setSeasonFilter('ALL');
              setEraFilter('ALL');
              setPositionFilter('ALL');
            }}
            className="text-xs text-[#AAA69C] hover:text-[#E6D3A0]"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div>
            <label
              htmlFor="transfer-search"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
            >
              Player or Club Search
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#AAA69C]" />
              <input
                id="transfer-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zidane, Bellingham, Man Utd..."
                className="w-full rounded border border-[#3B321F] bg-[#171717] py-2 pl-9 pr-3 text-xs text-[#F1EEE7] placeholder-[#AAA69C]/50 focus:border-[#C9A64B] focus:outline-none"
              />
            </div>
          </div>

          {/* Direction IN / OUT */}
          <div>
            <label
              htmlFor="transfer-dir"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
            >
              Direction (IN / OUT)
            </label>
            <select
              id="transfer-dir"
              value={directionFilter}
              onChange={(e) =>
                setDirectionFilter(e.target.value as 'ALL' | 'IN' | 'OUT')
              }
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Movements (IN &amp; OUT)</option>
              <option value="IN">Arrivals Only (IN to Real Madrid)</option>
              <option value="OUT">Departures Only (OUT from Real Madrid)</option>
            </select>
          </div>

          {/* Season */}
          <div>
            <label
              htmlFor="transfer-season"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
            >
              Season
            </label>
            <select
              id="transfer-season"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Era */}
          <div>
            <label
              htmlFor="transfer-era"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
            >
              Historical Era
            </label>
            <select
              id="transfer-era"
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Eras</option>
              {eras.map((er) => (
                <option key={er} value={er}>
                  {er}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label
              htmlFor="transfer-pos"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
            >
              Position
            </label>
            <select
              id="transfer-pos"
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Matching Transfers
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
            {filtered.length}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Arrivals (IN)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#6CC070]">
            {summary.arrivals}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Departures (OUT)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#E06C75]">
            {summary.departures}
          </p>
        </div>
        <div className="rounded border border-[#3B321F]/80 bg-[#111111] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
            Undisclosed / Free (NULL Fee)
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-[#C9A64B]">
            {summary.undisclosed}
          </p>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="mt-6 overflow-hidden rounded border border-[#3B321F] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-4 py-3.5">Season &amp; Date</th>
                <th className="px-4 py-3.5">Player &amp; Position</th>
                <th className="px-4 py-3.5">Direction</th>
                <th className="px-4 py-3.5">Previous Club &rarr; Destination</th>
                <th className="px-4 py-3.5">Reported Fee</th>
                <th className="px-4 py-3.5">Context &amp; Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="transition-colors hover:bg-[#171717]/80"
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-[#C9A64B]">
                      {t.season_code}
                    </span>
                    <p className="mt-0.5 font-mono text-[11px] text-[#AAA69C]">
                      {t.transfer_date || `Year ${t.transfer_year}`}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {t.player_slug ? (
                      <Link
                        href={`/players/${t.player_slug}`}
                        className="font-serif text-sm font-bold text-[#F1EEE7] hover:text-[#C9A64B]"
                      >
                        {t.player_name}
                      </Link>
                    ) : (
                      <span className="font-serif text-sm font-bold text-[#F1EEE7]">
                        {t.player_name}
                      </span>
                    )}
                    <p className="mt-0.5 text-[11px] text-[#AAA69C]">
                      {t.player_position || 'First Team'} · {t.era_category}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {t.direction === 'IN' ? (
                      <span className="inline-flex items-center gap-1 rounded border border-[#2E6B3E] bg-[#14291A] px-2 py-0.5 text-[10px] font-bold uppercase text-[#6CC070]">
                        <ArrowDownLeft className="h-3 w-3" />
                        Arrival (IN)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-[#6B2E2E] bg-[#291414] px-2 py-0.5 text-[10px] font-bold uppercase text-[#E06C75]">
                        <ArrowUpRight className="h-3 w-3" />
                        Departure (OUT)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={
                          t.direction === 'OUT'
                            ? 'font-semibold text-[#E6D3A0]'
                            : 'text-[#AAA69C]'
                        }
                      >
                        {t.previous_club}
                      </span>
                      <span className="text-[#C9A64B]">&rarr;</span>
                      <span
                        className={
                          t.direction === 'IN'
                            ? 'font-semibold text-[#E6D3A0]'
                            : 'text-[#AAA69C]'
                        }
                      >
                        {t.destination_club}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {t.fee_eur === null ? (
                      <div className="inline-flex items-center gap-1.5 rounded border border-[#3B321F] bg-[#171717] px-2.5 py-1 text-[11px] text-[#E6D3A0]">
                        <HelpCircle className="h-3.5 w-3.5 text-[#C9A64B]" />
                        <span>{t.fee_display}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono text-sm font-bold text-[#C9A64B]">
                          {t.fee_display}
                        </span>
                        <p className="text-[10px] text-[#AAA69C]">
                          {t.transfer_type}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.verification_status} />
                      <span className="text-[11px] text-[#AAA69C]">
                        {t.source_name}
                      </span>
                    </div>
                    {t.notes && (
                      <p className="mt-1 max-w-xs text-[11px] leading-snug text-[#AAA69C]">
                        {t.notes}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
