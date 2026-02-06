import type { InvoiceDetailRes, InvoicesRes } from './types';

export async function fetchInvoices(params: {
  status?: string;
  contractId?: string;
  quoteId?: string;
  page?: number;
  pageSize?: number;
}): Promise<InvoicesRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.contractId) sp.set('contractId', params.contractId);
  if (params.quoteId) sp.set('quoteId', params.quoteId);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const res = await apiFetch(`/api/invoices${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch invoices');
  return j;
}

export async function fetchInvoiceDetail(invoiceId: string): Promise<InvoiceDetailRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/invoices/${invoiceId}`);
  if (!res.ok) throw new Error('Failed to fetch invoice');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch invoice');
  return j;
}
