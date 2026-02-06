import type { ModerationDecisionsRes } from './types';

export async function fetchModerationDecisions(params: {
  entityType?: string;
  entityId?: string;
  actionType?: string;
  moderatorId?: string;
  page?: number;
  pageSize?: number;
}): Promise<ModerationDecisionsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.entityType) sp.set('entityType', params.entityType);
  if (params.entityId) sp.set('entityId', params.entityId);
  if (params.actionType) sp.set('actionType', params.actionType);
  if (params.moderatorId) sp.set('moderatorId', params.moderatorId);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const res = await apiFetch(`/api/admin/moderation-decisions?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch moderation decisions');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch moderation decisions');
  return j;
}
