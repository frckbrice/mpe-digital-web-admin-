/**
 * Clients feature - data queries
 * Per admin-tasks: Clients are read-only. GET /api/agent/clients with search & pagination.
 */

import type { ClientRow, ClientsRes } from './types';

export async function fetchClients(params: { search?: string; page?: number; pageSize?: number }): Promise<ClientsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const qs = sp.toString();
  const res = await apiFetch(`/api/agent/clients${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch clients');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch clients');
  return j;
}

export async function fetchClientDetail(userId: string): Promise<ClientRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch client');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch client');
  return j.data;
}
