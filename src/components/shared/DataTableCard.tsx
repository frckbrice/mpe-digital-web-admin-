'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import type { PaginationState, OnChangeFn } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

export interface DataTableCardProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  totalCount: number;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  /** Optional accent border for the card */
  accentBorder?: boolean;
  className?: string;
}

/**
 * Card wrapper around DataTable with consistent padding and optional accent border.
 * Keeps table layout and pagination in one reusable block. Not tied to any feature at runtime.
 */
export function DataTableCard<TData>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  totalCount,
  isLoading = false,
  emptyMessage,
  pageSizeOptions,
  accentBorder = false,
  className,
}: DataTableCardProps<TData>) {
  return (
    <Card className={cn(accentBorder && 'border border-[#fe4438]', className)}>
      <CardContent className="p-0">
        <DataTable<TData>
          columns={columns}
          data={data}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          totalCount={totalCount}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          pageSizeOptions={pageSizeOptions}
        />
      </CardContent>
    </Card>
  );
}
