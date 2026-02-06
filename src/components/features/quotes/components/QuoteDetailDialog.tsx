'use client';

import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Upload,
  Save,
  Archive,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/components/features/auth';
import { fetchQuoteDetail, fetchAgentsForDetail } from '../api/queries';
import { updateQuote, assignQuote, archiveQuote, deleteQuote } from '../api/mutations';
import { QUOTE_STATUSES, PRIORITIES, UNASSIGNED } from '../api/data';
import { QuoteApprovalDialog } from './QuoteApprovalDialog';
import { QuoteDocumentUploadDialog } from './QuoteDocumentUploadDialog';
import { QuoteMessagesSheet } from './QuoteMessagesSheet';

function getStatusTranslationKey(status: string): string {
  const statusMap: Record<string, string> = {
    SUBMITTED: 'dashboard.quotes.statusSubmitted',
    UNDER_REVIEW: 'dashboard.quotes.statusUnderReview',
    QUOTE_PREPARED: 'dashboard.quotes.statusQuotePrepared',
    QUOTE_SENT: 'dashboard.quotes.statusQuoteSent',
    CLIENT_REVIEWING: 'dashboard.quotes.statusClientReviewing',
    ACCEPTED: 'dashboard.quotes.statusAccepted',
    REJECTED: 'dashboard.quotes.statusRejected',
    IN_PROGRESS: 'dashboard.quotes.statusInProgress',
    COMPLETED: 'dashboard.quotes.statusCompleted',
    CANCELLED: 'dashboard.quotes.statusCancelled',
  };
  return statusMap[status] || status;
}

function getPriorityTranslationKey(priority: string): string {
  const priorityMap: Record<string, string> = {
    LOW: 'dashboard.quotes.priorityLow',
    NORMAL: 'dashboard.quotes.priorityNormal',
    HIGH: 'dashboard.quotes.priorityHigh',
    URGENT: 'dashboard.quotes.priorityUrgent',
  };
  return priorityMap[priority] || priority;
}

interface QuoteDetailDialogProps {
  quoteId: string;
  onClose: () => void;
  onUpdated: () => void;
}

