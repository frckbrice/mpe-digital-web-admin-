'use client';

import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PageHeader, FilterCard, DataTableCard } from '@/components/shared';
import { FileSignature, Eye, Search } from 'lucide-react';
import { fetchContracts } from '../api/queries';
import type { ContractRow } from '../api/types';
import { ContractDetailSheet } from './ContractDetailSheet';

function statusVariant(s?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!s) return 'outline';
  if (s.includes('PENDING') || s.includes('NEGOTIATION') || s.includes('REQUEST'))
    return 'secondary';
  if (s.includes('SIGNED') || s.includes('ACTIVE')) return 'default';
  if (s.includes('REJECT') || s.includes('CANCEL')) return 'destructive';
  return 'outline';
}

export function ContractsPageClient() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [statusInput, setStatusInput] = useState('');
  const [quoteIdInput, setQuoteIdInput] = useState('');
  const [filters, setFilters] = useState<{ status?: string; quoteId?: string }>({});

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = useMemo(
    () =>
      [
        'contracts',
        'list',
        filters.status || null,
        filters.quoteId || null,
        page,
        pageSize,
      ] as const,
    [filters, page, pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchContracts({ status: filters.status, quoteId: filters.quoteId, page, pageSize }),
  });

  const handleSearch = useCallback(() => {
    setFilters({
      status: statusInput.trim() || undefined,
      quoteId: quoteIdInput.trim() || undefined,
    });
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [quoteIdInput, statusInput]);

  const hasServerPagination = !!data?.pagination;
  const all = data?.data ?? [];
  const pag = data?.pagination;

  const totalCount = hasServerPagination ? (pag?.totalCount ?? 0) : all.length;
  const pageCount = hasServerPagination
    ? (pag?.totalPages ?? 0)
    : Math.max(1, Math.ceil((all.length || 0) / pagination.pageSize));
  const pageData = hasServerPagination
    ? all
    : all.slice(
        pagination.pageIndex * pagination.pageSize,
        pagination.pageIndex * pagination.pageSize + pagination.pageSize
      );

  const columns = useMemo<ColumnDef<ContractRow>[]>(
    () => [
      {
        id: 'contractNumber',
        header: t('common.reference') || 'Contract',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.contractNumber || row.original.id}</span>
        ),
      },
      {
        id: 'status',
        header: t('common.status'),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>{row.original.status || '—'}</Badge>
        ),
      },
      {
        id: 'quoteId',
        header: t('common.quote') || 'Quote',
        cell: ({ row }) => <span className="text-sm">{row.original.quoteId || '—'}</span>,
      },
      {
        id: 'createdAt',
        header: t('common.createdAt') || 'Created',
        cell: ({ row }) =>
          row.original.createdAt ? (
            <span className="text-muted-foreground text-sm">
              {new Date(row.original.createdAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setSelectedId(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            {t('common.viewDetails') || 'Details'}
          </Button>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.contracts.title') || 'Contracts'}
        subtitle={
          t('dashboard.contracts.subtitle') || 'Browse contracts (scopes) from the MPE Web app.'
        }
        icon={<FileSignature className="h-8 w-8 text-[#fe4438]" />}
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <Input
          className="w-full min-w-0 sm:w-[220px]"
          placeholder={t('common.status') || 'Status'}
          value={statusInput}
          onChange={(e) => setStatusInput(e.target.value)}
        />
        <Input
          className="w-full min-w-0 sm:w-[320px]"
          placeholder={t('common.quoteId') || 'Quote id'}
          value={quoteIdInput}
          onChange={(e) => setQuoteIdInput(e.target.value)}
        />
        <Button variant="secondary" onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          {t('common.search') || 'Search'}
        </Button>
      </FilterCard>

      <DataTableCard<ContractRow>
        columns={columns}
        data={pageData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.contracts.empty') || 'No contracts found.'}
        pageSizeOptions={[10, 20, 50, 100]}
        accentBorder
      />

      {selectedId ? (
        <ContractDetailSheet
          contractId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
