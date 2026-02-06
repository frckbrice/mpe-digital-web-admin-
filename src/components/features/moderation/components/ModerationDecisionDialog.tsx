'use client';

import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
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
import type { ModerationRequest } from '../api/types';
import { Loader2 } from 'lucide-react';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'PENDING') return 'secondary';
  if (s === 'APPROVED') return 'default';
  if (s === 'REJECTED') return 'destructive';
  return 'outline';
}

function getModerationStatusTranslationKey(status: ModerationRequest['status']): string {
  const map: Record<ModerationRequest['status'], string> = {
    PENDING: 'dashboard.moderation.statusPending',
    APPROVED: 'dashboard.moderation.statusApproved',
    REJECTED: 'dashboard.moderation.statusRejected',
  };
  return map[status] ?? status;
}

export function ModerationDecisionDialog(props: {
  request: ModerationRequest;
  onClose: () => void;
  onDecide: (approved: boolean, comment?: string) => void;
  isPending?: boolean;
}) {
  const { t } = useTranslation();
  const { request, onClose, onDecide, isPending } = props;
  const [comment, setComment] = useState(request.comment ?? '');

  const title = useMemo(() => {
    const inv = request.invoice?.invoiceNumber
      ? `${t('common.invoice')} ${request.invoice.invoiceNumber}`
      : request.invoice?.id
        ? `${t('common.invoice')} ${request.invoice.id}`
        : null;
    const q = request.quote?.referenceNumber
      ? `${t('common.quote')} ${request.quote.referenceNumber}`
      : request.quote?.id
        ? `${t('common.quote')} ${request.quote.id}`
        : null;
    return inv || q || request.actionType || t('dashboard.moderation.reviewTitle');
  }, [request, t]);

  return (
    <Dialog open={!!request?.id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>{request.actionType}</span>
            <Badge variant={statusVariant(request.status)}>
              {t(getModerationStatusTranslationKey(request.status))}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">
                {t('common.requestedBy') || 'Requested by'}
              </div>
              <div className="font-medium">
                {request.requestedBy
                  ? `${request.requestedBy.firstName ?? ''} ${request.requestedBy.lastName ?? ''}`.trim() ||
                    request.requestedBy.email ||
                    request.requestedBy.id
                  : request.requestedById || '—'}
              </div>
              {request.requestedAt ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(request.requestedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t('common.entity') || 'Entity'}</div>
              <div className="font-medium">
                {request.invoice?.invoiceNumber
                  ? `${t('common.invoice')} ${request.invoice.invoiceNumber}`
                  : request.invoice?.id
                    ? `${t('common.invoice')} ${request.invoice.id}`
                    : null}
                {request.quote?.referenceNumber
                  ? `${t('common.quote')} ${request.quote.referenceNumber}`
                  : request.quote?.id
                    ? `${t('common.quote')} ${request.quote.id}`
                    : null}
                {!request.invoice && !request.quote
                  ? request.contract?.contractNumber
                    ? `${t('common.contract')} ${request.contract.contractNumber}`
                    : request.contract?.id
                      ? `${t('common.contract')} ${request.contract.id}`
                      : '—'
                  : null}
              </div>
              {request.invoice?.amount != null ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {request.invoice.amount} {request.invoice.currency ?? ''}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">{t('common.comment') || 'Comment'}</div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('common.optionalComment') || 'Optional comment'}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDecide(false, comment || undefined)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('common.reject') || 'Reject'}
          </Button>
          <Button
            type="button"
            onClick={() => onDecide(true, comment || undefined)}
            disabled={isPending}
            style={{ backgroundColor: '#ff4538' }}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('common.approve') || 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
