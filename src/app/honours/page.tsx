import React from 'react';
import { Trophy, ShieldCheck, ExternalLink, Info, Database } from 'lucide-react';
import { getHonoursData } from '@/lib/queries';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function HonoursPage() {
  const { trophies, coverageReport } = await getHonoursData();

  const totalOfficialTitles = trophies.reduce(
    (sum, t) => sum + t.title_count,
    0
  );

  const categories = [
    'Major Three',
    'European & Global',
    'Domestic & Historical',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Page Header */}
      <div className="border-b border-[#3B321F] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B]">
            VERIFIED ROLL OF HONOUR · 1902–PRESENT
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#F1EEE7]">
            Official Club Honours &amp; Trophies
          </h1>
          <p className="text-sm sm:text-base text-[#AAA69C] max-w-3xl leading-relaxed">
            Every official first-team men&apos;s competition won by Real Madrid CF, grouped by tournament with explicit historical naming methodology to prevent double-counting across competition format transitions.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#C9A64B]/50 px-6 py-4 flex items-center gap-4 shrink-0">
          <Trophy className="w-8 h-8 text-[#C9A64B]" />
          <div>
            <div className="font-serif text-3xl font-bold text-[#C9A64B]">
              {totalOfficialTitles}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#E6D3A0]">
              Verified Major Official Titles
            </div>
          </div>
        </div>
      </div>

      {/* Methodology & Anti-Double-Counting Notice */}
      <div className="bg-[#111111] border border-[#3B321F] p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B]">
          <Info className="w-4 h-4" /> Historical Nomenclature &amp; Counting Policy
        </div>
        <p className="text-xs sm:text-sm text-[#AAA69C] leading-relaxed">
          In strict compliance with UEFA, FIFA, and RFEF archival standards, competitions that changed their name or format are unified under a single lineage without duplication: the <strong>European Champion Clubs&apos; Cup (1955–1992)</strong> and <strong>UEFA Champions League (1992–present)</strong> form a single 15-title count; Spain&apos;s national knockout cup is unified across its four historical constitutional names into a single 20-title <strong>Copa del Rey</strong> count; and the <strong>1947 Copa Eva Duarte</strong> is catalogued separately from the modern <strong>Supercopa de España (1982–present, 13 titles)</strong>.
        </p>
      </div>

      {/* Trophies Grouped by Category */}
      {categories.map((category) => {
        const groupTrophies = trophies.filter((t) => t.category === category);
        return (
          <section key={category} className="space-y-6">
            <div className="border-b border-[#3B321F] pb-3 flex items-center justify-between">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#F1EEE7]">
                {category === 'Major Three'
                  ? 'Primary European & Domestic Pillars'
                  : category === 'European & Global'
                  ? 'International & Continental Competitions'
                  : 'Domestic Super Cups & Defunct Official Tournaments'}
              </h2>
              <span className="text-xs font-mono text-[#C9A64B]">
                {groupTrophies.reduce((s, x) => s + x.title_count, 0)} Titles in Group
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {groupTrophies.map((trophy) => (
                <article
                  key={trophy.competition_code}
                  className="bg-[#111111] border border-[#3B321F] hover:border-[#C9A64B]/60 transition-colors p-6 sm:p-8 space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3B321F]/60 pb-5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#C9A64B]">
                          {trophy.competition_code}
                        </span>
                        <StatusBadge status={trophy.verification_status} compact />
                        <span className="text-xs font-mono text-[#AAA69C]">
                          Scope: {trophy.completeness_scope}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-[#F1EEE7]">
                        {trophy.competition_name}
                      </h3>
                      {trophy.historical_names && (
                        <p className="text-xs font-mono text-[#AAA69C]">
                          Historical Naming: {trophy.historical_names}
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline gap-3 bg-[#080808] border border-[#3B321F] px-5 py-3 shrink-0">
                      <span className="font-serif text-4xl sm:text-5xl font-bold text-[#C9A64B]">
                        {trophy.title_count}
                      </span>
                      <div className="text-left">
                        <span className="block text-xs font-mono uppercase tracking-wider text-[#E6D3A0]">
                          Titles Won
                        </span>
                        {trophy.runner_up_count !== null && (
                          <span className="block text-[10px] font-mono text-[#AAA69C]">
                            Runner-up: {trophy.runner_up_count}×
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Winning Seasons / Years Pills */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#E6D3A0]">
                      Verified Winning Seasons / Editions ({trophy.winning_seasons.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {trophy.winning_seasons.map((yr) => (
                        <span
                          key={yr}
                          className="px-2.5 py-1 text-xs font-mono bg-[#171717] border border-[#3B321F] text-[#F1EEE7] hover:border-[#C9A64B]"
                        >
                          {yr}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#AAA69C] bg-[#171717] border border-[#3B321F]/80 p-4">
                    <div>
                      <strong className="text-[#C9A64B] block font-mono uppercase mb-1">
                        Counting Methodology
                      </strong>
                      {trophy.counting_methodology}
                    </div>
                    <div>
                      <strong className="text-[#C9A64B] block font-mono uppercase mb-1">
                        Historical Context
                      </strong>
                      {trophy.historical_context}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#AAA69C]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C9A64B]" />
                      Primary Source: {trophy.source_name} (Last checked: {trophy.last_verified_at})
                    </span>
                    {trophy.source_url && (
                      <a
                        href={trophy.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C9A64B] hover:text-[#E6D3A0] inline-flex items-center gap-1"
                      >
                        Official Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* Source Coverage Report Table */}
      <section className="space-y-4 pt-8 border-t border-[#3B321F]">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C9A64B]">
          <Database className="w-4 h-4" /> Factual Data Source Coverage &amp; Completeness Report
        </div>
        <h2 className="font-serif text-2xl text-[#F1EEE7]">
          Competition &amp; Historical Dataset Coverage Matrix
        </h2>
        <div className="overflow-x-auto border border-[#3B321F] bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#080808] font-mono uppercase text-[#C9A64B]">
                <th className="p-3.5">Competition</th>
                <th className="p-3.5">Season Scope</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Matches</th>
                <th className="p-3.5">Available Fields</th>
                <th className="p-3.5">Source &amp; License</th>
                <th className="p-3.5">Known Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/60">
              {coverageReport.map((row) => (
                <tr key={row.id} className="hover:bg-[#171717]">
                  <td className="p-3.5 font-medium text-[#F1EEE7]">
                    {row.competition_name}
                  </td>
                  <td className="p-3.5 font-mono text-[#E6D3A0]">
                    {row.season_code}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={row.completeness_status} compact />
                  </td>
                  <td className="p-3.5 font-mono text-[#F1EEE7]">
                    {row.matches_covered !== null
                      ? `${row.matches_covered} / ${row.matches_expected}`
                      : 'All-Time'}
                  </td>
                  <td className="p-3.5 text-[#AAA69C] max-w-xs">
                    {row.available_fields.join(', ')}
                  </td>
                  <td className="p-3.5 text-[#AAA69C]">
                    <div className="text-[#F1EEE7]">{row.source_name}</div>
                    <div className="font-mono text-[10px] text-[#C9A64B]">
                      {row.license}
                    </div>
                  </td>
                  <td className="p-3.5 text-[#AAA69C] max-w-sm">
                    {row.known_gaps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
