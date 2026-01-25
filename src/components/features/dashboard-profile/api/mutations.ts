/**
 * Dashboard profile feature - mutations
 */

export type UpdateProfilePayload = { firstName: string; lastName: string; phone: string | null };

export interface ProfileUpdateResponse {
  user?: { id: string; email: string; firstName: string; lastName: string; phone: string | null; role: string; isActive: boolean; isVerified: boolean; profilePicture?: string };
  message?: string;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<ProfileUpdateResponse> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { message?: string }).message || 'Failed to update profile');
  if (!j.user) throw new Error((j as { message?: string }).message || 'Failed to update profile');
  return j;
}
