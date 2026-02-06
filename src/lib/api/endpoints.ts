/**
 * API endpoints used by the MPE Web Admin app.
 * All requests go to the MPE Web app (base URL from getMpeWebAppBaseUrl).
 *
 * ## Admin quote APIs (ADMIN + MODERATOR)
 * - GET /api/admin/quotes - list quotes (ADMIN + MODERATOR; same data including internalNotes in detail)
 * - GET /api/admin/quotes/[id] - quote detail with internalNotes (ADMIN + MODERATOR)
 * - /api/admin/quotes/[id]/assign - assign/unassign (ADMIN + MODERATOR)
 * - /api/admin/quotes/[id]/validate - validate/reject quote (ADMIN + MODERATOR)
 *
 * ## Admin-only (ADMIN role)
 * - /api/admin/users - list, create users
 * - /api/admin/users/[id] - get, update, deactivate user (MODERATOR: no deactivate)
 * - /api/admin/stats - dashboard stats (MODERATOR cannot access)
 * - /api/admin/settings - get/update admin settings
 *
 * ## Shared (ADMIN, MODERATOR, AGENT) – role-based logic on the server
 * - /api/agent/quotes - list quotes (AGENT: assigned + unassigned)
 * - /api/agent/quotes/[id] - PATCH status/priority/internalNotes (ADMIN, MODERATOR, AGENT)
 * - /api/agent/clients - list clients (for filters, e.g. clientId on quotes)
 *
 * ## Auth (shared)
 * - /api/auth/me - current user (GET, Bearer)
 * - /api/auth/google - Google sign-in (POST)
 * - /api/auth/logout - logout (POST)
 */

export const AdminEndpoints = {
  quotes: () => '/api/admin/quotes',
  quoteAssign: (id: string) => `/api/admin/quotes/${id}/assign`,
  quoteValidate: (id: string) => `/api/admin/quotes/${id}/validate`,
  users: () => '/api/admin/users',
  user: (id: string) => `/api/admin/users/${id}`,
  stats: () => '/api/admin/stats',
  settings: () => '/api/admin/settings',
} as const;

/** Shared agent+admin; admin has full access, agent is restricted to assigned quotes. */
export const AgentEndpoints = {
  quotes: () => '/api/agent/quotes',
  quote: (id: string) => `/api/agent/quotes/${id}`,
  clients: () => '/api/agent/clients',
} as const;

export const AuthEndpoints = {
  me: () => '/api/auth/me',
  profile: () => '/api/auth/profile',
  google: () => '/api/auth/google',
  logout: () => '/api/auth/logout',
} as const;
