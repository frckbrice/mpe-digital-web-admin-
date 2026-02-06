import type { ContractDetailRes, ContractsRes, ContractVersionsRes } from './types';

export async function fetchContracts(params: {
  status?: string;
  quoteId?: string;
  page?: number;
  pageSize?: number;
}): Promise<ContractsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.quoteId) sp.set('quoteId', params.quoteId);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const res = await apiFetch(`/api/contracts${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch contracts');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch contracts');
  return j;
}

export async function fetchContractDetail(contractId: string): Promise<ContractDetailRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/contracts/${contractId}`);
  if (!res.ok) throw new Error('Failed to fetch contract');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch contract');
  return j;
}

export async function fetchContractVersions(contractId: string): Promise<ContractVersionsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/contracts/${contractId}/versions`);
  if (!res.ok) throw new Error('Failed to fetch contract versions');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch contract versions');
  return j;
}
