import React from 'react';

export function RoyalCrest({ className = 'w-48 h-48' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label="Royal Madrid Historical Archive Emblem (Replaceable Non-Official Crest)"
    >
      <svg
        viewBox="0 0 240 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(201,166,75,0.12)]"
      >
        {/* Outer architectural circular frame */}
        <circle
          cx="120"
          cy="158"
          r="96"
          stroke="#C9A64B"
          strokeWidth="2"
          fill="#0E0E0E"
        />
        <circle
          cx="120"
          cy="158"
          r="88"
          stroke="#3B321F"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="120"
          cy="158"
          r="80"
          stroke="#C9A64B"
          strokeWidth="1.2"
          fill="#111111"
        />

        {/* Diagonal sash inspired by historical Castilla heritage */}
        <path
          d="M64 102 L176 214"
          stroke="#C9A64B"
          strokeWidth="12"
          strokeLinecap="butt"
          opacity="0.22"
        />
        <path
          d="M59 107 L171 219"
          stroke="#E6D3A0"
          strokeWidth="1"
          opacity="0.55"
        />
        <path
          d="M69 97 L181 209"
          stroke="#E6D3A0"
          strokeWidth="1"
          opacity="0.55"
        />

        {/* Royal Crown (1920 Historical Motif) */}
        <g transform="translate(68, 16)">
          <path
            d="M14 40 L6 16 L30 28 L52 8 L74 28 L98 16 L90 40 Z"
            stroke="#C9A64B"
            strokeWidth="2"
            fill="#171717"
          />
          <rect
            x="14"
            y="40"
            width="76"
            height="8"
            rx="2"
            stroke="#C9A64B"
            strokeWidth="1.5"
            fill="#111111"
          />
          <circle cx="6" cy="13" r="3" fill="#E6D3A0" />
          <circle cx="30" cy="24" r="2.5" fill="#C9A64B" />
          <circle cx="52" cy="5" r="3.5" fill="#E6D3A0" />
          <circle cx="74" cy="24" r="2.5" fill="#C9A64B" />
          <circle cx="98" cy="13" r="3" fill="#E6D3A0" />
          <path d="M52 0 V5 M49 2.5 H55" stroke="#E6D3A0" strokeWidth="1.4" />
        </g>

        {/* Interlocking RM Monogram */}
        <text
          x="120"
          y="168"
          textAnchor="middle"
          fill="#F1EEE7"
          fontFamily="Georgia, serif"
          fontSize="54"
          fontWeight="bold"
          letterSpacing="3"
        >
          RM
        </text>
        <text
          x="120"
          y="198"
          textAnchor="middle"
          fill="#C9A64B"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          fontWeight="600"
          letterSpacing="5"
        >
          MCMII · ARCHIVE
        </text>

        {/* Bottom 15 European Cups stars arc */}
        <text
          x="120"
          y="224"
          textAnchor="middle"
          fill="#E6D3A0"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="2"
        >
          ★ XV EUROPEAN CROWNS ★
        </text>
      </svg>
    </div>
  );
}
