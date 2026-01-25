/**
 * Quotes feature - data queries
 */

import type { QuotesRes, AgentsRes, ClientsRes, QuoteDetail } from './types';

export async function fetchQuotes(params: {
  status?: string;
  assignedAgentId?: string;
  clientId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuotesRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.assignedAgentId) sp.set('assignedAgentId', params.assignedAgentId);
  if (params.clientId) sp.set('clientId', params.clientId);
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/quotes?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch quotes');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch quotes');
  return json;
}

export async function fetchAgentsForQuotes(): Promise<AgentsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch agents');
  return json;
}

export async function fetchClientsForQuotes(): Promise<ClientsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/agent/clients?pageSize=200');
  if (!res.ok) throw new Error('Failed to fetch clients');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch clients');
  return json;
}

export async function fetchQuoteDetail(id: string): Promise<QuoteDetail> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/agent/quotes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch quote');
  return j.data;
}

export async function fetchAgentsForDetail(): Promise<{ id: string; firstName: string; lastName: string; email: string; isActive: boolean }[]> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch agents');
  return Array.isArray(j.data) ? j.data : [];
}
