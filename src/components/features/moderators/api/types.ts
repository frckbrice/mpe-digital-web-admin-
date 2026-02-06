/**
 * Moderators feature - shared types
 */

export interface ModeratorRow {
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

export interface ModeratorsRes {
  success: boolean;
  data: ModeratorRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
