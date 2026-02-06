/**
 * Quotes Feature - Mutations
 *
 * This module contains all mutation functions for modifying quote-related data.
 * All functions use the apiFetch utility which handles authentication and error handling.
 *
 * Mutation Functions:
 * - assignQuote: Assigns or unassigns a quote to/from an agent
 * - updateQuote: Updates quote status, priority, or internal notes
 * - uploadDocument: Uploads a document for a quote
 * - updateDocumentStatus: Approves or rejects a document
 * - deleteDocument: Deletes a document
 * - uploadMessageAttachment: Uploads an attachment for a message
 * - sendMessage: Sends a message related to a quote
 * - markMessageRead: Marks a message as read
 * - validateQuote: Validates or rejects a quote (admin/moderator action)
 */

import type { MessageAttachment } from './types';

/**
 * Assigns or unassigns a quote to/from an agent
 *
 * Uses optimistic concurrency: the backend requires an If-Match header with the
 * quote's current ETag. This function GETs the quote first to read the ETag,
 * then PATCHes with If-Match.
 *
 * - 428 Precondition Required → request had no If-Match (handled by always sending ETag)
 * - 412 Precondition Failed → If-Match did not match (stale data; refresh and retry)
 *
 * @param quoteId - The ID of the quote to assign
 * @param assignedAgentId - The ID of the agent to assign to, or null to unassign
 * @returns Promise that resolves when assignment is complete
 * @throws Error with backend message when the request fails (e.g. 412, 404)
 */
export async function assignQuote(quoteId: string, assignedAgentId: string | null): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');

  const getRes = await apiFetch(`/api/admin/quotes/${quoteId}`);
  if (!getRes.ok) {
    const j = await getRes.json().catch(() => ({}));
    throw new Error(j?.message ?? j?.error ?? 'Failed to load quote');
  }
  const etag = getRes.headers.get('ETag');
  if (!etag) {
    throw new Error('Quote did not return an ETag; cannot assign safely');
  }

  const res = await apiFetch(`/api/admin/quotes/${quoteId}/assign`, {
    method: 'PATCH',
    headers: { 'If-Match': etag },
    body: JSON.stringify({ assignedAgentId }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) {
    const message =
      j?.message ??
      j?.error ??
      (res.status === 412
        ? 'Quote was updated elsewhere. Refresh and try again.'
        : 'Failed to assign quote');
    throw new Error(message);
  }
}

/**
 * Updates quote properties (status, priority, internal notes)
 *
 * Endpoint: PATCH /api/agent/quotes/{id}
 *
 * @param id - The ID of the quote to update
 * @param body - Update payload with optional fields
 * @param body.status - New quote status
 * @param body.priority - New quote priority (LOW, NORMAL, HIGH, URGENT)
 * @param body.internalNotes - Internal notes visible only to admins/moderators
 * @returns Promise that resolves when update is complete
 * @throws Error if the request fails or response is not successful
 */
export async function updateQuote(
  id: string,
  body: { status?: string; priority?: string; internalNotes?: string }
): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/agent/quotes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update quote');
}

