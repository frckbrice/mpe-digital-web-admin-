/**
 * Dashboard home feature - data queries
 */

import type { AdminStats } from './types';

export async function fetchAdminStats(): Promise<AdminStats> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/stats');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || 'Failed to fetch stats';
    throw new Error(msg);
  }
  if (!json.success || !json.data) throw new Error('Invalid stats response');
  return json.data;
}
