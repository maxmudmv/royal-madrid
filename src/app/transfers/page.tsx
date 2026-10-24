import React from 'react';
import type { Metadata } from 'next';
import { getTransfersArchive } from '@/lib/queries';
import { TransfersClient } from '@/components/TransfersClient';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transfers Archive (Historical & Modern Movements)',
  description:
    'Verified archive of incoming and outgoing first-team transfers involving Real Madrid CF. Unknown fees are preserved as NULL (Undisclosed / Unknown) rather than zero.',
};

export default async function TransfersPage() {
  const transfers = await getTransfersArchive();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#3B321F]/60 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A64B]">
          First-Team Personnel Movements · Historical &amp; Modern Ledger
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#F1EEE7] sm:text-5xl">
          TRANSFERS ARCHIVE
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#AAA69C]">
          Verified incoming (`IN`) and outgoing (`OUT`) first-team player movements involving Real Madrid CF across both historical eras and the modern 2011/12+ archive.
        </p>

        {/* Fee Integrity Notice */}
        <div className="mt-6 flex items-start gap-3 rounded border border-[#C9A64B]/40 bg-[#111111] p-4 text-xs text-[#AAA69C]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A64B]" />
          <div>
            <p className="font-semibold text-[#E6D3A0]">
              Transfer Fee Accounting Policy (`NULL` vs. Zero)
            </p>
            <p className="mt-1 leading-relaxed">
              In accordance with strict archive rules, whenever an official transfer fee was undisclosed, confidential, or not reliably verified by public disclosures, the database column <code className="text-[#C9A64B]">fee_eur</code> is stored as <code className="text-[#C9A64B]">NULL</code> and displayed as <strong className="text-[#F1EEE7]">Undisclosed / Unknown</strong> — never as <code className="text-[#F1EEE7]">0</code>. Free Bosman signings upon contract expiration are explicitly distinguished by transfer type.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <TransfersClient transfers={transfers} />
      </div>
    </div>
  );
}