/** Upload a document for a quote. POST /api/quote-requests/[id]/documents, FormData: file, documentType */
export async function uploadDocument(
  quoteId: string,
  file: File,
  documentType: string
): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  const res = await apiFetch(`/api/quote-requests/${quoteId}/documents`, {
    method: 'POST',
    body: form,
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to upload document');
}

/**
 * Approves or rejects a document
 *
 * Endpoint: PATCH /api/documents/{id}
 *
 * Updates the status of a document. When rejecting, a rejectionReason must be provided.
 *
 * @param id - The ID of the document to update
 * @param body - Update payload
 * @param body.status - New status: 'APPROVED' or 'REJECTED'
 * @param body.rejectionReason - Required when status is 'REJECTED', explains why document was rejected
 * @returns Promise that resolves when update is complete
 * @throws Error if the request fails or response is not successful
 */
export async function updateDocumentStatus(
  id: string,
  body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
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

/**
 * Uploads an attachment for a message (Cloudinary via single upload API).
 *
 * Uses POST /api/upload – the app’s single Cloudinary upload endpoint.
 * Returns metadata about the uploaded attachment including URL, name, size, and type.
 *
 * @param file - The file to upload as an attachment
 * @returns Promise resolving to MessageAttachment object with attachment metadata
 * @throws Error if the request fails
 */
export async function uploadMessageAttachment(file: File): Promise<MessageAttachment> {
  const { apiFetch } = await import('@/lib/api-client');
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch('/api/upload', { method: 'POST', body: form });
  const j = await res.json();
  if (!res.ok) throw new Error(j.message || j.error || 'Failed to upload attachment');
  const data = j.data ?? j;
  return {
    url: data.url,
    name: data.name ?? file.name,
    size: data.size ?? file.size,
    type: data.type ?? (file.type || 'application/octet-stream'),
    uploadedAt: data.uploadedAt ?? new Date().toISOString(),
  };
}

/** Send a message. POST /api/messages. Recipient must be client or assigned agent. */
export async function sendMessage(body: {
  recipientId: string;
  content: string;
  subject?: string;
  quoteId?: string;
  replyToId?: string;
  attachments?: MessageAttachment[];
}): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify(body) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to send message');
}

/**
 * Marks a message as read
 *
 * Endpoint: PATCH /api/messages/{id}/read
 *
 * Marks a message as read by the current user. The admin must be the recipient
 * of the message to mark it as read.
 *
 * @param id - The ID of the message to mark as read
 * @returns Promise that resolves when message is marked as read
 * @throws Error if the request fails (204 status is considered success)
 */
export async function markMessageRead(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/messages/${id}/read`, { method: 'PATCH' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 204)
    throw new Error(j.message || j.error || 'Failed to mark as read');
}

/**
 * Validates or rejects a quote (Admin/Moderator action)
 *
 * Endpoint: PATCH /api/admin/quotes/{id}/validate
 *
 * How to avoid 428:
 * Before calling this, GET /api/admin/quotes/[id] (e.g. via fetchQuoteDetail) and keep the
 * response ETag (e.g. W/"v:2026-02-03T12:34:56.789Z"). Pass that value as the etag argument
 * so it is sent in the If-Match header. If you don't send If-Match, the API returns 428.
 *
 * Error responses:
 * - 428: Missing If-Match header — GET the quote first, then send its ETag as If-Match on this PATCH.
 * - 412: If-Match does not match current quote version (quote was modified; refetch and retry).
 *
 * @param quoteId - The ID of the quote to validate/reject
 * @param body - Validation payload
 * @param etag - ETag from GET /api/admin/quotes/[id] response; required to avoid 428
 * @returns Promise that resolves when validation/rejection is complete
 * @throws Error if the request fails or response is not successful
 */
export async function validateQuote(
  quoteId: string,
  body: { action: 'VALIDATE' | 'REJECT'; reason?: string },
  etag: string | null
): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (etag) headers['If-Match'] = etag;
  const res = await apiFetch(`/api/admin/quotes/${quoteId}/validate`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 428) {
    throw new Error(
      j.message ||
        'Missing If-Match header — GET the quote first, then send its ETag as If-Match on this PATCH.'
    );
  }
  if (res.status === 412) {
    throw new Error(
      j.message ||
        'If-Match does not match current quote version (quote was modified; refetch and retry).'
    );
  }
  if (!res.ok || !j.success)
    throw new Error(j.message || j.error || 'Failed to validate/reject quote');
}

/**
 * Archives a quote (typically used for cancelled quotes).
 *
 * Endpoint: PATCH /api/admin/quotes/{id} with body { archived: true }
 *
 * @param quoteId - The ID of the quote to archive
 * @throws Error if the request fails
 */
export async function archiveQuote(quoteId: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/quotes/${quoteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to archive quote');
}

/**
 * Permanently deletes a quote (typically only for cancelled quotes).
 *
 * Endpoint: DELETE /api/admin/quotes/{id}
 *
 * @param quoteId - The ID of the quote to delete
 * @throws Error if the request fails
 */
export async function deleteQuote(quoteId: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/quotes/${quoteId}`, { method: 'DELETE' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || j.error || 'Failed to delete quote');
}
