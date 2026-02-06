/**
 * Agents feature - shared types
 */

export interface AgentRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: { quoteRequests: number; assignedQuotes: number };
}

export interface AgentsRes {
  success: boolean;
  data: AgentRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
