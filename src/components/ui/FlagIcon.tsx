'use client';

import React from 'react';
import type { Locale } from '@/constants';

interface FlagIconProps {
  locale: Locale;
  className?: string;
}

export function FlagIcon({ locale, className = 'w-5 h-5' }: FlagIconProps) {
  if (locale === 'fr') {
    return (
      <svg
        className={className}
        viewBox="0 0 9 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <rect width="3" height="6" fill="#002654" />
        <rect x="3" width="3" height="6" fill="#FFFFFF" />
        <rect x="6" width="3" height="6" fill="#ED2939" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width="120" height="60" fill="#012169" />
      <path d="M0 0L120 60M120 0L0 60" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <path d="M0 0L120 60M120 0L0 60" stroke="#C8102E" strokeWidth="4" strokeLinecap="round" />
      <rect x="0" y="26" width="120" height="8" fill="#FFFFFF" />
      <rect x="56" y="0" width="8" height="60" fill="#FFFFFF" />
      <rect x="0" y="28" width="120" height="4" fill="#C8102E" />
      <rect x="58" y="0" width="4" height="60" fill="#C8102E" />
    </svg>
  );
}
