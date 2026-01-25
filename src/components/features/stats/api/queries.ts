/**
 * Stats feature - data queries
 */

import type { AdminStats } from './types';

export async function fetchStats(): Promise<AdminStats> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  const json = await res.json();
  if (!json.success || !json.data) throw new Error('Invalid stats response');
  return json.data;
}
