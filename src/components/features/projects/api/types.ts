export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ProjectRow {
  id: string;
  status?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  contractId?: string | null;
  quoteId?: string | null;
  client?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  agent?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  progress?: number | null;
}

export interface ProjectsRes {
  success: boolean;
  message?: string;
  data: ProjectRow[];
  pagination?: Pagination;
}

export interface ProjectDetailRes {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}
