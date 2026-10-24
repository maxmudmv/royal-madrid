'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlayerPortrait } from './PlayerPortrait';
import { StatusBadge } from './StatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Plus, X, AlertTriangle, Scale, ArrowRight } from 'lucide-react';

export interface ComparePlayerItem {
  id: number;
  slug: string;
  full_name: string;
  short_name: string;
  position: string;
  detailed_position: string | null;
  nationality: string;
  tenure_display: string;
  rm_tenure_start: number;
  rm_tenure_end: number | null;
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
  seasonBreakdowns: {
    season_code: string;
    competition_name: string;
    appearances: number | null;
    goals: number | null;
    assists: number | null;
    minutes_played: number | null;
  }[];
}

function fmt(val: number | null | undefined, suffix = ''): string {
  if (val === null || val === undefined) return 'Unavailable (NULL)';
  return `${val.toLocaleString('en-US')}${suffix}`;
}

const CHART_COLORS = ['#C9A64B', '#E6D3A0', '#6CC070', '#5C9CE6'];

export function CompareClient({
  players,
  initialSlugs,
}: {
  players: ComparePlayerItem[];
  initialSlugs: string[];
}) {
  const defaultSlugs = useMemo(() => {
    const valid = initialSlugs.filter((s) =>
      players.some((p) => p.slug === s)
    );
    if (valid.length >= 2) return valid.slice(0, 4);
    if (valid.length === 1) {
      const fallback =
        valid[0] === 'cristiano-ronaldo' ? 'karim-benzema' : 'cristiano-ronaldo';
      return [valid[0], fallback];
    }
    return ['cristiano-ronaldo', 'karim-benzema', 'raul-gonzalez'].filter((s) =>
      players.some((p) => p.slug === s)
    );
  }, [initialSlugs, players]);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(defaultSlugs);
  const [scopeMode, setScopeMode] = useState<'ALL_TIME' | 'ARCHIVE_2011'>(
    'ALL_TIME'
  );
  const [candidateSlug, setCandidateSlug] = useState<string>('');

  const selectedPlayers = useMemo(
    () =>
      selectedSlugs
        .map((s) => players.find((p) => p.slug === s))
        .filter((p): p is ComparePlayerItem => Boolean(p)),
    [selectedSlugs, players]
  );

  const availableToAdd = useMemo(
    () => players.filter((p) => !selectedSlugs.includes(p.slug)),
    [players, selectedSlugs]
  );

  const handleAddPlayer = () => {
    const target = candidateSlug || availableToAdd[0]?.slug;
    if (!target || selectedSlugs.length >= 4) return;
    if (!selectedSlugs.includes(target)) {
      setSelectedSlugs([...selectedSlugs, target]);
      setCandidateSlug('');
    }
  };

  const handleRemovePlayer = (slug: string) => {
    if (selectedSlugs.length <= 2) return;
    setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
  };

  const handleReplacePlayer = (index: number, newSlug: string) => {
    const next = [...selectedSlugs];
    next[index] = newSlug;
    setSelectedSlugs(next);
  };

  // Check if selected players span different historical coverage eras
  const hasCoverageDifference = useMemo(() => {
    const hasPre2011 = selectedPlayers.some((p) => p.rm_tenure_start < 2011);
    const hasPost2011 = selectedPlayers.some(
      (p) => p.archive_2011_rm_apps !== null
    );
    const hasMissingAssistsOrMins = selectedPlayers.some(
      (p) => p.all_time_rm_assists === null || p.all_time_rm_minutes === null
    );
    return (hasPre2011 && hasPost2011) || hasMissingAssistsOrMins;
  }, [selectedPlayers]);

  // Build BarChart dataset
  const chartData = useMemo(() => {
    const metrics = [
      {
        metric: 'Appearances',
        getVal: (p: ComparePlayerItem) =>
          scopeMode === 'ALL_TIME'
            ? (p.all_time_rm_apps ?? 0)
            : (p.archive_2011_rm_apps ?? 0),
      },
      {
        metric: 'Goals',
        getVal: (p: ComparePlayerItem) =>
          scopeMode === 'ALL_TIME'
            ? (p.all_time_rm_goals ?? 0)
            : (p.archive_2011_rm_goals ?? 0),
      },
      {
        metric: 'Assists',
        getVal: (p: ComparePlayerItem) =>
          scopeMode === 'ALL_TIME'
            ? (p.all_time_rm_assists ?? 0)
            : (p.archive_2011_rm_assists ?? 0),
      },
      {
        metric: 'Trophies',
        getVal: (p: ComparePlayerItem) => p.all_time_rm_trophies ?? 0,
      },
    ];

    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.metric };
      selectedPlayers.forEach((p) => {
        row[p.short_name] = m.getVal(p);
      });
      return row;
    });
  }, [selectedPlayers, scopeMode]);

  return (
    <div>
      {/* Selector & Scope Bar */}
      <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#3B321F]/60 pb-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
              Compare 2 to 4 Real Madrid Players (Real Madrid Careers Only)
            </p>
            <p className="mt-1 text-xs text-[#AAA69C]">
              Select between 2 and 4 players to compare side-by-side. Statistics from other clubs or national teams are strictly excluded.
            </p>
          </div>

          <div className="inline-flex rounded border border-[#3B321F] bg-[#080808] p-1">
            <button
              type="button"
              onClick={() => setScopeMode('ALL_TIME')}
              className={`rounded px-3.5 py-1.5 text-xs font-semibold transition ${
                scopeMode === 'ALL_TIME'
                  ? 'bg-[#C9A64B] text-[#080808]'
                  : 'text-[#AAA69C] hover:text-[#F1EEE7]'
              }`}
            >
              All-Time RM Career Scope
            </button>
            <button
              type="button"
              onClick={() => setScopeMode('ARCHIVE_2011')}
              className={`rounded px-3.5 py-1.5 text-xs font-semibold transition ${
                scopeMode === 'ARCHIVE_2011'
                  ? 'bg-[#C9A64B] text-[#080808]'
                  : 'text-[#AAA69C] hover:text-[#F1EEE7]'
              }`}
            >
              2011/12+ Detailed Archive Scope
            </button>
          </div>
        </div>

        {/* Add 3rd or 4th Player Control */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#AAA69C]">
              Comparing <strong className="text-[#F1EEE7]">{selectedPlayers.length}</strong> of 4 maximum slots
            </span>
          </div>

          {selectedPlayers.length < 4 && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Select player to add to comparison"
                value={candidateSlug || availableToAdd[0]?.slug || ''}
                onChange={(e) => setCandidateSlug(e.target.value)}
                className="rounded border border-[#3B321F] bg-[#171717] px-3 py-2 text-xs text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
              >
                {availableToAdd.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    + {p.short_name} ({p.tenure_display} · {p.position})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="inline-flex items-center gap-1.5 rounded border border-[#C9A64B] bg-[#C9A64B] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#080808] hover:bg-[#E6D3A0]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Player
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Historical Coverage Difference Warning Banner */}
      {hasCoverageDifference && (
        <div className="mt-6 flex items-start gap-3 rounded border border-[#C9A64B]/60 bg-[#2B2210]/70 p-4 text-xs text-[#E6D3A0]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A64B]" />
          <div>
            <p className="font-semibold uppercase tracking-wider text-[#F1EEE7]">
              Historical Coverage &amp; Era Asymmetry Notice
            </p>
            <p className="mt-1 leading-relaxed text-[#E6D3A0]/90">
              One or more selected players competed prior to the 2011/12 season. Detailed match-by-match minutes, assists, and disciplinary cards were not officially recorded in mid-20th-century competitions and remain explicitly marked as <code className="text-[#F1EEE7]">Unavailable (NULL)</code> rather than zero. When switching to the <strong className="text-[#F1EEE7]">2011/12+ Detailed Archive Scope</strong>, pre-2011/12 seasons (e.g., Cristiano Ronaldo’s 2009–2011 campaigns or Raúl’s 1994–2010 career) are excluded from the modern archive subset.
            </p>
          </div>
        </div>
      )}

      {/* Player Header Cards */}
      <div
        className={`mt-8 grid grid-cols-1 gap-6 ${
          selectedPlayers.length === 2
            ? 'md:grid-cols-2'
            : selectedPlayers.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {selectedPlayers.map((p, idx) => (
          <div
            key={p.slug}
            className="flex flex-col justify-between rounded border border-[#3B321F] bg-[#111111] p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#3B321F]/60 pb-3">
                <select
                  aria-label={`Change player in slot ${idx + 1}`}
                  value={p.slug}
                  onChange={(e) => handleReplacePlayer(idx, e.target.value)}
                  className="w-full rounded border border-[#3B321F] bg-[#171717] px-2.5 py-1.5 text-xs font-semibold text-[#E6D3A0] focus:border-[#C9A64B] focus:outline-none"
                >
                  {players.map((opt) => (
                    <option
                      key={opt.slug}
                      value={opt.slug}
                      disabled={
                        opt.slug !== p.slug && selectedSlugs.includes(opt.slug)
                      }
                    >
                      {opt.short_name} ({opt.tenure_display})
                    </option>
                  ))}
                </select>
                {selectedPlayers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(p.slug)}
                    title="Remove player from comparison"
                    className="rounded border border-[#3B321F] bg-[#171717] p-1.5 text-[#AAA69C] hover:border-[#E06C75] hover:text-[#E06C75]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-start gap-4">
                <PlayerPortrait
                  name={p.short_name}
                  portraitUrl={p.portrait_url}
                  subtitle={p.position}
                  className="h-24 w-20 shrink-0 rounded"
                />
                <div>
                  <span className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#E6D3A0]">
                    {p.position}
                  </span>
                  <h2 className="mt-1.5 font-serif text-xl font-bold text-[#F1EEE7]">
                    {p.short_name}
                  </h2>
                  <p className="font-mono text-xs text-[#C9A64B]">
                    RM: {p.tenure_display}
                  </p>
                  <p className="text-[11px] text-[#AAA69C]">{p.nationality}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#3B321F]/50 pt-3">
              <StatusBadge status={p.completeness_status} />
              <Link
                href={`/players/${p.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A64B] hover:text-[#E6D3A0]"
              >
                Full Profile
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Statistical Comparison Matrix */}
      <div className="mt-8 overflow-hidden rounded border border-[#3B321F] bg-[#111111]">
        <div className="flex items-center justify-between border-b border-[#3B321F] bg-[#171717] px-6 py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#C9A64B]" />
            <h3 className="font-serif text-lg font-bold text-[#F1EEE7]">
              Side-by-Side Real Madrid Statistical Matrix (
              {scopeMode === 'ALL_TIME'
                ? 'All-Time RM Career Totals'
                : '2011/12+ Detailed Archive Totals'}
              )
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#141414] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-5 py-3.5">Real Madrid Metric</th>
                {selectedPlayers.map((p) => (
                  <th
                    key={p.slug}
                    className="px-5 py-3.5 text-right text-xs font-bold text-[#E6D3A0]"
                  >
                    {p.short_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Real Madrid Tenure
                </td>
                {selectedPlayers.map((p) => (
                  <td
                    key={p.slug}
                    className="px-5 py-3 text-right font-mono text-[#F1EEE7]"
                  >
                    {p.tenure_display}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Primary Position
                </td>
                {selectedPlayers.map((p) => (
                  <td
                    key={p.slug}
                    className="px-5 py-3 text-right text-[#F1EEE7]"
                  >
                    {p.detailed_position || p.position}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-[#F1EEE7]">
                  Appearances ({scopeMode === 'ALL_TIME' ? 'All-Time RM' : '2011/12+'})
                </td>
                {selectedPlayers.map((p) => {
                  const v =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_apps
                      : p.archive_2011_rm_apps;
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-sm font-bold text-[#F1EEE7]"
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-[#C9A64B]">
                  Goals Scored ({scopeMode === 'ALL_TIME' ? 'All-Time RM' : '2011/12+'})
                </td>
                {selectedPlayers.map((p) => {
                  const v =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_goals
                      : p.archive_2011_rm_goals;
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-sm font-bold text-[#C9A64B]"
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Goals per Appearance Ratio
                </td>
                {selectedPlayers.map((p) => {
                  const apps =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_apps
                      : p.archive_2011_rm_apps;
                  const goals =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_goals
                      : p.archive_2011_rm_goals;
                  const ratio =
                    apps && apps > 0 && goals !== null
                      ? (goals / apps).toFixed(2)
                      : 'Unavailable (NULL)';
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-[#E6D3A0]"
                    >
                      {ratio}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Recorded Assists ({scopeMode === 'ALL_TIME' ? 'All-Time RM' : '2011/12+'})
                </td>
                {selectedPlayers.map((p) => {
                  const v =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_assists
                      : p.archive_2011_rm_assists;
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-[#F1EEE7]"
                    >
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Minutes Played ({scopeMode === 'ALL_TIME' ? 'All-Time RM' : '2011/12+'})
                </td>
                {selectedPlayers.map((p) => {
                  const v =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_minutes
                      : p.archive_2011_rm_minutes;
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-[#F1EEE7]"
                    >
                      {fmt(v, "'")}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-[#AAA69C]">
                  Yellow Cards / Red Cards
                </td>
                {selectedPlayers.map((p) => {
                  const y =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_yellow_cards
                      : p.archive_2011_rm_yellow_cards;
                  const r =
                    scopeMode === 'ALL_TIME'
                      ? p.all_time_rm_red_cards
                      : p.archive_2011_rm_red_cards;
                  return (
                    <td
                      key={p.slug}
                      className="px-5 py-3 text-right font-mono text-[#AAA69C]"
                    >
                      {fmt(y)} / {fmt(r)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-3 font-semibold text-[#E6D3A0]">
                  Official Real Madrid Trophies Won
                </td>
                {selectedPlayers.map((p) => (
                  <td
                    key={p.slug}
                    className="px-5 py-3 text-right font-mono text-sm font-bold text-[#E6D3A0]"
                  >
                    {fmt(p.all_time_rm_trophies, ' Trophies')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
          Visual Output Comparison
        </p>
        <h3 className="mt-1 font-serif text-xl font-bold text-[#F1EEE7]">
          Appearances, Goals, Assists &amp; Trophies Chart
        </h3>
        <div className="mt-6 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262116" />
              <XAxis
                dataKey="metric"
                stroke="#AAA69C"
                tick={{ fill: '#F1EEE7', fontSize: 12 }}
              />
              <YAxis
                stroke="#AAA69C"
                tick={{ fill: '#AAA69C', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#080808',
                  borderColor: '#C9A64B',
                  color: '#F1EEE7',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {selectedPlayers.map((p, i) => (
                <Bar
                  key={p.slug}
                  dataKey={p.short_name}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Season & Competition Breakdowns per Selected Player */}
      <div className="mt-8 rounded border border-[#3B321F] bg-[#111111] p-6">
        <h3 className="font-serif text-xl font-bold text-[#F1EEE7]">
          Season &amp; Competition Breakdowns (2011/12+ Granular Ledger)
        </h3>
        <p className="mt-1 text-xs text-[#AAA69C]">
          Granular seasonal and competition splits recorded in `player_season_stats` for each selected player.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {selectedPlayers.map((p) => (
            <div
              key={p.slug}
              className="rounded border border-[#3B321F]/70 bg-[#171717] p-4"
            >
              <div className="flex items-center justify-between border-b border-[#3B321F] pb-2.5">
                <h4 className="font-serif text-base font-bold text-[#E6D3A0]">
                  {p.short_name} ({p.tenure_display})
                </h4>
                <span className="text-[11px] text-[#AAA69C]">
                  {p.seasonBreakdowns.length} granular competition rows
                </span>
              </div>

              {p.seasonBreakdowns.length === 0 ? (
                <p className="mt-3 text-xs text-[#AAA69C]">
                  Pre-2011/12 tenure or seasonal split not separately itemized; see All-Time Real Madrid Career Totals above.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-[#3B321F] text-[#AAA69C]">
                        <th className="py-1.5">Season</th>
                        <th className="py-1.5">Competition</th>
                        <th className="py-1.5 text-right">Apps</th>
                        <th className="py-1.5 text-right">Goals</th>
                        <th className="py-1.5 text-right">Assists</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3B321F]/30">
                      {p.seasonBreakdowns.map((sb, i) => (
                        <tr key={i}>
                          <td className="py-1.5 font-mono text-[#C9A64B]">
                            {sb.season_code}
                          </td>
                          <td className="py-1.5 text-[#F1EEE7]">
                            {sb.competition_name}
                          </td>
                          <td className="py-1.5 text-right font-mono text-[#F1EEE7]">
                            {sb.appearances ?? 'N/A'}
                          </td>
                          <td className="py-1.5 text-right font-mono font-bold text-[#C9A64B]">
                            {sb.goals ?? 'N/A'}
                          </td>
                          <td className="py-1.5 text-right font-mono text-[#AAA69C]">
                            {sb.assists ?? 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
