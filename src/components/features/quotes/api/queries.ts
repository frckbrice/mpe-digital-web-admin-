/**
 * Quotes Feature - Data Queries
 *
 * This module contains all query functions for fetching quote-related data.
 * All functions use the apiFetch utility which handles authentication and error handling.
 *
 * Query Functions:
 * - fetchQuotes: Fetches paginated list of quotes with filters (ADMIN endpoint)
 * - fetchAgentQuotes: Fetches quotes for agents/moderators (AGENT endpoint)
 * - fetchAgentsForQuotes: Fetches active agents for quote assignment dropdowns
 * - fetchClientsForQuotes: Fetches clients for quote filtering
 * - fetchQuoteDetail: Fetches detailed information for a specific quote
 * - fetchAgentsForDetail: Fetches agents for quote detail view
 */

import type { QuotesRes, AgentsRes, ClientsRes, QuoteDetail, QuoteDetailResult } from './types';

/**
 * Fetches a paginated list of quotes with optional filters
 *
 * Endpoint: GET /api/admin/quotes
 *
 * @param params - Query parameters for filtering and pagination
 * @param params.status - Optional quote status filter
 * @param params.assignedAgentId - Optional filter by assigned agent ID
 * @param params.clientId - Optional filter by client ID
 * @param params.search - Optional search query (searches in reference number, client name, etc.)
 * @param params.page - Page number (1-indexed)
 * @param params.pageSize - Number of items per page (default: 20)
 * @returns Promise resolving to QuotesRes with paginated quote data
 * @throws Error if the request fails or response is not successful
 */
export async function fetchQuotes(params: {
  status?: string;
  assignedAgentId?: string;
  clientId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuotesRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.assignedAgentId) sp.set('assignedAgentId', params.assignedAgentId);
  if (params.clientId) sp.set('clientId', params.clientId);
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/quotes?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch quotes');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch quotes');
  return json;
}

/** MODERATOR uses /api/agent/quotes (ADMIN uses /api/admin/quotes). Params: status, assignedToMe, page, pageSize. */
export async function fetchAgentQuotes(params: {
  status?: string;
  assignedToMe?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<QuotesRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.assignedToMe != null) sp.set('assignedToMe', String(params.assignedToMe));
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/agent/quotes?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch quotes');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch quotes');
  return json;
}

/**
 * Fetches active agents for use in quote assignment dropdowns
 *
 * Endpoint: GET /api/admin/users?role=AGENT&isActive=true&pageSize=100
 *
 * Used to populate agent selection dropdowns in quote management interfaces.
 * Only fetches active agents to ensure only valid assignments.
 *
 * @returns Promise resolving to AgentsRes with list of active agents
 * @throws Error if the request fails or response is not successful
 */
export async function fetchAgentsForQuotes(): Promise<AgentsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch agents');
  return json;
}

export async function fetchClientsForQuotes(): Promise<ClientsRes> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/agent/clients?pageSize=200');
  if (!res.ok) throw new Error('Failed to fetch clients');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch clients');
  return json;
}

/**
 * Fetches detailed information for a specific quote
 *
 * Endpoint: GET /api/admin/quotes/{id}
 *
 * Used by both ADMIN and MODERATOR so internal notes are included. Retrieves
 * comprehensive quote details including: quote metadata (status, priority, dates),
 * client and assigned agent, quote request details, related documents, message
 * thread, and internalNotes.
 *
 * @param id - Quote ID
 * @returns Promise resolving to { quote, etag }. Use etag as If-Match when calling PATCH validate/reject.
 * @throws Error if the request fails, response is not successful, or data is missing
 */
export async function fetchQuoteDetail(id: string): Promise<QuoteDetailResult> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch(`/api/admin/quotes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  const j = await res.json();
  if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch quote');
  const etag = res.headers.get('ETag') ?? null;
  return { quote: j.data, etag };
}

/**
 * Fetches active agents for quote detail view (assignment dropdown)
 *
 * Endpoint: GET /api/admin/users?role=AGENT&isActive=true&pageSize=100
 *
 * Similar to fetchAgentsForQuotes but returns a simplified array format
 * suitable for dropdown components in quote detail dialogs.
 *
 * @returns Promise resolving to array of agent objects with id, name, email, and active status
 * @throws Error if the request fails or response is not successful
 */
export async function fetchAgentsForDetail(): Promise<
  { id: string; firstName: string; lastName: string; email: string; isActive: boolean }[]
> {
  const { apiFetch } = await import('@/lib/api-client');
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch agents');
  return Array.isArray(j.data) ? j.data : [];
}
