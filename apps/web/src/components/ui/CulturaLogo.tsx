"use client";

import React from "react";

interface CulturaLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function CulturaLogo({
  size = 36,
  showText = true,
  className = "",
}: CulturaLogoProps) {
  const uid = React.useId().replace(/:/g, "");

  return (
    <div className={`flex items-center gap-1 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={`${uid}-ring`} x1="24" y1="7" x2="40" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="55%" stopColor="#4F7BF7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Single-stroke "C" — opening centered on 3 o'clock, facing the text.
            One continuous gradient (purple at top → cyan at bottom-right) instead
            of separate segments, so it reads as a clean ring at small sizes. */}
        <path
          d="M 37.02 34.93 A 17 17 0 1 1 37.02 13.07"
          stroke={`url(#${uid}-ring)`}
          strokeWidth="7.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-bold text-[17px] tracking-tight text-white group-hover:text-indigo-200 transition-colors">
            Cultura
          </span>
          <span className="text-[10px] text-slate-400/80 font-normal mt-0.5 tracking-normal">
            Powered by Qloo
          </span>
        </div>
      )}
    </div>
  );
}
