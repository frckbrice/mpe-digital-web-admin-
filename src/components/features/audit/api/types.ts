export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ModerationDecisionRow {
  id: string;
  moderatorId: string;
  actionType: string;
  decision: 'APPROVED' | 'REJECTED' | string;
  entityType: string;
  entityId: string;
  comment?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  moderator?: { id: string; email?: string; firstName?: string; lastName?: string; role?: string };
}

export interface ModerationDecisionsRes {
  success: boolean;
  message?: string;
  data: ModerationDecisionRow[];
  pagination: Pagination;
}
