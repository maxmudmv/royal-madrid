'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  User,
  Calendar,
  Trophy,
  ArrowLeftRight,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface SearchResultsPayload {
  players: Array<{
    slug: string;
    short_name: string;
    position: string;
    tenure_display: string;
    all_time_rm_goals: number | null;
    all_time_rm_apps: number | null;
  }>;
  matches: Array<{
    id: number;
    match_date: string;
    season_code: string;
    competition_name: string;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
  }>;
  seasons: Array<{
    code: string;
    manager_names: string | null;
    trophies_won: string[];
    completeness_status: string;
  }>;
  managers: Array<{
    slug: string;
    full_name: string;
    tenure_display: string;
    trophies_won: number;
  }>;
  transfers: Array<{
    id: number;
    player_name: string;
    season_code: string;
    direction: string;
    previous_club: string;
    destination_club: string;
    fee_display: string;
  }>;
  historicalEvents: Array<{
    slug: string;
    year_display: string;
    title: string;
    era: string;
  }>;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsPayload | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch {
        // ignore transient network error
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results
    ? results.players.length +
      results.matches.length +
      results.seasons.length +
      results.managers.length +
      results.transfers.length +
      results.historicalEvents.length
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-sm pt-16 px-4 pb-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Global Archive Search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#111111] border border-[#C9A64B]/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#3B321F] bg-[#080808]">
          <Search className="w-5 h-5 text-[#C9A64B] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, matches (e.g. Dortmund, Barcelona), seasons (2023/24), managers, transfers, history..."
            className="w-full bg-transparent text-[#F1EEE7] placeholder-[#AAA69C]/60 text-sm md:text-base focus:outline-none"
            aria-label="Search Real Madrid Archive"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-mono text-[#AAA69C] hover:text-[#E6D3A0] px-2 py-1"
            >
              CLEAR
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#AAA69C] hover:text-[#F1EEE7] border border-[#3B321F]"
            aria-label="Close search modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick suggestions when empty */}
        {!query.trim() && (
          <div className="p-6 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-[#C9A64B]">
              Quick Archive Queries
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Cristiano Ronaldo',
                'Di Stéfano',
                'Bellingham',
                'Borussia Dortmund',
                '2011/12',
                '2023/24',
                'Ancelotti',
                'La Décima',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 text-xs bg-[#171717] border border-[#3B321F] text-[#F1EEE7] hover:border-[#C9A64B] hover:text-[#E6D3A0] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-[#3B321F]/60 flex items-center justify-between text-xs text-[#AAA69C]">
              <span>Database-backed search across 6 historical domains</span>
              <Link
                href="/search"
                onClick={onClose}
                className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1 font-mono uppercase"
              >
                Open Dedicated Search Page <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-sm font-mono text-[#AAA69C]">
            Querying PostgreSQL historical archive...
          </div>
        )}

        {/* Results */}
        {!loading && query.trim() && results && (
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-[#3B321F]/60">
            {totalResults === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-base text-[#F1EEE7] font-serif">
                  No verified Real Madrid archive records matched &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-[#AAA69C]">
                  Try searching by player surname (e.g. Modrić, Ronaldo), opponent club (e.g. Juventus, Bayern), or season code (e.g. 2016/17).
                </p>
              </div>
            ) : (
              <>
                {results.players.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <User className="w-3.5 h-3.5" /> Players ({results.players.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.players.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/players/${p.slug}`}
                          onClick={onClose}
                          className="p-3 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-[#F1EEE7]">
                              {p.short_name}
                            </div>
                            <div className="text-xs text-[#AAA69C]">
                              {p.position} · {p.tenure_display}
                            </div>
                          </div>
                          <div className="text-right font-mono text-xs text-[#E6D3A0]">
                            <div>{p.all_time_rm_apps ?? '—'} Apps</div>
                            <div className="text-[#C9A64B]">
                              {p.all_time_rm_goals ?? '—'} Goals
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.matches.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <Shield className="w-3.5 h-3.5" /> Official Completed Matches ({results.matches.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.matches.map((m) => (
                        <Link
                          key={m.id}
                          href={`/matches/${m.id}`}
                          onClick={onClose}
                          className="px-3 py-2.5 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors flex items-center justify-between text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-[#AAA69C]">
                              {m.match_date}
                            </span>
                            <span className="text-[#F1EEE7] font-medium">
                              {m.home_team}{' '}
                              <span className="text-[#C9A64B] font-mono px-1">
                                {m.home_score}–{m.away_score}
                              </span>{' '}
                              {m.away_team}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-[#E6D3A0]">
                            {m.competition_name} · {m.season_code}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.seasons.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <Calendar className="w-3.5 h-3.5" /> Seasons ({results.seasons.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.seasons.map((s) => (
                        <Link
                          key={s.code}
                          href={`/seasons?season=${encodeURIComponent(s.code)}`}
                          onClick={onClose}
                          className="p-3 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors"
                        >
                          <div className="text-sm font-mono font-semibold text-[#C9A64B]">
                            {s.code} Season
                          </div>
                          <div className="text-xs text-[#AAA69C] mt-0.5">
                            Manager: {s.manager_names || '—'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.managers.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <Trophy className="w-3.5 h-3.5" /> Managers ({results.managers.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.managers.map((mgr) => (
                        <Link
                          key={mgr.slug}
                          href={`/legends#${mgr.slug}`}
                          onClick={onClose}
                          className="p-3 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium text-[#F1EEE7]">
                              {mgr.full_name}
                            </div>
                            <div className="text-xs text-[#AAA69C]">
                              {mgr.tenure_display}
                            </div>
                          </div>
                          <span className="font-mono text-xs text-[#C9A64B]">
                            {mgr.trophies_won} Trophies
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.transfers.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Transfers ({results.transfers.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.transfers.map((t) => (
                        <Link
                          key={t.id}
                          href={`/transfers?q=${encodeURIComponent(t.player_name)}`}
                          onClick={onClose}
                          className="px-3 py-2 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-[#F1EEE7] font-medium">
                              {t.player_name}
                            </span>{' '}
                            <span className="text-[#AAA69C]">
                              ({t.previous_club} → {t.destination_club})
                            </span>
                          </div>
                          <span className="font-mono text-[#E6D3A0]">
                            {t.season_code} · {t.fee_display}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.historicalEvents.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B] mb-2.5">
                      <Clock className="w-3.5 h-3.5" /> Historical Timeline ({results.historicalEvents.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.historicalEvents.map((ev) => (
                        <Link
                          key={ev.slug}
                          href={`/history#${ev.slug}`}
                          onClick={onClose}
                          className="px-3 py-2 bg-[#171717] border border-[#3B321F] hover:border-[#C9A64B] transition-colors flex items-center justify-between text-xs"
                        >
                          <span className="text-[#F1EEE7] font-medium">
                            {ev.title}
                          </span>
                          <span className="font-mono text-[#C9A64B] shrink-0 ml-2">
                            {ev.year_display}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
