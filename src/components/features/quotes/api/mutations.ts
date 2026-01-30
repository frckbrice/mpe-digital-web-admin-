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
 * Endpoint: PATCH /api/admin/quotes/{quoteId}/assign
 * 
 * @param quoteId - The ID of the quote to assign
 * @param assignedAgentId - The ID of the agent to assign to, or null to unassign
 * @returns Promise that resolves when assignment is complete
 * @throws Error if the request fails or response is not successful
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
  if (!res.ok && res.status !== 204) throw new Error(j.message || j.error || 'Failed to mark as read');
}

/**
 * Validates or rejects a quote (Admin/Moderator action)
 * 
 * Endpoint: PATCH /api/admin/quotes/{id}/validate
 * 
 * Allows administrators and moderators to validate (approve) or reject quotes.
 * This is a key workflow step in quote processing.
 * 
 * @param quoteId - The ID of the quote to validate/reject
 * @param body - Validation payload
 * @param body.action - Action to take: 'VALIDATE' to approve, 'REJECT' to reject
 * @param body.reason - Optional reason for rejection (recommended when rejecting)
 * @returns Promise that resolves when validation/rejection is complete
 * @throws Error if the request fails or response is not successful
 */
export async function validateQuote(quoteId: string, body: { action: 'VALIDATE' | 'REJECT'; reason?: string }): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/quotes/${quoteId}/validate`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || j.error || 'Failed to validate/reject quote');
}

