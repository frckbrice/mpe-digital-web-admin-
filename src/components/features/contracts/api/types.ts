export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ContractRow {
  id: string;
  contractNumber?: string;
  status?: string;
  quoteId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  client?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  agent?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
}

export interface ContractsRes {
  success: boolean;
  message?: string;
  data: ContractRow[];
  pagination?: Pagination;
}

export interface ContractDetailRes {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface ContractVersionsRes {
  success: boolean;
  message?: string;
  data?: unknown;
}
