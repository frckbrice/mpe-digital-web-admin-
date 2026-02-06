import type { DecideModerationRequestBody, DecideModerationRequestRes } from './types';

export async function decideModerationRequest(
  requestId: string,
  body: DecideModerationRequestBody
): Promise<DecideModerationRequestRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/moderation/requests/${requestId}/decide`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success)
    throw new Error(j.message || j.error || 'Failed to decide moderation request');
  return j;
}
