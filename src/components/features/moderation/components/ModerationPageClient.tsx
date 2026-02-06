'use client';

import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { PageHeader, FilterCard, DataTableCard } from '@/components/shared';
import { toast } from 'sonner';
import { ShieldCheck, Eye } from 'lucide-react';
import { fetchModerationRequests } from '../api/queries';
import { decideModerationRequest } from '../api/mutations';
import type { ModerationRequest, ModerationRequestStatus } from '../api/types';
import { ModerationDecisionDialog } from './ModerationDecisionDialog';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'PENDING') return 'secondary';
  if (s === 'APPROVED') return 'default';
  if (s === 'REJECTED') return 'destructive';
  return 'outline';
}

const STATUSES: ModerationRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function getModerationStatusTranslationKey(status: ModerationRequestStatus): string {
  const map: Record<ModerationRequestStatus, string> = {
    PENDING: 'dashboard.moderation.statusPending',
    APPROVED: 'dashboard.moderation.statusApproved',
    REJECTED: 'dashboard.moderation.statusRejected',
  };
  return map[status];
}

export function ModerationPageClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ModerationRequestStatus | ''>('PENDING');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selected, setSelected] = useState<ModerationRequest | null>(null);

  const queryKey = useMemo(
    () =>
      [
        'moderation',
        'requests',
        status || 'ALL',
        pagination.pageIndex,
        pagination.pageSize,
      ] as const,
    [status, pagination.pageIndex, pagination.pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchModerationRequests({
        status: status || undefined,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
  });

  const decideMu = useMutation({
    mutationFn: ({
      requestId,
      approved,
      comment,
    }: {
      requestId: string;
      approved: boolean;
      comment?: string;
    }) => decideModerationRequest(requestId, { approved, comment }),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.approved
          ? t('dashboard.moderation.approved') || 'Approved'
          : t('dashboard.moderation.rejected') || 'Rejected'
      );
      setSelected(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-decisions'] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error && e.message ? e.message : t('error.unexpectedError'));
    },
  });

  const pageData = data?.data ?? [];
  const totalCount = data?.pagination?.totalCount ?? pageData.length;
  const pageCount =
    data?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const columns = useMemo<ColumnDef<ModerationRequest>[]>(
    () => [
      {
        id: 'actionType',
        header: t('common.action'),
        accessorKey: 'actionType',
        cell: ({ row }) => <span className="font-medium">{row.original.actionType}</span>,
      },
      {
        id: 'status',
        header: t('common.status'),
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(getModerationStatusTranslationKey(row.original.status))}
          </Badge>
        ),
      },
      {
        id: 'entity',
        header: t('common.entity'),
        cell: ({ row }) => {
          const r = row.original;
          if (r.invoice?.invoiceNumber)
            return (
              <span>
                {t('common.invoice')} {r.invoice.invoiceNumber}
              </span>
            );
          if (r.quote?.referenceNumber)
            return (
              <span>
                {t('common.quote')} {r.quote.referenceNumber}
              </span>
            );
          if (r.contract?.contractNumber)
            return (
              <span>
                {t('common.contract')} {r.contract.contractNumber}
              </span>
            );
          if (r.invoice?.id)
            return (
              <span>
                {t('common.invoice')} {r.invoice.id}
              </span>
            );
          if (r.quote?.id)
            return (
              <span>
                {t('common.quote')} {r.quote.id}
              </span>
            );
          if (r.contract?.id)
            return (
              <span>
                {t('common.contract')} {r.contract.id}
              </span>
            );
          return <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: 'requestedBy',
        header: t('common.requestedBy') || 'Requested by',
        cell: ({ row }) => {
          const u = row.original.requestedBy;
          if (!u) return <span className="text-muted-foreground">—</span>;
          const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
          return (
            <div>
              <div className="text-sm">{name || u.email || u.id}</div>
              {u.email ? <div className="text-xs text-muted-foreground">{u.email}</div> : null}
            </div>
          );
        },
      },
      {
        id: 'requestedAt',
        header: t('common.requestedAt') || 'Requested at',
        accessorKey: 'requestedAt',
        cell: ({ row }) =>
          row.original.requestedAt ? (
            <span className="text-muted-foreground text-sm">
              {new Date(row.original.requestedAt).toLocaleString()}
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
            onClick={() => setSelected(row.original)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('common.review') || 'Review'}
          </Button>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.moderation.title') || 'Moderation'}
        subtitle={
          t('dashboard.moderation.subtitle') || 'Review and decide pending moderation requests.'
        }
        icon={<ShieldCheck className="h-8 w-8 text-[#fe4438]" />}
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : (v as ModerationRequestStatus));
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full min-w-0 sm:w-[220px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(getModerationStatusTranslationKey(s))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCard>

      <DataTableCard<ModerationRequest>
        columns={columns}
        data={pageData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.moderation.empty') || 'No moderation requests found.'}
        pageSizeOptions={[10, 20, 50, 100]}
        accentBorder
      />

      {selected ? (
        <ModerationDecisionDialog
          request={selected}
          onClose={() => setSelected(null)}
          isPending={decideMu.isPending}
          onDecide={(approved, comment) =>
            decideMu.mutate({ requestId: selected.id, approved, comment })
          }
        />
      ) : null}
    </div>
  );
}
