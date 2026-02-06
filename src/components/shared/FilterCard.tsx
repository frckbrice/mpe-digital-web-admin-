'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FilterCardProps {
  /** Title for the filter section (e.g. t('common.filters')) */
  title: React.ReactNode;
  /** Filter controls (Selects, SearchWithButton, etc.) */
  children: React.ReactNode;
  /** When true, applies accent border (e.g. brand red) */
  accentBorder?: boolean;
  /** Optional class for the Card */
  className?: string;
}

/**
 * Card wrapper for filter controls. Keeps consistent layout and mobile-friendly flex-wrap.
 * Not tied to any feature at runtime.
 */
export function FilterCard({ title, children, accentBorder = false, className }: FilterCardProps) {
  return (
    <Card className={cn(accentBorder && 'border border-[#fe4438]', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">{children}</div>
      </CardHeader>
    </Card>
  );
}
