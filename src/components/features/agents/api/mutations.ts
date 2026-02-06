/**
 * Agents feature - mutations
 */

import type { AgentRow } from './types';

export type UpdateAgentPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
};

export async function updateAgent(id: string, data: UpdateAgentPayload): Promise<AgentRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update agent');
  return j.data;
}

export async function deactivateAgent(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to deactivate agent');
}
