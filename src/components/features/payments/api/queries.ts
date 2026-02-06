import type { PaymentDetailRes, PaymentsRes, PaymentStatus } from './types';

export async function fetchPayments(params: {
  status?: PaymentStatus;
  contractId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaymentsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.contractId) sp.set('contractId', params.contractId);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const res = await apiFetch(`/api/payments${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch payments');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch payments');
  return j;
}

export async function fetchPaymentDetail(paymentId: string): Promise<PaymentDetailRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/payments/${paymentId}`);
  if (!res.ok) throw new Error('Failed to fetch payment');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch payment');
  return j;
}
