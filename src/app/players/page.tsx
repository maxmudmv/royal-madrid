import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPlayersArchive } from '@/lib/queries';
import { PlayerPortrait } from '@/components/PlayerPortrait';
import { PlayersTableClient } from '@/components/PlayersTableClient';
import { ArrowRight, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'First-Team Players Archive',
  description:
    'Verified archive of Real Madrid CF first-team men’s players, strictly separating All-Time Real Madrid Career Totals from 2011/12+ Detailed Archive Totals.',
};

export default async function PlayersPage() {
  const { featuredPlayers, allPlayers } = await getPlayersArchive();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          First-Team Personnel Registry · Real Madrid Career Statistics Only
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          PLAYERS ARCHIVE
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          A comprehensive statistical registry of verified Real Madrid CF first-team men’s players. All statistics reflect appearances, goals, and honours earned exclusively with Real Madrid’s senior men’s team.
        </p>

        {/* Scope Separation Notice */}
        <div className="mt-6 flex items-start gap-3 rounded border border-[#C9A64B]/40 bg-[#111111] p-4 text-xs text-[#AAA69C]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A64B]" />
          <div>
            <p className="font-semibold text-[#E6D3A0]">
              Strict Scope Separation: All-Time Career Totals vs. 2011/12+ Detailed Archive Totals
            </p>
            <p className="mt-1 leading-relaxed">
              For players whose Real Madrid careers began prior to the 2011/12 season (such as Cristiano Ronaldo, Raúl, Iker Casillas, Sergio Ramos, Karim Benzema, and Marcelo), this archive strictly separates their verified <strong className="text-[#F1EEE7]">All-Time Real Madrid Career Totals</strong> from their <strong className="text-[#F1EEE7]">2011/12+ Detailed Archive Totals</strong>. Missing historical metrics are stored as <code className="text-[#C9A64B]">NULL</code> (`N/A`), never zero.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Players Section */}
      <section className="mt-12">
        <div className="flex items-end justify-between border-b border-[#3B321F]/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
              Curated Icons
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
              Featured First-Team Players
            </h2>
          </div>
          <Link
            href="/compare"
            className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B] hover:text-[#E6D3A0]"
          >
            Compare Players Side-by-Side &rarr;
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPlayers.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded border border-[#3B321F] bg-[#111111] p-5 transition duration-200 hover:border-[#C9A64B]"
            >
              <div>
                <div className="flex items-start gap-4">
                  <PlayerPortrait
                    name={p.short_name}
                    portraitUrl={p.portrait_url}
                    subtitle={p.position}
                    className="h-24 w-20 shrink-0 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded border border-[#C9A64B]/40 bg-[#C9A64B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E6D3A0]">
                        {p.position}
                      </span>
                      <span className="font-mono text-[11px] text-[#AAA69C]">
                        {p.tenure_display}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate font-serif text-xl font-bold text-[#F1EEE7] group-hover:text-[#E6D3A0]">
                      {p.short_name}
                    </h3>
                    <p className="text-xs text-[#AAA69C]">{p.nationality}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#3B321F]/60 pt-4 text-center">
                  <div className="rounded bg-[#171717] p-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                      RM Apps
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#F1EEE7]">
                      {p.all_time_rm_apps ?? 'N/A'}
                    </p>
                  </div>
                  <div className="rounded bg-[#171717] p-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                      RM Goals
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#C9A64B]">
                      {p.all_time_rm_goals ?? 'N/A'}
                    </p>
                  </div>
                  <div className="rounded bg-[#171717] p-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#AAA69C]">
                      Trophies
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#E6D3A0]">
                      {p.all_time_rm_trophies ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#3B321F]/40 pt-3">
                <span className="text-[10px] text-[#AAA69C]">
                  2011/12+ Archive:{' '}
                  <strong className="font-mono text-[#F1EEE7]">
                    {p.archive_2011_rm_apps !== null
                      ? `${p.archive_2011_rm_apps} apps / ${p.archive_2011_rm_goals ?? 0} goals`
                      : 'Pre-2011/12 Era'}
                  </strong>
                </span>
                <Link
                  href={`/players/${p.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A64B] group-hover:text-[#E6D3A0]"
                >
                  Full Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full Searchable & Filterable Player Table */}
      <section className="mt-14">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            Complete Verified Roster
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#F1EEE7]">
            Full First-Team Player Table
          </h2>
        </div>

        <PlayersTableClient players={allPlayers} />
      </section>
    </div>
  );
}
