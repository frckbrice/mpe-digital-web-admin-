/**
 * Clients feature - mutations
 */

import type { ClientRow } from './types';

export type CreateClientPayload = { email: string; firstName: string; lastName: string; phone?: string };
export type UpdateClientPayload = { firstName?: string; lastName?: string; phone?: string; isActive?: boolean };

export async function createClient(data: CreateClientPayload): Promise<ClientRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ ...data, role: 'CLIENT', isActive: true }) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to create client');
  return j.data;
}

export async function updateClient(id: string, data: UpdateClientPayload): Promise<ClientRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update client');
  return j.data;
}

export async function deactivateClient(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to deactivate client');
}

export async function promoteToAgent(id: string): Promise<ClientRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role: 'AGENT' }) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to promote to agent');
  return j.data;
}
