import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { getHomepageData } from '@/lib/queries';
import { RoyalCrest } from '@/components/RoyalCrest';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { majorTrophies, timelineTeaser, legendsTeaser } =
    await getHomepageData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-24">
      {/* 1. ASYMMETRIC HERO SECTION */}
      <section
        aria-labelledby="hero-heading"
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-[#3B321F] pb-16 md:pb-24"
      >
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#3B321F] bg-[#111111] text-[11px] font-mono uppercase tracking-[0.22em] text-[#C9A64B]">
            <span>EST. 6 MARCH 1902 · MADRID, SPAIN</span>
          </div>

          <h1
            id="hero-heading"
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[0.12em] text-[#F1EEE7] leading-[1.05]"
          >
            ROYAL MADRID
          </h1>

          <p className="text-lg sm:text-xl text-[#AAA69C] max-w-2xl font-light leading-relaxed">
            A definitive, source-verified historical and statistical archive dedicated exclusively to Real Madrid CF&apos;s first-team men&apos;s football heritage—chronicling all-time honours since 1902 and official completed matches from 2011/12 onward.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              href="/honours"
              className="px-6 py-3 bg-[#C9A64B] text-[#080808] font-mono text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#E6D3A0] transition-colors inline-flex items-center gap-2"
            >
              Explore Honours Archive <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/matches"
              className="px-6 py-3 bg-[#111111] border border-[#3B321F] text-[#F1EEE7] font-mono text-xs uppercase tracking-[0.18em] hover:border-[#C9A64B] hover:text-[#E6D3A0] transition-colors"
            >
              Official Match Archive (2011/12+)
            </Link>
          </div>

          <p className="text-[11px] font-mono text-[#AAA69C]/75 pt-2">
            Independent historical reference project · Not affiliated with the official Real Madrid CF website.
          </p>
        </div>

        <div className="lg:col-span-4 flex justify-center lg:justify-end">
          <div className="p-8 bg-[#111111] border border-[#3B321F] relative">
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#C9A64B]" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#C9A64B]" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#C9A64B]" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#C9A64B]" />
            <RoyalCrest className="w-52 h-60" />
          </div>
        </div>
      </section>

      {/* 2. HONOURS SECTION — EXACTLY THREE MAJOR TROPHY METRICS */}
      <section aria-labelledby="honours-heading" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3B321F] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B] mb-1">
              VERIFIED CLUB HONOURS
            </p>
            <h2
              id="honours-heading"
              className="font-serif text-3xl sm:text-4xl text-[#F1EEE7]"
            >
              The Three Pillars of Supremacy
            </h2>
          </div>
          <Link
            href="/honours"
            className="text-xs font-mono uppercase tracking-[0.18em] text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1.5"
          >
            View Complete Honours &amp; Methodology <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {majorTrophies.slice(0, 3).map((trophy) => (
            <article
              key={trophy.competition_code}
              className="bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B]/60 transition-colors p-7 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#AAA69C]">
                    {trophy.competition_code === 'UCL'
                      ? 'EUROPEAN SOVEREIGNTY'
                      : trophy.competition_code === 'LA_LIGA'
                      ? 'SPANISH LEAGUE'
                      : 'NATIONAL CUP'}
                  </span>
                  <StatusBadge status={trophy.verification_status} compact />
                </div>

                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-6xl sm:text-7xl font-bold text-[#C9A64B] tracking-tight">
                    {trophy.title_count}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#E6D3A0]">
                    Official Titles
                  </span>
                </div>

                <h3 className="font-serif text-xl text-[#F1EEE7]">
                  {trophy.competition_name}
                </h3>

                <p className="text-xs text-[#AAA69C] leading-relaxed">
                  <strong className="text-[#E6D3A0]">Counting Methodology:</strong>{' '}
                  {trophy.counting_methodology}
                </p>

                <div className="text-[11px] font-mono text-[#AAA69C]/80 bg-[#171717] border border-[#3B321F]/80 p-3">
                  <span className="text-[#C9A64B] block mb-1">
                    Historical Nomenclature:
                  </span>
                  {trophy.historical_names}
                </div>
              </div>

              <div className="pt-4 border-t border-[#3B321F]/60 flex items-center justify-between text-[11px] font-mono text-[#AAA69C]">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C9A64B]" />
                  {trophy.source_name}
                </span>
                {trophy.source_url && (
                  <a
                    href={trophy.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1"
                  >
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. HISTORICAL TIMELINE TEASER */}
      <section aria-labelledby="history-teaser-heading" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3B321F] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B] mb-1">
              CHRONICLE · 1902 TO PRESENT
            </p>
            <h2
              id="history-teaser-heading"
              className="font-serif text-3xl sm:text-4xl text-[#F1EEE7]"
            >
              Defining Historical Milestones
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-mono uppercase tracking-[0.18em] text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1.5"
          >
            Explore Complete Historical Timeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l border-[#C9A64B]/60 space-y-8">
          {timelineTeaser.map((event) => (
            <div
              key={event.slug}
              className="relative bg-[#111111] border border-[#3B321F] p-6 hover:border-[#C9A64B]/60 transition-colors"
            >
              <span className="absolute -left-[31px] sm:-left-[39px] top-7 w-3.5 h-3.5 rounded-full bg-[#080808] border-2 border-[#C9A64B]" />
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-[#C9A64B]">
                    {event.year_display}
                  </span>
                  <span className="text-xs font-mono text-[#AAA69C]">
                    · {event.era}
                  </span>
                </div>
                <StatusBadge status={event.documentation_status} compact />
              </div>
              <h3 className="font-serif text-xl text-[#F1EEE7] mb-1.5">
                {event.title}
              </h3>
              <p className="text-sm text-[#AAA69C] leading-relaxed">
                {event.summary}
              </p>
              <div className="mt-3 pt-3 border-t border-[#3B321F]/50 flex items-center justify-between text-[11px] font-mono text-[#AAA69C]">
                <span>Source: {event.source_name}</span>
                <Link
                  href={`/history#${event.slug}`}
                  className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1"
                >
                  Read Archival Entry <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LEGENDS TEASER — EXACTLY THREE SELECTIONS */}
      <section aria-labelledby="legends-teaser-heading" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3B321F] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B] mb-1">
              IMMORTALS OF CHAMARTÍN
            </p>
            <h2
              id="legends-teaser-heading"
              className="font-serif text-3xl sm:text-4xl text-[#F1EEE7]"
            >
              Icons of the Royal Archive
            </h2>
          </div>
          <Link
            href="/legends"
            className="text-xs font-mono uppercase tracking-[0.18em] text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1.5"
          >
            Open Full Legends &amp; Managers Gallery <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {legendsTeaser.slice(0, 3).map((legend) => {
            const profileHref = legend.linked_player_slug
              ? `/players/${legend.linked_player_slug}`
              : `/legends#${legend.slug}`;

            return (
              <article
                key={legend.slug}
                className="bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B]/60 transition-colors flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <PlayerPortrait
                    name={legend.full_name}
                    portraitUrl={legend.portrait_url}
                    roleOrPosition={legend.position_or_title}
                    tenure={legend.tenure_display}
                    className="w-full h-64 border-b border-[#3B321F] border-t-0 border-x-0"
                  />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#C9A64B]">
                        {legend.role}
                      </span>
                      <span className="text-[11px] font-mono text-[#AAA69C]">
                        {legend.tenure_display}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-[#F1EEE7]">
                      {legend.full_name}
                    </h3>
                    <p className="text-xs text-[#AAA69C] leading-relaxed">
                      {legend.concise_description}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#171717] border-t border-[#3B321F] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    {legend.rm_appearances !== null && (
                      <span>
                        <strong className="text-[#E6D3A0]">
                          {legend.rm_appearances}
                        </strong>{' '}
                        <span className="text-[#AAA69C]">Apps</span>
                      </span>
                    )}
                    {legend.rm_goals !== null && (
                      <span>
                        <strong className="text-[#C9A64B]">
                          {legend.rm_goals}
                        </strong>{' '}
                        <span className="text-[#AAA69C]">Goals</span>
                      </span>
                    )}
                    <span>
                      <strong className="text-[#C9A64B]">
                        {legend.rm_trophies}
                      </strong>{' '}
                      <span className="text-[#AAA69C]">Trophies</span>
                    </span>
                  </div>

                  <Link
                    href={profileHref}
                    className="text-xs font-mono uppercase tracking-wider text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1"
                  >
                    Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
