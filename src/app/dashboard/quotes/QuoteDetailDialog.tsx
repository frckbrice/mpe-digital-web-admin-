'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const QUOTE_STATUSES = [
  'SUBMITTED', 'UNDER_REVIEW', 'QUOTE_PREPARED', 'QUOTE_SENT', 'CLIENT_REVIEWING',
  'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const UNASSIGNED = '__unassigned__';

interface QuoteDetail {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  submissionDate: string;
  lastUpdated: string;
  internalNotes: string | null;
  estimatedCompletion: string | null;
  requesterType: string | null;
  name: string;
  company: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  country: string | null;
  requestType: string | null;
  projectDescription: string;
  desiredStartDate: string | null;
  desiredDuration: string | null;
  siteType: string | null;
  scope: string | null;
  exampleSites: string[] | null;
  responsive: boolean;
  useLogoColors: boolean;
  hasHosting: boolean;
  hostingDetails: string | null;
  budgetFixed: boolean;
  budgetAmount: string | null;
  client: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  assignedAgent: { id: string; firstName: string; lastName: string; email: string } | null;
  documents: { id: string; fileName: string; originalName: string; documentType: string; status: string; uploadDate: string; uploadedBy?: { firstName: string; lastName: string } }[];
  messages: { id: string; subject: string | null; content: string; sentAt: string; sender: { firstName: string; lastName: string; email: string }; recipient: { firstName: string; lastName: string; email: string } }[];
  statusHistory: { id: string; status: string; notes: string | null; timestamp: string; changedBy: string }[];
}

async function fetchQuoteDetail(id: string): Promise<QuoteDetail> {
  const res = await apiFetch(`/api/agent/quotes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch quote');
  return j.data;
}

async function fetchAgents(): Promise<{ id: string; firstName: string; lastName: string; email: string; isActive: boolean }[]> {
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch agents');
  return Array.isArray(j.data) ? j.data : [];
}

async function updateQuote(id: string, body: { status?: string; priority?: string; internalNotes?: string }): Promise<void> {
  const res = await apiFetch(`/api/agent/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update quote');
}

async function assignQuote(quoteId: string, assignedAgentId: string | null): Promise<void> {
  const res = await apiFetch(`/api/admin/quotes/${quoteId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedAgentId }),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to assign quote');
}

export function QuoteDetailDialog({
  quoteId,
  onClose,
  onUpdated,
}: {
  quoteId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState<string>(UNASSIGNED);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['agent', 'quotes', quoteId],
    queryFn: () => fetchQuoteDetail(quoteId),
    enabled: !!quoteId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'users', 'AGENT', 'active'],
    queryFn: fetchAgents,
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
    mutationFn: (body: { status?: string; priority?: string; internalNotes?: string }) =>
      updateQuote(quoteId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      qc.setQueryData<QuoteDetail>(quoteDetailKey, (old) =>
        old ? { ...old, ...body } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous);
      toast.error('Failed to update quote');
    },
    onSuccess: () => {
      onUpdated();
      toast.success('Quote updated');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
  });

  const assignMu = useMutation({
    mutationFn: (agentId: string | null) => assignQuote(quoteId, agentId),
    onMutate: async (agentId) => {
      await qc.cancelQueries({ queryKey: quoteDetailKey });
      const previous = qc.getQueryData(quoteDetailKey);
      const agentsList = qc.getQueryData<{ id: string; firstName: string; lastName: string; email: string }[]>(['admin', 'users', 'AGENT', 'active']);
      const agent = agentId && agentsList ? agentsList.find((a) => a.id === agentId) ?? null : null;
      qc.setQueryData<QuoteDetail>(quoteDetailKey, (old) =>
        old ? { ...old, assignedAgent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email } : null } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(quoteDetailKey, context.previous);
      toast.error('Failed to update assignment');
    },
    onSuccess: () => {
      onUpdated();
      toast.success('Assignment updated');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: quoteDetailKey }),
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

  const open = !!quoteId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quote {quote?.referenceNumber ?? quoteId}</DialogTitle>
          <DialogDescription>View and update quote request</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <p className="text-destructive py-4">Failed to load quote. {(error as Error).message}</p>
        )}
        {quote && !isLoading && (
          <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
            {/* Client */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Client</h4>
              <p className="font-medium">{quote.client.firstName} {quote.client.lastName}</p>
              <p className="text-sm">{quote.client.email}</p>
              {quote.client.phone && <p className="text-sm text-muted-foreground">{quote.client.phone}</p>}
            </div>

            {/* Editable: Status, Priority, Internal notes, Assigned agent */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigned agent</Label>
              <Select value={assignedAgentId} onValueChange={handleAssignChange} disabled={assignMu.isPending}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Internal notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal notes (not visible to client)"
                rows={3}
              />
            </div>
            <Button onClick={handleSaveFields} disabled={patchMu.isPending}>
              {patchMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>

            {/* Project details (read-only) */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Project</h4>
              <p className="text-sm">{quote.projectDescription}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {quote.requestType && <span>Type: {quote.requestType}</span>}
                {quote.siteType && <span>Site: {quote.siteType}</span>}
                {quote.scope && <span>Scope: {quote.scope}</span>}
                {quote.desiredStartDate && <span>Start: {quote.desiredStartDate}</span>}
                {quote.desiredDuration && <span>Duration: {quote.desiredDuration}</span>}
                {quote.budgetAmount && <span>Budget: {quote.budgetAmount}</span>}
              </div>
            </div>

            {/* Documents */}
            {quote.documents.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Documents</h4>
                <ul className="text-sm space-y-1">
                  {quote.documents.map((d) => (
                    <li key={d.id}>{d.originalName || d.fileName} — {d.documentType} ({d.status})</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status history */}
            {quote.statusHistory.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Status history</h4>
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {quote.statusHistory.map((h) => (
                    <li key={h.id}>
                      <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                      {' '}{h.status}{h.notes ? ` — ${h.notes}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Messages (optional) */}
            {quote.messages.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Messages</h4>
                <ul className="text-sm space-y-2 max-h-40 overflow-y-auto">
                  {quote.messages.map((m) => (
                    <li key={m.id}>
                      <span className="text-muted-foreground">{new Date(m.sentAt).toLocaleString()}</span>
                      {' '}{m.sender.firstName} → {m.recipient.firstName}: {m.content.slice(0, 80)}{m.content.length > 80 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
