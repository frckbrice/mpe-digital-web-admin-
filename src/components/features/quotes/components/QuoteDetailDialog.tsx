'use client';

import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Check, X, Trash2, Send, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/components/features/auth';
import { fetchQuoteDetail, fetchAgentsForDetail } from '../api/queries';
import { updateQuote, assignQuote, uploadDocument, updateDocumentStatus, deleteDocument, sendMessage, markMessageRead } from '../api/mutations';
import { QUOTE_STATUSES, PRIORITIES, UNASSIGNED, DOCUMENT_TYPES } from '../api/data';
import type { QuoteDetail } from '../api/types';

const MAX_FILE_MB = 10;

interface QuoteDetailDialogProps {
  quoteId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function QuoteDetailDialog({ quoteId, onClose, onUpdated }: QuoteDetailDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState<string>(UNASSIGNED);
  // Document reject dialog
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // Document delete confirm
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  // Send message form
  const [msgRecipientId, setMsgRecipientId] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [hasUploadFile, setHasUploadFile] = useState(false);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['agent', 'quotes', quoteId],
    queryFn: () => fetchQuoteDetail(quoteId),
    enabled: !!quoteId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'users', 'AGENT', 'active'],
    queryFn: fetchAgentsForDetail,
  });

  useEffect(() => {
    if (quote) {
      setStatus(quote.status);
      setPriority(quote.priority);
      setInternalNotes(quote.internalNotes || '');
      setAssignedAgentId(quote.assignedAgent?.id ?? UNASSIGNED);
    }
  }, [quote]);

  const quoteDetailKey = ['agent', 'quotes', quoteId];

  const patchMu = useMutation({
    mutationFn: (body: { status?: string; priority?: string; internalNotes?: string }) => updateQuote(quoteId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      qc.setQueryData<QuoteDetail>(quoteDetailKey, (old) => (old ? { ...old, ...body } : old));
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous); toast.error(t('dashboard.quotes.failedUpdateQuote')); },
    onSuccess: () => { onUpdated(); toast.success(t('dashboard.quotes.quoteUpdated')); },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
  });

  const assignMu = useMutation({
    mutationFn: (agentId: string | null) => assignQuote(quoteId, agentId),
    onMutate: async (agentId) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      const agentsList = qc.getQueryData<{ id: string; firstName: string; lastName: string; email: string }[]>(['admin', 'users', 'AGENT', 'active']);
      const agent = agentId && agentsList ? agentsList.find((a) => a.id === agentId) ?? null : null;
      qc.setQueryData<QuoteDetail>(quoteDetailKey, (old) => (old ? { ...old, assignedAgent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email } : null } : old));
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous); toast.error(t('dashboard.quotes.failedAssignment')); },
    onSuccess: () => { onUpdated(); toast.success(t('dashboard.quotes.assignmentUpdated')); },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
  });

  const uploadDocMu = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) => uploadDocument(quoteId, file, documentType),
    onSuccess: () => { qc.invalidateQueries({ queryKey: quoteDetailKey }); onUpdated(); toast.success(t('dashboard.quotes.documentUploaded')); if (fileInputRef.current) fileInputRef.current.value = ''; },
    onError: (e: Error) => toast.error(e.message),
  });

  const docStatusMu = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => updateDocumentStatus(id, { status, rejectionReason }),
    onSuccess: (_, v) => { setRejectDocId(null); setRejectReason(''); qc.invalidateQueries({ queryKey: quoteDetailKey }); onUpdated(); toast.success(v.status === 'APPROVED' ? t('dashboard.quotes.documentApproved') : t('dashboard.quotes.documentRejected')); },
    onError: (e: Error) => toast.error(e.message),
  });

  const docDeleteMu = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, id) => { setDeleteDocId(null); qc.invalidateQueries({ queryKey: quoteDetailKey }); onUpdated(); toast.success(t('dashboard.quotes.documentDeleted')); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMsgMu = useMutation({
    mutationFn: (body: { recipientId: string; content: string; subject?: string }) => sendMessage({ ...body, quoteId }),
    onSuccess: () => { setMsgContent(''); setMsgSubject(''); setMsgRecipientId(''); qc.invalidateQueries({ queryKey: quoteDetailKey }); onUpdated(); toast.success(t('dashboard.quotes.messageSent')); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markReadMu = useMutation({
    mutationFn: markMessageRead,
    onSuccess: (_, id) => { qc.setQueryData<QuoteDetail>(quoteDetailKey, (old) => (old ? { ...old, messages: old.messages.map((m) => m.id === id ? { ...m, readAt: new Date().toISOString() } : m) } : old)); toast.success(t('dashboard.quotes.messageMarkedRead')); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSaveFields = () => {
    const body: { status?: string; priority?: string; internalNotes?: string } = {};
    if (quote && status !== quote.status) body.status = status;
    if (quote && priority !== quote.priority) body.priority = priority;
    if (internalNotes !== (quote?.internalNotes || '')) body.internalNotes = internalNotes;
    if (Object.keys(body).length > 0) patchMu.mutate(body);
  };

  const handleAssignChange = (v: string) => {
    setAssignedAgentId(v);
    const id = v === UNASSIGNED ? null : v;
    if (id !== (quote?.assignedAgent?.id ?? null)) assignMu.mutate(id);
  };

  return (
    <>
    <Dialog open={!!quoteId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('dashboard.quotes.detailTitle', { ref: quote?.referenceNumber ?? quoteId })}</DialogTitle>
          <DialogDescription>{t('dashboard.quotes.detailDescription')}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="text-destructive py-4">{t('dashboard.quotes.failedLoadQuote')} {(error as Error).message}</p>}
        {quote && !isLoading && (
          <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
            <div className="rounded-lg border border-border p-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('common.client')}</h4>
              <p className="font-medium">{quote.client.firstName} {quote.client.lastName}</p>
              <p className="text-sm">{quote.client.email}</p>
              {quote.client.phone && <p className="text-sm text-muted-foreground">{quote.client.phone}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t('common.status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('dashboard.quotes.priority')}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('common.assignedAgent')}</Label>
              <Select value={assignedAgentId} onValueChange={handleAssignChange} disabled={assignMu.isPending}>
                <SelectTrigger><SelectValue placeholder={t('common.unassigned')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>{t('common.unassigned')}</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('common.internalNotes')}</Label>
              <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder={t('common.internalNotesPlaceholder')} rows={3} />
            </div>
            <Button onClick={handleSaveFields} disabled={patchMu.isPending}>
              {patchMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.saveChanges')}
            </Button>

            <div className="rounded-lg border border-border p-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('common.project')}</h4>
              <p className="text-sm">{quote.projectDescription}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {quote.requestType && <span>{t('common.type')}: {quote.requestType}</span>}
                {quote.siteType && <span>{t('common.site')}: {quote.siteType}</span>}
                {quote.scope && <span>{t('common.scope')}: {quote.scope}</span>}
                {quote.desiredStartDate && <span>{t('common.start')}: {quote.desiredStartDate}</span>}
                {quote.desiredDuration && <span>{t('common.duration')}: {quote.desiredDuration}</span>}
                {quote.budgetAmount && <span>{t('common.budget')}: {quote.budgetAmount}</span>}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">{t('common.documents')}</h4>
              {/* Upload */}
              <div className="flex flex-wrap gap-2 items-end">
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size > MAX_FILE_MB * 1024 * 1024) { toast.error(t('dashboard.quotes.documentMaxSize', { mb: MAX_FILE_MB })); e.target.value = ''; setHasUploadFile(false); return; } setHasUploadFile(!!f); }} />
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('dashboard.quotes.documentType')} /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map((dt) => <SelectItem key={dt} value={dt}>{dt.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" onClick={() => { const f = fileInputRef.current?.files?.[0]; if (f && uploadDocType) uploadDocMu.mutate({ file: f, documentType: uploadDocType }); else toast.error(t('dashboard.quotes.documentSelectFileAndType')); }} disabled={!hasUploadFile || !uploadDocType || uploadDocMu.isPending}><Upload className="mr-1 h-4 w-4" />{t('dashboard.quotes.documentUpload')}</Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.quotes.documentFormats')}</p>
              {quote.documents.length > 0 ? (
                <ul className="text-sm space-y-2">
                  {quote.documents.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                      <span>{d.originalName || d.fileName} — {d.documentType} <span className="text-muted-foreground">({d.status})</span></span>
                      <div className="flex gap-1 flex-shrink-0">
                        {!['APPROVED', 'REJECTED'].includes(d.status) && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-green-600 hover:text-green-700" onClick={() => docStatusMu.mutate({ id: d.id, status: 'APPROVED' })} disabled={docStatusMu.isPending}><Check className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="outline" className="h-7 text-amber-600 hover:text-amber-700" onClick={() => { setRejectDocId(d.id); setRejectReason(''); }} disabled={docStatusMu.isPending}><X className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => setDeleteDocId(d.id)} disabled={docDeleteMu.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.quotes.noDocuments')}</p>
              )}
            </div>

            {quote.statusHistory.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('common.statusHistory')}</h4>
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {quote.statusHistory.map((h) => (
                    <li key={h.id}><span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span> {h.status}{h.notes ? ` — ${h.notes}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-border p-3 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">{t('common.messages')}</h4>
              {/* Send message: recipient = client or assigned agent */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Select value={msgRecipientId} onValueChange={setMsgRecipientId}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('dashboard.quotes.messageRecipient')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={quote.client.id}>{quote.client.firstName} {quote.client.lastName} ({t('common.client')})</SelectItem>
                      {quote.assignedAgent && <SelectItem value={quote.assignedAgent.id}>{quote.assignedAgent.firstName} {quote.assignedAgent.lastName} ({t('dashboard.quotes.agent')})</SelectItem>}
                    </SelectContent>
                  </Select>
                  <Input placeholder={t('dashboard.quotes.messageSubject')} value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} className="max-w-[200px]" />
                </div>
                <Textarea placeholder={t('dashboard.quotes.messageContent')} value={msgContent} onChange={(e) => setMsgContent(e.target.value)} rows={2} className="resize-none" />
                <Button size="sm" onClick={() => { if (msgRecipientId && msgContent.trim()) sendMsgMu.mutate({ recipientId: msgRecipientId, content: msgContent.trim(), subject: msgSubject.trim() || undefined }); else toast.error(t('dashboard.quotes.messageRecipientAndContent')); }} disabled={!msgRecipientId || !msgContent.trim() || sendMsgMu.isPending}><Send className="mr-1 h-4 w-4" />{t('dashboard.quotes.messageSend')}</Button>
              </div>
              {quote.messages.length > 0 ? (
                <ul className="text-sm space-y-2 max-h-40 overflow-y-auto">
                  {quote.messages.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-start justify-between gap-2 py-1.5 border-b border-border last:border-0">
                      <span><span className="text-muted-foreground">{new Date(m.sentAt).toLocaleString()}</span> {m.sender.firstName} → {m.recipient.firstName}: {m.content.slice(0, 80)}{(m.content.length > 80) ? '…' : ''}</span>
                      {user && (m.recipient.email === user.email || m.recipient.id === user.id) && !m.readAt && (
                        <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" onClick={() => markReadMu.mutate(m.id)} disabled={markReadMu.isPending}><Circle className="h-3.5 w-3.5 mr-1" />{t('dashboard.quotes.messageMarkRead')}</Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.quotes.noMessages')}</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Reject document: reason required */}
    <Dialog open={!!rejectDocId} onOpenChange={(o) => !o && setRejectDocId(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dashboard.quotes.documentRejectTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.quotes.documentRejectReasonRequired')}</DialogDescription>
        </DialogHeader>
        <Textarea placeholder={t('dashboard.quotes.documentRejectReasonPlaceholder')} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => { setRejectDocId(null); setRejectReason(''); }}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={() => rejectDocId && rejectReason.trim() && docStatusMu.mutate({ id: rejectDocId, status: 'REJECTED', rejectionReason: rejectReason.trim() })} disabled={!rejectReason.trim() || docStatusMu.isPending}>{docStatusMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.quotes.documentReject')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete document confirm */}
    <Dialog open={!!deleteDocId} onOpenChange={(o) => !o && setDeleteDocId(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dashboard.quotes.documentDeleteTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.quotes.documentDeleteConfirm')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDocId(null)}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={() => deleteDocId && docDeleteMu.mutate(deleteDocId)} disabled={docDeleteMu.isPending}>{docDeleteMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.quotes.documentDelete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
