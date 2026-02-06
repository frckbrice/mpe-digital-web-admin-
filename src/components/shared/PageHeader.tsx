'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional subtitle (string or React node for links/custom content) */
  subtitle?: React.ReactNode;
  /** Optional icon element (e.g. Lucide icon) */
  icon?: React.ReactNode;
  /** Optional primary action (e.g. "Add" button). Renders on the right; stacks below title on small screens. */
  action?: React.ReactNode;
  /** Optional extra class for the container */
  className?: string;
}

/**
 * Reusable page header: title, optional subtitle, optional icon, optional action.
 * Layout: on small screens title/action stack; on sm+ they sit in a row with space-between.
 * Not tied to any feature at runtime.
 */
export function PageHeader({ title, subtitle, icon, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div>
        <h1 className={cn('text-2xl font-bold sm:text-3xl', icon && 'flex items-center gap-2')}>
          {icon}
          {title}
        </h1>
        {subtitle != null && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {action != null && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
