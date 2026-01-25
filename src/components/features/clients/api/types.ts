/**
 * Clients feature - shared types
 */

export interface ClientRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  lastLogin?: string | null;
  createdAt: string;
  _count?: { quoteRequests?: number; assignedQuotes?: number };
}

export interface ClientsRes {
  success: boolean;
  data: ClientRow[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}
