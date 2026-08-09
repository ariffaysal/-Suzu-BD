'use client';

import { useId } from 'react';

const SERIF = "Georgia, 'Times New Roman', serif";

type LogoProps = {
  /** compact: monogram + inline wordmark. full: adds the diamond rule (hero lockup). */
  variant?: 'compact' | 'full';
  /** Enable entrance, float and shimmer animations. Defaults to true. */
  animated?: boolean;
  className?: string;
  monogramClassName?: string;
  wordmarkClassName?: string;
  ruleClassName?: string;
};

export default function Logo({
  variant = 'compact',
  animated = true,
  className = '',
  monogramClassName = '',
  wordmarkClassName = '',
  ruleClassName = '',
}: LogoProps) {
  const uid = useId();
  const bronzeId = `logo-bronze-${uid}`;
  const shineId = `logo-shine-${uid}`;
  const maskId = `logo-mask-${uid}`;

  return (
    <div
      className={`${variant === 'compact' ? 'flex items-center gap-2.5' : 'flex flex-col items-center gap-1.5'} ${
        animated ? 'logo-anim' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label="Suzu BD logo"
        className={`${variant === 'full' ? 'logo-anim-float' : ''} ${monogramClassName}`}
      >
        <defs>
          <linearGradient id={bronzeId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="200">
            <stop offset="0" stopColor="#c9a45c" />
            <stop offset="0.45" stopColor="#a87f3f" />
            <stop offset="1" stopColor="#5f4520" />
          </linearGradient>
          <linearGradient id={shineId} gradientUnits="userSpaceOnUse" x1="-80" y1="0" x2="280" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.58" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id={maskId}>
            <g fill="#ffffff" fontFamily={SERIF} transform="translate(-11 -5)">
              <text x="82" y="175" textAnchor="middle" fontSize="168">
                Z
              </text>
              <text x="138" y="170" textAnchor="middle" fontSize="192">
                S
              </text>
            </g>
          </mask>
        </defs>

        <g transform="translate(-11 -5)">
          {/* Z — behind, slightly smaller */}
          <text
            x="82"
            y="175"
            textAnchor="middle"
            fontSize="168"
            fontFamily={SERIF}
            fill={`url(#${bronzeId})`}
            style={{ filter: 'drop-shadow(0 3px 4px rgba(42, 29, 14, 0.35))' }}
            className="logo-letter logo-letter-z"
          >
            Z
          </text>
          {/* S — in front, larger, casting shadow over the Z */}
          <text
            x="138"
            y="170"
            textAnchor="middle"
            fontSize="192"
            fontFamily={SERIF}
            fill={`url(#${bronzeId})`}
            style={{ filter: 'drop-shadow(0 3px 4px rgba(42, 29, 14, 0.35))' }}
            className="logo-letter logo-letter-s"
          >
            S
          </text>
        </g>

        {/* Shimmer sweep masked to the letterforms */}
        <rect
          x="-80"
          y="0"
          width="360"
          height="200"
          fill={`url(#${shineId})`}
          mask={`url(#${maskId})`}
          className="logo-shine"
        />
      </svg>

      <span
        className={`bg-gradient-to-br from-[#8a6534] via-[#c9a45c] to-[#5f4520] bg-clip-text font-serif text-transparent ${wordmarkClassName}`}
      >
        Suzu BD
      </span>

      {variant === 'full' && (
        <div className={`flex w-full max-w-[240px] items-center gap-2.5 text-[#a87f3f] ${ruleClassName}`}>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#a87f3f]/70 to-[#a87f3f]" />
          <span className="h-[7px] w-[7px] rotate-45 bg-[#a87f3f]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#a87f3f]/70 to-[#a87f3f]" />
        </div>
      )}
    </div>
  );
}
