'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchWithButtonProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  /** Accessibility label for the search button */
  ariaLabel?: string;
  /** Optional class for the wrapper (flex container) */
  className?: string;
  /** Optional class for the input (responsive widths: w-full min-w-0 sm:w-56 or sm:w-64) */
  inputClassName?: string;
}

/**
 * Controlled search input with a search button. Triggers on button click and on Enter key.
 * Responsive: full width on mobile, constrained on sm+.
 * Not tied to any feature at runtime.
 */
export function SearchWithButton({
  placeholder,
  value,
  onChange,
  onSearch,
  ariaLabel = 'Search',
  className,
  inputClassName,
}: SearchWithButtonProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className={cn('flex gap-2 flex-1 min-w-0', className)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn('w-full min-w-0 sm:w-56', inputClassName)}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={onSearch}
        aria-label={ariaLabel}
        className="flex-shrink-0"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
