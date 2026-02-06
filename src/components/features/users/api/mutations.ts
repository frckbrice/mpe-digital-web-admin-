/**
 * Users feature - mutations
 */

import type { UserRow } from './types';

export type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
};
export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
};

export async function createUser(data: CreateUserPayload): Promise<UserRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to create user');
  return j.data;
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<UserRow> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update user');
  return j.data;
}

export async function deactivateUser(id: string): Promise<void> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to deactivate user');
}
