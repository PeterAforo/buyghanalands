"use client";

import * as React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
    >
      {/* Ghana map outline */}
      <path
        d="M16 2 C14 2 12 3 11 4 C10 5 9 6 8 8 C7 10 6 12 6 14 C5 16 5 18 6 20 C7 22 8 24 10 26 C12 28 14 29 16 30 C18 29 20 28 22 26 C24 24 25 22 26 20 C27 18 27 16 26 14 C26 12 25 10 24 8 C23 6 22 5 21 4 C20 3 18 2 16 2 Z"
        fill="#006B3F"
        stroke="#004d2c"
        strokeWidth="0.5"
      />

      {/* Ghana flag stripes overlay */}
      <defs>
        <clipPath id="ghanaClipLogo">
          <path d="M16 2 C14 2 12 3 11 4 C10 5 9 6 8 8 C7 10 6 12 6 14 C5 16 5 18 6 20 C7 22 8 24 10 26 C12 28 14 29 16 30 C18 29 20 28 22 26 C24 24 25 22 26 20 C27 18 27 16 26 14 C26 12 25 10 24 8 C23 6 22 5 21 4 C20 3 18 2 16 2 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#ghanaClipLogo)">
        <rect x="4" y="2" width="24" height="9" fill="#CE1126" />
        <rect x="4" y="11" width="24" height="9" fill="#FCD116" />
        <rect x="4" y="20" width="24" height="10" fill="#006B3F" />
      </g>

      {/* Location marker pin */}
      <g transform="translate(16, 14)">
        <path
          d="M0 -8 C-4 -8 -6 -5 -6 -2 C-6 2 0 8 0 8 C0 8 6 2 6 -2 C6 -5 4 -8 0 -8 Z"
          fill="#CE1126"
          stroke="#fff"
          strokeWidth="1"
        />
        <circle cx="0" cy="-2" r="2" fill="#fff" />
      </g>
    </svg>
  );
}
