/**
 * Notifications – PATCH /api/notifications/[id]/read, PATCH /api/notifications/read-all
 */

export async function markNotificationRead(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 204)
    throw new Error(j.message || j.error || 'Failed to mark as read');
}

export async function markAllNotificationsRead(): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
  const j = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 204)
    throw new Error(j.message || j.error || 'Failed to mark all as read');
}
