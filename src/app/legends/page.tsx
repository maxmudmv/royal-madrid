import React from 'react';
import { getLegendsData } from '@/lib/queries';
import { LegendsExplorer } from '@/components/LegendsExplorer';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function LegendsPage() {
  const { legends, managers } = await getLegendsData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Page Header */}
      <div className="border-b border-[#3B321F] pb-8 space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B]">
          PANTHEON OF REAL MADRID CF · PLAYERS &amp; GREAT MANAGERS
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#F1EEE7]">
          Club Legends &amp; Managerial Icons
        </h1>
        <p className="text-sm sm:text-base text-[#AAA69C] max-w-3xl leading-relaxed">
          A curated and verifiable gallery of Real Madrid&apos;s greatest first-team men&apos;s footballers and managers across every historical era. All statistics strictly reflect official Real Madrid CF tenure.
        </p>
      </div>

      {/* Interactive Searchable & Filterable Legends Gallery */}
      <LegendsExplorer legends={legends} />

      {/* Great Managers Historical Registry Table */}
      <section className="space-y-6 pt-8 border-t border-[#3B321F]">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#C9A64B] mb-1">
            THE DUGOUT BENCHMARK
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#F1EEE7]">
            Great Managers of Real Madrid CF
          </h2>
        </div>

        <div className="overflow-x-auto border border-[#3B321F] bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#080808] font-mono text-xs uppercase text-[#C9A64B]">
                <th className="p-4">Manager</th>
                <th className="p-4">Tenure</th>
                <th className="p-4 text-right">Matches</th>
                <th className="p-4 text-right">W – D – L</th>
                <th className="p-4 text-right">Win %</th>
                <th className="p-4 text-right">Trophies</th>
                <th className="p-4">Major Honours Won</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/60">
              {managers.map((mgr) => (
                <tr key={mgr.slug} className="hover:bg-[#171717]">
                  <td className="p-4">
                    <div className="font-serif text-base text-[#F1EEE7]">
                      {mgr.full_name}
                    </div>
                    <div className="text-xs text-[#AAA69C]">{mgr.nationality}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-[#E6D3A0]">
                    {mgr.tenure_display}
                  </td>
                  <td className="p-4 text-right font-mono text-[#F1EEE7]">
                    {mgr.matches_managed ?? '—'}
                  </td>
                  <td className="p-4 text-right font-mono text-xs text-[#AAA69C]">
                    {mgr.wins !== null
                      ? `${mgr.wins}W – ${mgr.draws}D – ${mgr.losses}L`
                      : '—'}
                  </td>
                  <td className="p-4 text-right font-mono text-[#E6D3A0]">
                    {mgr.win_percentage ? `${mgr.win_percentage}%` : '—'}
                  </td>
                  <td className="p-4 text-right font-serif text-lg font-bold text-[#C9A64B]">
                    {mgr.trophies_won}
                  </td>
                  <td className="p-4 text-xs text-[#AAA69C] max-w-md">
                    {mgr.major_honours.join(' · ')}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={mgr.verification_status} compact />
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
