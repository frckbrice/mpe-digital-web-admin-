'use client';

import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { CreditCard, Eye } from 'lucide-react';
import { fetchPayments } from '../api/queries';
import type { PaymentRow, PaymentStatus } from '../api/types';
import { PaymentDecisionDialog } from './PaymentDecisionDialog';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'PENDING') return 'secondary';
  if (s === 'VALIDATED') return 'default';
  if (s === 'REJECTED') return 'destructive';
  return 'outline';
}

const STATUSES: PaymentStatus[] = ['PENDING', 'VALIDATED', 'REJECTED'];

function getPaymentStatusTranslationKey(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'dashboard.payments.statusPending',
    VALIDATED: 'dashboard.payments.statusValidated',
    REJECTED: 'dashboard.payments.statusRejected',
  };
  return map[status];
}

export function PaymentsPageClient() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PaymentStatus | ''>('PENDING');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [selected, setSelected] = useState<PaymentRow | null>(null);

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = useMemo(
    () => ['payments', 'list', status || 'ALL', page, pageSize] as const,
    [status, page, pageSize]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPayments({ status: status || undefined, page, pageSize }),
  });

  const hasServerPagination = !!data?.pagination;
  const serverPag = data?.pagination;
  const all = data?.data ?? [];

  const totalCount = hasServerPagination ? (serverPag?.totalCount ?? 0) : all.length;
  const pageCount = hasServerPagination
    ? (serverPag?.totalPages ?? 0)
    : Math.max(1, Math.ceil((all.length || 0) / pagination.pageSize));

  const pageData = hasServerPagination
    ? all
    : all.slice(
        pagination.pageIndex * pagination.pageSize,
        pagination.pageIndex * pagination.pageSize + pagination.pageSize
      );

  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        id: 'id',
        header: t('common.reference') || 'ID',
        accessorKey: 'id',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      {
        id: 'status',
        header: t('common.status'),
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(getPaymentStatusTranslationKey(row.original.status))}
          </Badge>
        ),
      },
      {
        id: 'amount',
        header: t('common.amount') || 'Amount',
        cell: ({ row }) => {
          const p = row.original;
          return <span>{p.amount != null ? `${p.amount} ${p.currency ?? ''}` : '—'}</span>;
        },
      },
      {
        id: 'related',
        header: t('common.related') || 'Related',
        cell: ({ row }) => {
          const p = row.original;
          const inv = p.invoice?.invoiceNumber
            ? `${t('common.invoice')} ${p.invoice.invoiceNumber}`
            : p.invoiceId
              ? `${t('common.invoice')} ${p.invoiceId}`
              : null;
          const ctr = p.contract?.contractNumber
            ? `${t('common.contract')} ${p.contract.contractNumber}`
            : p.contractId
              ? `${t('common.contract')} ${p.contractId}`
              : null;
          return <span className="text-sm">{[inv, ctr].filter(Boolean).join(' • ') || '—'}</span>;
        },
      },
      {
        id: 'createdAt',
        header: t('common.createdAt') || 'Created',
        accessorKey: 'createdAt',
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
            onClick={() => setSelected(row.original)}
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
        title={t('dashboard.payments.title') || 'Payments'}
        subtitle={t('dashboard.payments.subtitle') || 'Validate or reject payments.'}
        icon={<CreditCard className="h-8 w-8 text-[#fe4438]" />}
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : (v as PaymentStatus));
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
                {t(getPaymentStatusTranslationKey(s))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCard>

      <DataTableCard<PaymentRow>
        columns={columns}
        data={pageData}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.payments.empty') || 'No payments found.'}
        pageSizeOptions={[10, 20, 50, 100]}
        accentBorder
      />

      {selected ? (
        <PaymentDecisionDialog payment={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
