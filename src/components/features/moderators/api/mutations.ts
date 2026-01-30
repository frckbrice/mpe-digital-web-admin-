/**
 * Moderators feature - mutations
 */

import type { ModeratorRow } from './types';

export type UpdateModeratorPayload = { firstName?: string; lastName?: string; phone?: string; role?: string; isActive?: boolean };

export async function updateModerator(id: string, data: UpdateModeratorPayload): Promise<ModeratorRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update moderator');
  return j.data;
}

export async function deactivateModerator(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to deactivate moderator');
}
