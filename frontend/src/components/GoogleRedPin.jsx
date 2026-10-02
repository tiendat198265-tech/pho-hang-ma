import React from 'react';

/**
 * GoogleRedPin Component
 * Classic iconic Google Maps Red Pin marker (as requested in user's reference)
 * Pure vector SVG: 100% transparent background, crisp at all resolutions.
 */
export default function GoogleRedPin({ className = 'w-4 h-[20px]', alt = 'Vị trí của tôi' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="140 40 520 730"
      fill="none"
      aria-label={alt}
      className={`inline-block shrink-0 select-none overflow-visible ${className}`}
    >
      {/* Outer Teardrop Body (Classic Google Maps Red) */}
      <path
        d="M400 760 L190 436 A 250 250 0 1 1 610 436 Z"
        fill="#EA4335"
      />
      {/* Inner Dark Red Concentric Ring */}
      <circle cx="400" cy="300" r="145" fill="#B31412" />
      {/* Center White Cutout Circle */}
      <circle cx="400" cy="300" r="86" fill="#FFFFFF" />
    </svg>
  );
}
