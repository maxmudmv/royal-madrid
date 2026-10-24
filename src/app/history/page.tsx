import React from 'react';
import Link from 'next/link';
import { Trophy, Users, ExternalLink, AlertTriangle, BookOpen } from 'lucide-react';
import { getHistoryTimelineData } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ era?: string; category?: string }>;
}) {
  const params = await searchParams;
  const allEvents = await getHistoryTimelineData();

  const eras = Array.from(new Set(allEvents.map((e) => e.era)));
  const categories = Array.from(new Set(allEvents.map((e) => e.category)));

  const activeEra = params.era || 'ALL';
  const activeCategory = params.category || 'ALL';

  const filteredEvents = allEvents.filter((e) => {
    if (activeEra !== 'ALL' && e.era !== activeEra) return false;
    if (activeCategory !== 'ALL' && e.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      {/* Page Header */}
      <div className="border-b border-[#3B321F] pb-8 space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B]">
          COMPLETE HISTORICAL CHRONICLE · 1902–PRESENT
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#F1EEE7]">
          Club History &amp; Institutional Timeline
        </h1>
        <p className="text-sm sm:text-base text-[#AAA69C] max-w-3xl leading-relaxed">
          From the founding of Madrid Foot-Ball Club on 6 March 1902 and the 1920 Royal Decree of King Alfonso XIII to the 15 European Cups that define world football. Early eras with partial match-level documentation are explicitly flagged below.
        </p>
      </div>

      {/* Period Navigation & Category Filter Bar */}
      <div className="bg-[#111111] border border-[#3B321F] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#C9A64B] flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Navigate by Historical Era
          </span>
          {(activeEra !== 'ALL' || activeCategory !== 'ALL') && (
            <Link
              href="/history"
              className="text-xs font-mono text-[#E6D3A0] hover:underline"
            >
              Reset Period Filters ({allEvents.length} Total Entries)
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/history?era=ALL&category=${encodeURIComponent(activeCategory)}`}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
              activeEra === 'ALL'
                ? 'border-[#C9A64B] bg-[#C9A64B] text-[#080808] font-semibold'
                : 'border-[#3B321F] bg-[#171717] text-[#F1EEE7] hover:border-[#C9A64B]'
            }`}
          >
            All Historical Eras ({allEvents.length})
          </Link>
          {eras.map((era) => (
            <Link
              key={era}
              href={`/history?era=${encodeURIComponent(era)}&category=${encodeURIComponent(activeCategory)}`}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                activeEra === era
                  ? 'border-[#C9A64B] bg-[#C9A64B] text-[#080808] font-semibold'
                  : 'border-[#3B321F] bg-[#171717] text-[#F1EEE7] hover:border-[#C9A64B]'
              }`}
            >
              {era}
            </Link>
          ))}
        </div>

        <div className="pt-3 border-t border-[#3B321F]/60 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-[#AAA69C] mr-2">
            Category:
          </span>
          <Link
            href={`/history?era=${encodeURIComponent(activeEra)}&category=ALL`}
            className={`px-2.5 py-1 text-[11px] font-mono border ${
              activeCategory === 'ALL'
                ? 'border-[#C9A64B] text-[#E6D3A0] bg-[#C9A64B]/10'
                : 'border-[#3B321F] text-[#AAA69C]'
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/history?era=${encodeURIComponent(activeEra)}&category=${encodeURIComponent(cat)}`}
              className={`px-2.5 py-1 text-[11px] font-mono border ${
                activeCategory === cat
                  ? 'border-[#C9A64B] text-[#E6D3A0] bg-[#C9A64B]/10'
                  : 'border-[#3B321F] text-[#AAA69C]'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Historical Documentation Coverage Notice */}
      <div className="bg-[#171717] border-l-2 border-[#C9A64B] p-4 flex items-start gap-3 text-xs text-[#AAA69C]">
        <AlertTriangle className="w-4 h-4 text-[#C9A64B] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#E6D3A0]">Historical Coverage Policy:</strong>{' '}
          Institutional milestones, final scores, and trophy counts are verified from 1902 onward. Match-by-match preliminary round minutes from 1902–1928 are marked as <em>Partial Coverage</em> where early Spanish press archives lack full 90-minute match sheets. Detailed season-by-season match archives begin in the <strong>2011/12 season</strong>.
        </div>
      </div>

      {/* Full Vertical Timeline Connected by Subtle Gold Line */}
      <div className="relative pl-6 sm:pl-10 border-l border-[#C9A64B]/60 space-y-10">
        {filteredEvents.map((event) => (
          <article
            key={event.slug}
            id={event.slug}
            className="relative bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B]/60 transition-colors p-6 sm:p-8 scroll-mt-24"
          >
            {/* Gold Node Marker */}
            <span className="absolute -left-[31px] sm:-left-[47px] top-8 w-3.5 h-3.5 rounded-full bg-[#080808] border-2 border-[#C9A64B]" />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3B321F]/60 pb-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-[#171717] border border-[#C9A64B]/50 font-mono text-sm font-bold text-[#C9A64B]">
                  {event.year_display}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-[#E6D3A0]">
                  {event.era}
                </span>
                <span className="text-xs font-mono text-[#AAA69C] px-2 py-0.5 bg-[#080808] border border-[#3B321F]">
                  {event.category}
                </span>
              </div>
              <StatusBadge status={event.documentation_status} />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-[#F1EEE7] mb-3">
              {event.title}
            </h2>

            <p className="text-sm sm:text-base text-[#F1EEE7]/90 font-medium mb-3">
              {event.summary}
            </p>

            <p className="text-xs sm:text-sm text-[#AAA69C] leading-relaxed mb-6">
              {event.detailed_narrative}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#3B321F]/60">
              {event.trophies_associated?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C9A64B] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Associated Honours
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {event.trophies_associated.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] font-mono bg-[#171717] border border-[#3B321F] text-[#E6D3A0]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.key_figures?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C9A64B] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Key Figures &amp; Protagonists
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {event.key_figures.map((person) => (
                      <span
                        key={person}
                        className="px-2 py-0.5 text-[11px] font-mono bg-[#080808] border border-[#3B321F] text-[#F1EEE7]"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {event.documentation_note && (
              <div className="mt-4 pt-3 border-t border-[#3B321F]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#AAA69C]">
                <span>Archival Scope Note: {event.documentation_note}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span>Source: {event.source_name}</span>
                  {event.source_url && (
                    <a
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
