import React from 'react';

interface HandPulseIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function HandPulseIcon({ size = 24, color = 'currentColor', strokeWidth = 1.5 }: HandPulseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1" />
      <path d="M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-4 7c-2.5-1.5-5-2-7.5-2H6a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2h3.5" />
      <path d="M2 14v6" />
      <path d="M5 13v7" />
      <path d="M8 14v6" />
    </svg>
  );
}

