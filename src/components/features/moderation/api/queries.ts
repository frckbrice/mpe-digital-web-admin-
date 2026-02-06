import type { ModerationRequestsRes, ModerationRequestStatus } from './types';

export async function fetchModerationRequests(params: {
  status?: ModerationRequestStatus;
  page?: number;
  pageSize?: number;
}): Promise<ModerationRequestsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const res = await apiFetch(`/api/moderation/requests${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch moderation requests');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch moderation requests');
  return j;
}