// Inner content keyed by quote.id so form state is initialized from quote without an effect
function QuoteDetailContent({
  quote,
  quoteId,
  quoteEtag,
  agents,
  user,
  quoteDetailKey,
  qc,
  onUpdated,
  onClose,
}: {
  quote: NonNullable<Awaited<ReturnType<typeof fetchQuoteDetail>>['quote']>;
  quoteId: string;
  quoteEtag: string | null;
  agents: { id: string; firstName: string; lastName: string; email: string }[];
  user: { id: string; email: string; role: string } | null;
  quoteDetailKey: string[];
  qc: ReturnType<typeof useQueryClient>;
  onUpdated: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(quote.status);
  const [priority, setPriority] = useState(quote.priority);
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes || '');
  const [assignedAgentId, setAssignedAgentId] = useState<string>(
    quote.assignedAgent?.id ?? UNASSIGNED
  );
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showMessagesSheet, setShowMessagesSheet] = useState(false);

  const patchMu = useMutation({
    mutationFn: (body: { status?: string; priority?: string; internalNotes?: string }) =>
      updateQuote(quoteId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      qc.setQueryData(quoteDetailKey, (old: any) =>
        old?.quote ? { ...old, quote: { ...old.quote, ...body } } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous);
      toast.error(t('dashboard.quotes.failedUpdateQuote'));
    },
    onSuccess: () => {
      onUpdated();
      toast.success(t('dashboard.quotes.quoteUpdated'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
  });

  const assignMu = useMutation({
    mutationFn: (agentId: string | null) => assignQuote(quoteId, agentId),
    onMutate: async (agentId) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      const agentsList = qc.getQueryData<
        { id: string; firstName: string; lastName: string; email: string }[]
      >(['admin', 'users', 'AGENT', 'active']);
      const agent =
        agentId && agentsList ? (agentsList.find((a) => a.id === agentId) ?? null) : null;
      qc.setQueryData(quoteDetailKey, (old: any) =>
        old?.quote
          ? {
            ...old,
            quote: {
              ...old.quote,
              assignedAgent: agent
                ? {
                  id: agent.id,
                  firstName: agent.firstName,
                  lastName: agent.lastName,
                  email: agent.email,
                }
                : null,
            },
          }
          : old
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous);
      const message = err instanceof Error ? err.message : null;
      toast.error(message || t('dashboard.quotes.failedAssignment'));
    },
    onSuccess: () => {
      onUpdated();
      toast.success(t('dashboard.quotes.assignmentUpdated'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
  });

  const archiveMu = useMutation({
    mutationFn: () => archiveQuote(quoteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quoteDetailKey });
      qc.invalidateQueries({ queryKey: ['admin', 'quotes'] });
      qc.invalidateQueries({ queryKey: ['agent', 'quotes'] });
      onUpdated();
      toast.success(t('dashboard.quotes.quoteArchived'));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t('dashboard.quotes.failedArchive')),
  });

  const deleteMu = useMutation({
    mutationFn: () => deleteQuote(quoteId),
    onSuccess: () => {
      onUpdated();
      onClose();
      toast.success(t('dashboard.quotes.quoteDeleted'));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t('dashboard.quotes.failedDelete')),
  });

  const handleSaveFields = () => {
    const body: { status?: string; priority?: string; internalNotes?: string } = {};
    if (status !== quote.status) body.status = status;
    if (priority !== quote.priority) body.priority = priority;
    if (internalNotes !== (quote.internalNotes || '')) body.internalNotes = internalNotes;
    if (Object.keys(body).length > 0) patchMu.mutate(body);
  };

  const handleAssignChange = (v: string) => {
    setAssignedAgentId(v);
    const id = v === UNASSIGNED ? null : v;
    if (id !== (quote.assignedAgent?.id ?? null)) assignMu.mutate(id);
  };

  const handleComponentSuccess = () => {
    qc.invalidateQueries({ queryKey: quoteDetailKey });
    onUpdated();
  };

  const unreadCount =
    quote?.messages?.filter(
      (m) => user && (m.recipient.email === user.email || m.recipient.id === user?.id) && !m.readAt
    ).length ?? 0;
  const adminDocumentsCount =
    quote?.documents?.filter((d) =>
      ['CONTRACT', 'INVOICE', 'DESIGN_MOCKUP', 'CONTENT_DOCUMENT', 'OTHER'].includes(d.documentType)
    ).length ?? 0;

  return (
    <>
      <div className="space-y-6 overflow-y-auto pr-2 -mr-2 flex-1">
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('common.client')}</h4>
          <div className="space-y-1">
            <p className="font-medium">
              {quote.client.firstName} {quote.client.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{quote.client.email}</p>
            {quote.client.phone && (
              <p className="text-sm text-muted-foreground">{quote.client.phone}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t('common.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(getStatusTranslationKey(s))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('dashboard.quotes.priority')}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(getPriorityTranslationKey(p))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>{t('common.assignedAgent')}</Label>
          <Select
            value={assignedAgentId}
            onValueChange={handleAssignChange}
            disabled={assignMu.isPending}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('common.unassigned')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>{t('common.unassigned')}</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('common.internalNotes')}</Label>
          <Textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder={t('common.internalNotesPlaceholder')}
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveFields} disabled={patchMu.isPending}>
            {patchMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {t('common.saveChanges')}
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('common.project')}</h4>
          <p className="text-sm mb-3">{quote.projectDescription}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {quote.requestType && <span>{t('common.type')}: {quote.requestType}</span>}
            {quote.siteType && <span>{t('common.site')}: {quote.siteType}</span>}
            {quote.scope && <span>{t('common.scope')}: {quote.scope}</span>}
            {quote.desiredStartDate && <span>{t('common.start')}: {quote.desiredStartDate}</span>}
            {quote.desiredDuration && <span>{t('common.duration')}: {quote.desiredDuration}</span>}
            {quote.budgetAmount && <span>{t('common.budget')}: {quote.budgetAmount}</span>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(user?.role === 'MODERATOR' || user?.role === 'ADMIN') &&
            quote.status !== 'VALIDATED' &&
            quote.status !== 'REJECTED' && (
              <Button
                variant="outline"
                className="w-full justify-start text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => setShowApprovalDialog(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('dashboard.quotes.approveOrReject')}
              </Button>
            )}

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowDocumentDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('dashboard.quotes.uploadDocuments')}
            {adminDocumentsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {adminDocumentsCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowMessagesSheet(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('dashboard.quotes.messages')}
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>

          {quote.status === 'CANCELLED' && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => archiveMu.mutate()}
                disabled={archiveMu.isPending}
              >
                {archiveMu.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                {t('dashboard.quotes.archiveQuote')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() =>
                  window.confirm(t('dashboard.quotes.deleteQuoteConfirm')) && deleteMu.mutate()
                }
                disabled={deleteMu.isPending}
              >
                {deleteMu.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t('dashboard.quotes.deleteQuote')}
              </Button>
            </>
          )}
        </div>

        {(quote.statusHistory ?? []).length > 0 && (
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              {t('common.statusHistory')}
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(quote.statusHistory ?? []).map((h) => (
                <div key={h.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                  <span className="ml-2">{h.status}</span>
                  {h.notes && <span className="ml-2 text-muted-foreground">— {h.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showApprovalDialog && (
        <QuoteApprovalDialog
          quoteId={quoteId}
          etag={quoteEtag}
          currentStatus={quote.status}
          open={showApprovalDialog}
          onClose={() => setShowApprovalDialog(false)}
          onSuccess={handleComponentSuccess}
        />
      )}
      {showDocumentDialog && (
        <QuoteDocumentUploadDialog
          quoteId={quoteId}
          quote={quote}
          open={showDocumentDialog}
          onClose={() => setShowDocumentDialog(false)}
          onSuccess={handleComponentSuccess}
        />
      )}
      {showMessagesSheet && (
        <QuoteMessagesSheet
          quoteId={quoteId}
          quote={quote}
          open={showMessagesSheet}
          onClose={() => setShowMessagesSheet(false)}
          onSuccess={handleComponentSuccess}
        />
      )}
    </>
  );
}

export function QuoteDetailDialog({ quoteId, onClose, onUpdated }: QuoteDetailDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const {
    data: quoteDetailResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'quotes', quoteId],
    queryFn: () => fetchQuoteDetail(quoteId),
    enabled: !!quoteId,
  });

  const quote = quoteDetailResult?.quote ?? null;
  const quoteEtag = quoteDetailResult?.etag ?? null;

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'users', 'AGENT', 'active'],
    queryFn: fetchAgentsForDetail,
  });

  const quoteDetailKey = ['admin', 'quotes', quoteId];

  return (
    <Dialog open={!!quoteId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('dashboard.quotes.detailTitle', { ref: quote?.referenceNumber ?? quoteId })}
          </DialogTitle>
          <DialogDescription>{t('dashboard.quotes.detailDescription')}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <p className="text-destructive py-4">
            {t('dashboard.quotes.failedLoadQuote')} {(error as Error).message}
          </p>
        )}
        {quote && !isLoading && (
          <QuoteDetailContent
            key={quote.id}
            quote={quote}
            quoteId={quoteId}
            quoteEtag={quoteEtag}
            agents={agents}
            user={user}
            quoteDetailKey={quoteDetailKey}
            qc={qc}
            onUpdated={onUpdated}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
