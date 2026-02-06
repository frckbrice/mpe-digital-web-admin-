'use client';

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PageHeader, FilterCard, SearchWithButton, DataTableCard } from '@/components/shared';
import { fetchClients } from '../api/queries';
import type { ClientRow } from '../api/types';

/**
 * Clients page – read-only per admin-tasks.
 * GET /api/agent/clients with search & pagination.
 */
export function ClientsPageClient() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = ['agent', 'clients', search || null, page, pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchClients({ search: search || undefined, page, pageSize }),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const clients = data?.data ?? [];
  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (r) => `${r.firstName} ${r.lastName}`,
        header: t('common.name'),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      { id: 'email', accessorKey: 'email', header: t('common.email') },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        header: t('common.status'),
        cell: ({ row }) => {
          const v = row.original.isActive;
          if (v === undefined) return <span className="text-muted-foreground">—</span>;
          return (
            <Badge variant={v ? 'default' : 'destructive'}>
              {v ? t('common.active') : t('common.inactive')}
            </Badge>
          );
        },
      },
      {
        id: 'counts',
        accessorFn: (r) => r._count?.quoteRequests,
        header: t('dashboard.clients.quoteRequests'),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original._count?.quoteRequests ?? '—'}
          </span>
        ),
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: t('dashboard.clients.created'),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.clients.title')}
        subtitle={t('dashboard.clients.subtitleReadOnly')}
      />

      <FilterCard title={t('common.filters')}>
        <SearchWithButton
          placeholder={t('dashboard.clients.searchPlaceholder')}
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          ariaLabel={t('common.search')}
          inputClassName="sm:w-64"
        />
      </FilterCard>

      <DataTableCard<ClientRow>
        columns={columns}
        data={clients}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.clients.noClientsFound')}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
