/**
 * Moderators feature - data queries
 */

import type { ModeratorRow, ModeratorsRes } from './types';

export async function fetchModerators(params: { search?: string; isActive?: string; page?: number; pageSize?: number }): Promise<ModeratorsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.isActive) sp.set('isActive', params.isActive);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const qs = sp.toString();
  const res = await apiFetch(`/api/admin/moderators${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch moderators');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch moderators');
  return j;
}

export async function fetchModeratorDetail(userId: string): Promise<ModeratorRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch moderator');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch moderator');
  return j.data;
}
