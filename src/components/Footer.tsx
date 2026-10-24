import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-[#3B321F] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#3B321F]/60">
          {/* Identity & Independence Disclaimer */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 border border-[#C9A64B] bg-[#111111] flex items-center justify-center text-[10px] font-serif font-bold text-[#C9A64B]">
                RM
              </div>
              <span className="font-serif text-base font-bold tracking-[0.2em] text-[#F1EEE7]">
                ROYAL MADRID
              </span>
            </div>
            <p className="text-xs text-[#AAA69C] leading-relaxed max-w-xl">
              An independent historical and statistical archive dedicated exclusively to Real Madrid CF&apos;s first-team men&apos;s football team (1902–present, with detailed match-by-match archives beginning in the 2011/12 season).
            </p>
            <p className="text-[11px] text-[#AAA69C]/80 border-l-2 border-[#C9A64B] pl-3 py-0.5">
              <strong>Independent Project Disclaimer:</strong> ROYAL MADRID is an independent historical and statistical reference project and is not affiliated with, endorsed by, or the official website of Real Madrid Club de Fútbol.
            </p>
          </div>

          {/* Archive Sections */}
          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#C9A64B]">
              Historical Archive
            </h3>
            <ul className="grid grid-cols-2 gap-1.5 text-xs text-[#AAA69C]">
              <li><Link href="/history" className="hover:text-[#E6D3A0]">History</Link></li>
              <li><Link href="/honours" className="hover:text-[#E6D3A0]">Honours</Link></li>
              <li><Link href="/legends" className="hover:text-[#E6D3A0]">Legends</Link></li>
              <li><Link href="/matches" className="hover:text-[#E6D3A0]">Matches</Link></li>
              <li><Link href="/players" className="hover:text-[#E6D3A0]">Players</Link></li>
              <li><Link href="/seasons" className="hover:text-[#E6D3A0]">Seasons</Link></li>
              <li><Link href="/records" className="hover:text-[#E6D3A0]">Records</Link></li>
              <li><Link href="/compare" className="hover:text-[#E6D3A0]">Compare</Link></li>
              <li><Link href="/transfers" className="hover:text-[#E6D3A0]">Transfers</Link></li>
              <li><Link href="/search" className="hover:text-[#E6D3A0]">Global Search</Link></li>
            </ul>
          </div>

          {/* Provenance & Governance */}
          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#C9A64B]">
              Data Provenance
            </h3>
            <ul className="space-y-2 text-xs text-[#AAA69C]">
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#C9A64B] shrink-0" />
                <span>PostgreSQL Normalized Schema</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A64B] shrink-0" />
                <span>OpenFootball CC0-1.0 &amp; Verified Records</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#AAA69C] hover:text-[#C9A64B] border border-[#3B321F] px-2.5 py-1 bg-[#111111]"
                >
                  <Lock className="w-3 h-3 text-[#C9A64B]" />
                  Admin Panel (Protected)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#AAA69C]">
          <span>
            SCOPE: ALL-TIME HONOURS (1902+) · DETAILED MATCH ARCHIVE (2011/12+) · COMPLETED OFFICIAL MATCHES ONLY
          </span>
          <span>MISSING VALUES PRESERVED AS NULL (NEVER ZERO)</span>
        </div>
      </div>
    </footer>
  );
}
