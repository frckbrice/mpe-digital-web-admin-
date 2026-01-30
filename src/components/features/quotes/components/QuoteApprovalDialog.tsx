'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validateQuote } from '../api/mutations';

interface QuoteApprovalDialogProps {
  quoteId: string;
  currentStatus: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuoteApprovalDialog({ quoteId, currentStatus, open, onClose, onSuccess }: QuoteApprovalDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'VALIDATE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');

  const validateQuoteMu = useMutation({
    mutationFn: (body: { action: 'VALIDATE' | 'REJECT'; reason?: string }) => validateQuote(quoteId, body),
    onSuccess: (_, vars) => {
      setAction(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['agent', 'quotes', quoteId] });
      onSuccess();
      toast.success(vars.action === 'VALIDATE' ? t('dashboard.quotes.quoteValidated') : t('dashboard.quotes.quoteRejected'));
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAction(null);
      setReason('');
      onClose();
    }
  };

  const canValidate = currentStatus !== 'VALIDATED' && currentStatus !== 'REJECTED';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'VALIDATE'
              ? t('dashboard.quotes.validateQuoteTitle')
              : action === 'REJECT'
              ? t('dashboard.quotes.rejectQuoteTitle')
              : t('dashboard.quotes.approvalActions')}
          </DialogTitle>
          <DialogDescription>
            {action === 'VALIDATE'
              ? t('dashboard.quotes.validateQuoteDescription')
              : action === 'REJECT'
              ? t('dashboard.quotes.rejectQuoteDescription')
              : t('dashboard.quotes.approvalActionsDescription')}
          </DialogDescription>
        </DialogHeader>

        {!action ? (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              onClick={() => setAction('VALIDATE')}
              disabled={!canValidate}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('dashboard.quotes.validateQuote')}
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setAction('REJECT')}
              disabled={!canValidate}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t('dashboard.quotes.rejectQuote')}
            </Button>
            {!canValidate && (
              <p className="text-xs text-muted-foreground text-center">
                {t('dashboard.quotes.quoteAlreadyProcessed')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <Label>
                {t('dashboard.quotes.validationReason')} {action === 'REJECT' && '*'}
              </Label>
              <Textarea
                placeholder={t('dashboard.quotes.validationReasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              {action === 'REJECT' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.quotes.rejectionReasonRequired')}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {action && (
            <>
              <Button variant="outline" onClick={() => { setAction(null); setReason(''); }}>
                {t('common.back')}
              </Button>
              <Button
                variant={action === 'REJECT' ? 'destructive' : 'default'}
                className={action === 'VALIDATE' ? 'bg-green-600 text-white hover:bg-green-700 hover:text-white' : ''}
                onClick={() => {
                  if (action && (action === 'VALIDATE' || reason.trim())) {
                    validateQuoteMu.mutate({ action, reason: reason.trim() || undefined });
                  } else if (action === 'REJECT') {
                    toast.error(t('dashboard.quotes.rejectionReasonRequired'));
                  }
                }}
                disabled={validateQuoteMu.isPending || (action === 'REJECT' && !reason.trim())}
              >
                {validateQuoteMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {action === 'VALIDATE' ? t('dashboard.quotes.validate') : t('dashboard.quotes.reject')}
              </Button>
            </>
          )}
          {!action && (
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
