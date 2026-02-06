'use client';

import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPaymentDetail } from '../api/queries';
import { validatePayment } from '../api/mutations';
import type { PaymentRow } from '../api/types';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'PENDING') return 'secondary';
  if (s === 'VALIDATED') return 'default';
  if (s === 'REJECTED') return 'destructive';
  return 'outline';
}

function getPaymentStatusTranslationKey(status: PaymentRow['status']): string {
  const map: Record<PaymentRow['status'], string> = {
    PENDING: 'dashboard.payments.statusPending',
    VALIDATED: 'dashboard.payments.statusValidated',
    REJECTED: 'dashboard.payments.statusRejected',
  };
  return map[status] ?? status;
}

export function PaymentDecisionDialog(props: { payment: PaymentRow; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { payment, onClose } = props;
  const [reason, setReason] = useState('');

  const title = useMemo(() => payment.id, [payment.id]);

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['payments', 'detail', payment.id],
    queryFn: () => fetchPaymentDetail(payment.id),
    enabled: !!payment.id,
  });

  const proofUrl = useMemo(() => {
    const fromRow = payment.paymentProof?.filePath || payment.proofUrl || undefined;
    const fromDetail = detail?.data?.paymentProof?.filePath || detail?.data?.proofUrl || undefined;

    const v = (fromRow ?? fromDetail) as unknown;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  }, [
    detail?.data?.paymentProof?.filePath,
    detail?.data?.proofUrl,
    payment.paymentProof?.filePath,
    payment.proofUrl,
  ]);

  const canDecide = !!proofUrl && payment.status === 'PENDING';

  const mu = useMutation({
    mutationFn: (vars: { validated: boolean; rejectionReason?: string }) =>
      validatePayment(payment.id, vars),
    onSuccess: (_j, vars) => {
      toast.success(
        vars.validated ? t('dashboard.payments.validated') : t('dashboard.payments.rejected')
      );
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'detail', payment.id] });
      onClose();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error && e.message ? e.message : t('error.unexpectedError'));
    },
  });

  return (
    <Dialog open={!!payment?.id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('dashboard.payments.reviewTitle')}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-mono text-xs">{title}</span>
            <Badge variant={statusVariant(payment.status)}>
              {t(getPaymentStatusTranslationKey(payment.status))}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t('common.amount')}</div>
              <div className="font-medium">
                {payment.amount != null ? `${payment.amount} ${payment.currency ?? ''}` : '—'}
              </div>
              {payment.createdAt ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(payment.createdAt).toLocaleString()}
                </div>
              ) : null}
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t('common.related')}</div>
              <div className="font-medium">
                {payment.invoice?.invoiceNumber
                  ? `${t('common.invoice')} ${payment.invoice.invoiceNumber}`
                  : payment.invoiceId
                    ? `${t('common.invoice')} ${payment.invoiceId}`
                    : null}
                {payment.contract?.contractNumber
                  ? ` • ${t('common.contract')} ${payment.contract.contractNumber}`
                  : payment.contractId
                    ? ` • ${t('common.contract')} ${payment.contractId}`
                    : null}
                {!payment.invoiceId && !payment.contractId ? '—' : null}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">
              {t('dashboard.payments.rejectionReason') ||
                'Rejection reason (required when rejecting)'}
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                t('dashboard.payments.rejectionPlaceholder') ||
                'e.g. Missing proof / Invalid invoice reference'
              }
            />
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">{t('dashboard.payments.proofTitle')}</div>
            {isLoadingDetail ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : proofUrl ? (
              <div className="space-y-2">
                {detail?.data?.paymentProof?.originalName ? (
                  <div className="text-xs text-muted-foreground break-all">
                    {detail.data.paymentProof.originalName}
                  </div>
                ) : null}
                <a
                  className="text-sm underline underline-offset-4 text-primary break-all"
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('dashboard.payments.openProof')}
                </a>
              </div>
            ) : (
              <div className="text-sm text-destructive">{t('dashboard.payments.noProof')}</div>
            )}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">{t('common.details')}</div>
            {isLoadingDetail ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  {t('common.viewDetails')}
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-64 whitespace-pre-wrap break-words">
                  {JSON.stringify(detail?.data ?? detail ?? {}, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={mu.isPending}>
            {t('common.close')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!canDecide) {
                toast.error(
                  t('dashboard.payments.noProof') ||
                    'No proof uploaded yet. You can only validate/reject after proof is available.'
                );
                return;
              }
              const r = reason.trim();
              if (!r) {
                toast.error(t('dashboard.payments.reasonRequired'));
                return;
              }
              mu.mutate({ validated: false, rejectionReason: r });
            }}
            disabled={mu.isPending || !canDecide}
          >
            {mu.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('common.reject')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!canDecide) {
                toast.error(
                  t('dashboard.payments.noProof') ||
                    'No proof uploaded yet. You can only validate/reject after proof is available.'
                );
                return;
              }
              mu.mutate({ validated: true });
            }}
            disabled={mu.isPending || !canDecide}
            style={{ backgroundColor: '#ff4538' }}
          >
            {mu.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('common.validate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
