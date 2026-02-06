export type PaymentStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | string;

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaymentProof {
  id: string;
  filePath: string; // Cloudinary secure_url (view/download)
  originalName?: string;
  fileName?: string;
  status?: string;
  uploadDate?: string;
}

export interface PaymentRow {
  id: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  createdAt?: string;
  contractId?: string | null;
  invoiceId?: string | null;
  // New (recommended): proof metadata from backend
  paymentProofId?: string | null;
  paymentProof?: PaymentProof | null;
  // Legacy fallback (if some environments still return a flat URL)
  proofUrl?: string | null;
  payer?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  invoice?: { id: string; invoiceNumber?: string; status?: string } | null;
  contract?: { id: string; contractNumber?: string; status?: string } | null;
}

export interface PaymentsRes {
  success: boolean;
  message?: string;
  data: PaymentRow[];
  pagination?: Pagination;
}

export interface PaymentDetail {
  id: string;
  status?: PaymentStatus;
  amount?: number;
  currency?: string;
  createdAt?: string;
  contractId?: string | null;
  invoiceId?: string | null;
  paymentProofId?: string | null;
  paymentProof?: PaymentProof | null;
  // Legacy fallback
  proofUrl?: string | null;
  rejectionReason?: string | null;
}

export interface PaymentDetailRes {
  success: boolean;
  message?: string;
  data?: PaymentDetail;
}

export interface ValidatePaymentBody {
  validated: boolean;
  rejectionReason?: string;
}

export interface ValidatePaymentRes {
  success: boolean;
  message?: string;
  data?: { id: string; status: PaymentStatus };
}
