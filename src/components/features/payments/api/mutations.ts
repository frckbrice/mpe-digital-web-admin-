import type { ValidatePaymentBody, ValidatePaymentRes } from './types';

export async function validatePayment(
  paymentId: string,
  body: ValidatePaymentBody
): Promise<ValidatePaymentRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/payments/${paymentId}/validate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success)
    throw new Error(j.message || j.error || 'Failed to validate/reject payment');
  return j;
}
