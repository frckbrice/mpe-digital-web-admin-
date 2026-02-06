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
import { ListChecks, Search } from 'lucide-react';
import { fetchModerationDecisions } from '../api/queries';
import type { ModerationDecisionRow } from '../api/types';

function decisionVariant(s: string): 'default' | 'destructive' | 'outline' {
  if (s === 'APPROVED') return 'default';
  if (s === 'REJECTED') return 'destructive';
  return 'outline';
}

function getDecisionTranslationKey(decision: string): string | null {
  if (decision === 'APPROVED') return 'dashboard.moderation.approved';
  if (decision === 'REJECTED') return 'dashboard.moderation.rejected';
  return null;
}

export function AuditPageClient() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });

  const [entityTypeInput, setEntityTypeInput] = useState('');
  const [entityIdInput, setEntityIdInput] = useState('');
  const [actionTypeInput, setActionTypeInput] = useState('');
  const [moderatorIdInput, setModeratorIdInput] = useState('');

  const [filters, setFilters] = useState<{
    entityType?: string;
    entityId?: string;
    actionType?: string;
    moderatorId?: string;
  }>({});

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = useMemo(
    () =>
      [
        'admin',
        'moderation-decisions',
        filters.entityType || null,
        filters.entityId || null,
        filters.actionType || null,
        filters.moderatorId || null,
        page,
        pageSize,
      ] as const,
    [filters, page, pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchModerationDecisions({
        entityType: filters.entityType,
        entityId: filters.entityId,
        actionType: filters.actionType,
        moderatorId: filters.moderatorId,
        page,
        pageSize,
      }),
  });

  const handleSearch = useCallback(() => {
    setFilters({
      entityType: entityTypeInput.trim() || undefined,
      entityId: entityIdInput.trim() || undefined,
      actionType: actionTypeInput.trim() || undefined,
      moderatorId: moderatorIdInput.trim() || undefined,
    });
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [actionTypeInput, entityIdInput, entityTypeInput, moderatorIdInput]);

  const rows = data?.data ?? [];
  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<ModerationDecisionRow>[]>(
    () => [
      {
        id: 'createdAt',
        header: t('common.date') || 'Date',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: 'actionType',
        header: t('common.action') || 'Action',
        accessorKey: 'actionType',
        cell: ({ row }) => <span className="font-medium">{row.original.actionType}</span>,
      },
      {
        id: 'decision',
        header: t('common.decision') || 'Decision',
        accessorKey: 'decision',
        cell: ({ row }) => {
          const key = getDecisionTranslationKey(row.original.decision);
          return (
            <Badge variant={decisionVariant(row.original.decision)}>
              {key ? t(key) : row.original.decision}
            </Badge>
          );
        },
      },
      {
        id: 'entity',
        header: t('common.entity') || 'Entity',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.entityType} • {row.original.entityId}
          </span>
        ),
      },
      {
        id: 'moderator',
        header: t('common.moderator') || 'Moderator',
        cell: ({ row }) => {
          const m = row.original.moderator;
          const name = m ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() : '';
          return (
            <div>
              <div className="text-sm">{name || m?.email || row.original.moderatorId}</div>
              {m?.email ? <div className="text-xs text-muted-foreground">{m.email}</div> : null}
            </div>
          );
        },
      },
      {
        id: 'comment',
        header: t('common.comment') || 'Comment',
        accessorKey: 'comment',
        cell: ({ row }) => <span className="text-sm">{row.original.comment || '—'}</span>,
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.audit.title') || 'Audit'}
        subtitle={t('dashboard.audit.subtitle') || 'Moderation decisions audit log.'}
        icon={<ListChecks className="h-8 w-8 text-[#fe4438]" />}
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <Input
          className="w-full min-w-0 sm:w-[180px]"
          placeholder={t('common.entityType') || 'Entity type'}
          value={entityTypeInput}
          onChange={(e) => setEntityTypeInput(e.target.value)}
        />
        <Input
          className="w-full min-w-0 sm:w-[240px]"
          placeholder={t('common.entityId') || 'Entity id'}
          value={entityIdInput}
          onChange={(e) => setEntityIdInput(e.target.value)}
        />
        <Input
          className="w-full min-w-0 sm:w-[240px]"
          placeholder={t('common.actionType') || 'Action type'}
          value={actionTypeInput}
          onChange={(e) => setActionTypeInput(e.target.value)}
        />
        <Input
          className="w-full min-w-0 sm:w-[240px]"
          placeholder={t('common.moderatorId') || 'Moderator id'}
          value={moderatorIdInput}
          onChange={(e) => setModeratorIdInput(e.target.value)}
        />
        <Button variant="secondary" onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          {t('common.search') || 'Search'}
        </Button>
      </FilterCard>

      <DataTableCard<ModerationDecisionRow>
        columns={columns}
        data={rows}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.audit.empty') || 'No audit entries found.'}
        pageSizeOptions={[20, 50, 100, 200]}
        accentBorder
      />
    </div>
  );
}
