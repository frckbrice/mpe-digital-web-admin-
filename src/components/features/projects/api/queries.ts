import type { ProjectDetailRes, ProjectsRes } from './types';

export async function fetchProjects(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProjectsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const res = await apiFetch(`/api/projects${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch projects');
  return j;
}

export async function fetchProjectDetail(projectId: string): Promise<ProjectDetailRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/projects/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch project');
  return j;
}
