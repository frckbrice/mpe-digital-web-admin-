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
import { FolderKanban, Eye, Search } from 'lucide-react';
import { fetchProjects } from '../api/queries';
import type { ProjectRow } from '../api/types';
import { ProjectDetailSheet } from './ProjectDetailSheet';

function statusVariant(s?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!s) return 'outline';
  if (s.includes('EXECUTION') || s.includes('ACTIVE') || s.includes('IN_PROGRESS'))
    return 'default';
  if (s.includes('PENDING') || s.includes('WAIT') || s.includes('REVIEW')) return 'secondary';
  if (s.includes('REJECT') || s.includes('CANCEL') || s.includes('FAIL')) return 'destructive';
  return 'outline';
}

export function ProjectsPageClient() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [statusInput, setStatusInput] = useState('');
  const [filters, setFilters] = useState<{ status?: string }>({});

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = useMemo(
    () => ['projects', 'list', filters.status || null, page, pageSize] as const,
    [filters, page, pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProjects({ status: filters.status, page, pageSize }),
  });

  const handleSearch = useCallback(() => {
    setFilters({ status: statusInput.trim() || undefined });
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [statusInput]);

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

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: 'id',
        header: t('common.reference') || 'Project',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name || row.original.id}</span>
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
        id: 'progress',
        header: t('common.progress') || 'Progress',
        cell: ({ row }) =>
          row.original.progress != null ? (
            <span>{row.original.progress}%</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'contractId',
        header: t('common.contract') || 'Contract',
        cell: ({ row }) => <span className="text-sm">{row.original.contractId || '—'}</span>,
      },
      {
        id: 'quoteId',
        header: t('common.quote') || 'Quote',
        cell: ({ row }) => <span className="text-sm">{row.original.quoteId || '—'}</span>,
      },
      {
        id: 'updatedAt',
        header: t('common.updatedAt') || 'Updated',
        cell: ({ row }) =>
          row.original.updatedAt ? (
            <span className="text-muted-foreground text-sm">
              {new Date(row.original.updatedAt).toLocaleString()}
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
        title={t('dashboard.projects.title') || 'Projects'}
        subtitle={t('dashboard.projects.subtitle') || 'Browse projects from the MPE Web app.'}
        icon={<FolderKanban className="h-8 w-8 text-[#fe4438]" />}
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <Input
          className="w-full min-w-0 sm:w-[260px]"
          placeholder={t('common.status') || 'Status'}
          value={statusInput}
          onChange={(e) => setStatusInput(e.target.value)}
        />
        <Button variant="secondary" onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          {t('common.search') || 'Search'}
        </Button>
      </FilterCard>

      <DataTableCard<ProjectRow>
        columns={columns}
        data={pageData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.projects.empty') || 'No projects found.'}
        pageSizeOptions={[10, 20, 50, 100]}
        accentBorder
      />

      {selectedId ? (
        <ProjectDetailSheet
          projectId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
