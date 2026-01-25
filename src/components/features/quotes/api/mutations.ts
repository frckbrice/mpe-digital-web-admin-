/**
 * Quotes feature - mutations
 */

export async function assignQuote(quoteId: string, assignedAgentId: string | null): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/quotes/${quoteId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedAgentId }),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to assign quote');
}

export async function updateQuote(id: string, body: { status?: string; priority?: string; internalNotes?: string }): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/agent/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update quote');
}

/** Upload a document for a quote. POST /api/quote-requests/[id]/documents, FormData: file, documentType */
export async function uploadDocument(quoteId: string, file: File, documentType: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  const res = await apiFetch(`/api/quote-requests/${quoteId}/documents`, { method: 'POST', body: form });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to upload document');
}

/** Approve or reject a document. PATCH /api/documents/[id]. rejectionReason required when REJECTED. */
export async function updateDocumentStatus(
  id: string,
  body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to update document');
}

/** Delete a document. DELETE /api/documents/[id] */
export async function deleteDocument(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || j.error || 'Failed to delete document');
}

/** Send a message. POST /api/messages. Recipient must be client or assigned agent. */
export async function sendMessage(body: {
  recipientId: string;
  content: string;
  subject?: string;
  quoteId?: string;
  replyToId?: string;
}): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to send message');
}

/** Mark a message as read. PATCH /api/messages/[id]/read. Admin must be recipient. */
export async function markMessageRead(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/messages/${id}/read`, { method: 'PATCH' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 204) throw new Error(j.message || j.error || 'Failed to mark as read');
}

