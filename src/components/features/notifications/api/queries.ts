/**
 * Notifications – GET /api/notifications, GET /api/notifications/count
 */

import type { NotificationsRes } from './types';

export async function fetchNotifications(params: { page?: number; pageSize?: number }): Promise<NotificationsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const qs = sp.toString();
  const res = await apiFetch(`/api/notifications${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch notifications');
  return j;
}

export async function fetchUnreadCount(): Promise<number> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/notifications/count');
  if (!res.ok) return 0;
  const j = await res.json().catch(() => ({}));
  return typeof j.count === 'number' ? j.count : (j.data?.count ?? 0);
}
