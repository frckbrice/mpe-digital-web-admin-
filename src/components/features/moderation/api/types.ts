export type ModerationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export interface ModerationUserRef {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface ModerationInvoiceRef {
  id: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

export interface ModerationContractRef {
  id: string;
  contractNumber?: string;
}

export interface ModerationQuoteRef {
  id: string;
  referenceNumber?: string;
}

export interface ModerationRequest {
  id: string;
  actionType: string;
  status: ModerationRequestStatus;
  invoiceId?: string | null;
  contractId?: string | null;
  quoteId?: string | null;
  requestedById?: string | null;
  moderatorId?: string | null;
  requestedAt?: string;
  decidedAt?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown>;
  invoice?: ModerationInvoiceRef;
  contract?: ModerationContractRef;
  quote?: ModerationQuoteRef;
  requestedBy?: ModerationUserRef;
  moderator?: ModerationUserRef | null;
}

export interface ModerationRequestsRes {
  success: boolean;
  message?: string;
  data: ModerationRequest[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface DecideModerationRequestBody {
  approved: boolean;
  comment?: string;
}

export interface DecideModerationRequestRes {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: ModerationRequestStatus;
    moderatorId?: string | null;
  };
}
