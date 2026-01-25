/**
 * Agents feature - data queries
 */

import type { AgentRow, AgentsRes } from './types';

export async function fetchAgents(params: { search?: string; isActive?: string; page?: number; pageSize?: number }): Promise<AgentsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.isActive) sp.set('isActive', params.isActive);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const qs = sp.toString();
  const res = await apiFetch(`/api/admin/agents${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch agents');
  return j;
}

export async function fetchAgentDetail(userId: string): Promise<AgentRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch agent');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch agent');
  return j.data;
}
