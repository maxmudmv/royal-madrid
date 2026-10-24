'use client';

import React, { useState } from 'react';

interface PlayerPortraitProps {
  name: string;
  portraitUrl?: string | null;
  roleOrPosition?: string | null;
  subtitle?: string | null;
  attribution?: string | null;
  tenure?: string | null;
  shirtNumber?: number | null;
  className?: string;
}

export function PlayerPortrait({
  name,
  portraitUrl,
  roleOrPosition,
  subtitle,
  tenure,
  shirtNumber,
  className = 'w-full h-56',
}: PlayerPortraitProps) {
  const displayRole = roleOrPosition || subtitle;
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const showImage = Boolean(portraitUrl) && !imgError;

  return (
    <div
      className={`relative overflow-hidden bg-[#111111] border border-[#3B321F] flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Subtle architectural background grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(201,166,75,0.22), transparent 70%)',
        }}
      />

      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portraitUrl!}
          alt={`${name} — Real Madrid CF Historical Portrait`}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top grayscale contrast-110 hover:grayscale-0 transition-all duration-300"
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-full border border-[#C9A64B]/60 bg-[#080808] flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(201,166,75,0.1)]">
            <span className="font-serif text-xl font-bold tracking-widest text-[#C9A64B]">
              {initials}
            </span>
          </div>
          {displayRole && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#AAA69C]">
              {displayRole}
            </span>
          )}
          {tenure && (
            <span className="text-[10px] font-mono text-[#E6D3A0]/70 mt-0.5">
              {tenure}
            </span>
          )}
        </div>
      )}

      {shirtNumber !== undefined && shirtNumber !== null && (
        <span className="absolute top-2.5 right-2.5 bg-[#080808]/90 border border-[#3B321F] px-2 py-0.5 text-[11px] font-mono text-[#C9A64B]">
          #{shirtNumber}
        </span>
      )}
    </div>
  );
}
