'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Trophy, ArrowRight, ExternalLink } from 'lucide-react';
import { PlayerPortrait } from './PlayerPortrait';
import { StatusBadge } from './StatusBadge';

interface LegendItem {
  id: number;
  slug: string;
  full_name: string;
  role: string;
  position_or_title: string;
  era: string;
  tenure_display: string;
  nationality: string;
  birth_year: number | null;
  portrait_url: string | null;
  portrait_attribution: string | null;
  is_homepage_teaser: boolean;
  is_featured: boolean;
  concise_description: string;
  extended_biography: string;
  verified_achievements: string[];
  rm_appearances: number | null;
  rm_goals: number | null;
  rm_assists: number | null;
  rm_trophies: number;
  linked_player_slug: string | null;
  linked_manager_slug: string | null;
  source_name: string;
  source_url: string | null;
  verification_status: string;
}

export function LegendsExplorer({ legends }: { legends: LegendItem[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLAYER' | 'MANAGER'>('ALL');
  const [eraFilter, setEraFilter] = useState('ALL');

  const eras = useMemo(
    () => Array.from(new Set(legends.map((l) => l.era))),
    [legends]
  );

  const filtered = useMemo(() => {
    return legends.filter((l) => {
      if (roleFilter === 'PLAYER' && !l.role.toLowerCase().includes('player')) {
        return false;
      }
      if (roleFilter === 'MANAGER' && !l.role.toLowerCase().includes('manager')) {
        return false;
      }
      if (eraFilter !== 'ALL' && l.era !== eraFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          l.full_name.toLowerCase().includes(q) ||
          l.position_or_title.toLowerCase().includes(q) ||
          l.nationality.toLowerCase().includes(q) ||
          l.era.toLowerCase().includes(q) ||
          l.concise_description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [legends, roleFilter, eraFilter, search]);

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <div className="bg-[#111111] border border-[#3B321F] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#C9A64B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search legends & managers by name, role, nationality..."
              className="w-full pl-10 pr-4 py-2 bg-[#080808] border border-[#3B321F] text-sm text-[#F1EEE7] placeholder-[#AAA69C]/60 focus:border-[#C9A64B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            {(['ALL', 'PLAYER', 'MANAGER'] as const).map((rf) => (
              <button
                key={rf}
                type="button"
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  roleFilter === rf
                    ? 'border-[#C9A64B] bg-[#C9A64B] text-[#080808] font-semibold'
                    : 'border-[#3B321F] bg-[#171717] text-[#F1EEE7] hover:border-[#C9A64B]'
                }`}
              >
                {rf === 'ALL'
                  ? 'All Icons'
                  : rf === 'PLAYER'
                  ? 'Players'
                  : 'Managers'}
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            <select
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              aria-label="Filter legends by historical era"
              className="w-full px-3 py-2 bg-[#080808] border border-[#3B321F] text-xs font-mono text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
            >
              <option value="ALL">All Historical Eras</option>
              {eras.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legends Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((legend) => (
          <article
            key={legend.slug}
            id={legend.slug}
            className="bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B]/60 transition-colors flex flex-col justify-between scroll-mt-24"
          >
            <div>
              <PlayerPortrait
                name={legend.full_name}
                portraitUrl={legend.portrait_url}
                roleOrPosition={legend.position_or_title}
                tenure={legend.tenure_display}
                className="w-full h-64 border-b border-[#3B321F] border-t-0 border-x-0"
              />

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#C9A64B]">
                    {legend.role} · {legend.nationality}
                  </span>
                  <StatusBadge status={legend.verification_status} compact />
                </div>

                <div>
                  <h3 className="font-serif text-2xl text-[#F1EEE7]">
                    {legend.full_name}
                  </h3>
                  <p className="text-xs font-mono text-[#E6D3A0] mt-0.5">
                    {legend.position_or_title} ({legend.tenure_display})
                  </p>
                </div>

                <p className="text-xs text-[#AAA69C] leading-relaxed">
                  {legend.extended_biography}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#3B321F]/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A64B] flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Verified Achievements
                  </span>
                  <ul className="space-y-1 text-xs text-[#F1EEE7]/90">
                    {legend.verified_achievements.map((ach) => (
                      <li key={ach} className="flex items-start gap-1.5">
                        <span className="text-[#C9A64B] mt-0.5">•</span>
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#171717] border-t border-[#3B321F] space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center border-b border-[#3B321F]/60 pb-3 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-[#AAA69C] uppercase">
                    RM Apps
                  </span>
                  <strong className="text-[#F1EEE7]">
                    {legend.rm_appearances !== null
                      ? legend.rm_appearances
                      : 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#AAA69C] uppercase">
                    RM Goals
                  </span>
                  <strong className="text-[#C9A64B]">
                    {legend.rm_goals !== null ? legend.rm_goals : 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#AAA69C] uppercase">
                    Trophies
                  </span>
                  <strong className="text-[#E6D3A0]">
                    {legend.rm_trophies}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                {legend.linked_player_slug ? (
                  <Link
                    href={`/players/${legend.linked_player_slug}`}
                    className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1 uppercase tracking-wider"
                  >
                    Full Statistical Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-[#AAA69C] text-[11px]">
                    Managerial / Historical Record
                  </span>
                )}

                {legend.source_url && (
                  <a
                    href={legend.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#AAA69C] hover:text-[#E6D3A0] inline-flex items-center gap-1 text-[11px]"
                  >
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
