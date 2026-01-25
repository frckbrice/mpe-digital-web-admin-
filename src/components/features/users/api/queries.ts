/**
 * Users feature - data queries
 */

import type { UserRow, UsersRes } from './types';

export async function fetchUsers(params: { role?: string; search?: string; isActive?: string; page?: number; pageSize?: number }): Promise<UsersRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.role) sp.set('role', params.role);
  if (params.search) sp.set('search', params.search);
  if (params.isActive) sp.set('isActive', params.isActive);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/users?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch users');
  return j;
}

export async function fetchUserDetail(userId: string): Promise<UserRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch user');
  return j.data;
}
