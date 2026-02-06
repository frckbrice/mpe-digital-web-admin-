export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber?: string;
  status?: string;
  amount?: number;
  currency?: string;
  contractId?: string | null;
  quoteId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  client?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
}

export interface InvoicesRes {
  success: boolean;
  message?: string;
  data: InvoiceRow[];
  pagination?: Pagination;
}

export interface InvoiceDetailRes {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}
