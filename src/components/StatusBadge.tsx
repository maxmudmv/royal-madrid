import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export function StatusBadge({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const normalized = status || 'Verified';

  if (normalized === 'Verified') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 border border-[#C9A64B]/40 bg-[#C9A64B]/10 text-[#E6D3A0] font-mono uppercase tracking-wider ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        title="Data verified against official or public-domain primary historical sources"
      >
        <CheckCircle2 className="w-3 h-3 text-[#C9A64B] shrink-0" />
        Verified
      </span>
    );
  }

  if (normalized === 'Partial') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 border border-[#3B321F] bg-[#171717] text-[#AAA69C] font-mono uppercase tracking-wider ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        title="Core records verified; some secondary fields (such as lineups or historical assists) are partially documented"
      >
        <AlertCircle className="w-3 h-3 text-[#C9A64B] shrink-0" />
        Partial Coverage
      </span>
    );
  }

  if (normalized === 'Unavailable') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 border border-[#3B321F] bg-[#111111] text-[#AAA69C]/80 font-mono uppercase tracking-wider ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        title="Field is unavailable in free historical sources and preserved as NULL (never zero)"
      >
        <HelpCircle className="w-3 h-3 text-[#AAA69C] shrink-0" />
        Unavailable
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-amber-900/50 bg-amber-950/20 text-amber-300 font-mono uppercase tracking-wider ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <ShieldAlert className="w-3 h-3 shrink-0" />
      {normalized}
    </span>
  );
}
