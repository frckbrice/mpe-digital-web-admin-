'use client';

import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Table as TanStackTable,
  type OnChangeFn,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export type { ColumnDef };

export interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageChange: OnChangeFn<PaginationState>;
  pageSizeOptions?: number[];
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalCount,
  canPreviousPage,
  canNextPage,
  onPageChange,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps) {
  const { t } = useTranslation();
  const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 sm:flex-row items-center justify-between border-t border-border px-4 py-3">
      <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
        <span>
          {start}–{end} of {totalCount}
        </span>
        <div className="flex items-center gap-2">
          <span>{t('common.rowsPerPage')}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageChange((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t('common.pageOf', { current: pageCount ? pageIndex + 1 : 0, total: pageCount || 1 })}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
          disabled={!canPreviousPage}
          aria-label={t('common.previousPage')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
          disabled={!canNextPage}
          aria-label={t('common.nextPage')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** For server-side pagination: total number of pages. Omit or -1 for client-side. */
  pageCount?: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  totalCount: number;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSizeOptions?: number[];
}

export function DataTable<TData>({
  columns,
  data,
  pageCount = -1,
  pagination,
  onPaginationChange,
  totalCount,
  isLoading = false,
  emptyMessage,
  pageSizeOptions,
}: DataTableProps<TData>) {
  const { t } = useTranslation();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: pageCount >= 0,
    pageCount: pageCount >= 0 ? pageCount : undefined,
    state: { pagination },
    onPaginationChange: onPaginationChange as OnChangeFn<PaginationState>,
  });

  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pageCount < 0 ? pagination.pageIndex < table.getPageCount() - 1 : pagination.pageIndex < pageCount - 1;

  return (
    <div className="space-y-0">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage ?? t('common.noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {totalCount > 0 && (
        <DataTablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount >= 0 ? pageCount : table.getPageCount()}
          totalCount={totalCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPageChange={onPaginationChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
