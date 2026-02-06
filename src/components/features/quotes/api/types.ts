/**
 * Quotes feature - shared types
 */

/** Attachment metadata for message/email (after upload). */
export interface MessageAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt?: string;
}

export interface QuoteRow {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  submissionDate: string;
  lastUpdated: string;
  assignedAgentId: string | null;
  projectDescription: string;
  client: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  assignedAgent: { id: string; firstName: string; lastName: string; email: string } | null;
  documents: { id: string; fileName: string; status: string }[];
  _count: { messages: number };
}

export interface QuotesRes {
  success: boolean;
  data: QuoteRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AgentsRes {
  success: boolean;
  data: { id: string; firstName: string; lastName: string; email: string; role?: string }[];
}

export interface ClientsRes {
  success: boolean;
  data: { id: string; firstName: string; lastName: string; email: string; phone?: string }[];
  pagination?: { totalCount: number };
}

export interface QuoteDetail {
  id: string;
  referenceNumber: string;
  status: string;
  priority: string;
  submissionDate: string;
  lastUpdated: string;
  internalNotes: string | null;
  estimatedCompletion: string | null;
  requesterType: string | null;
  name: string;
  company: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  country: string | null;
  requestType: string | null;
  projectDescription: string;
  desiredStartDate: string | null;
  desiredDuration: string | null;
  siteType: string | null;
  scope: string | null;
  exampleSites: string[] | null;
  responsive: boolean;
  useLogoColors: boolean;
  hasHosting: boolean;
  hostingDetails: string | null;
  budgetFixed: boolean;
  budgetAmount: string | null;
  client: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  assignedAgent: { id: string; firstName: string; lastName: string; email: string } | null;
  documents: {
    id: string;
    fileName: string;
    originalName: string;
    documentType: string;
    status: string;
    uploadDate: string;
    uploadedBy?: { firstName: string; lastName: string };
  }[];
  messages: {
    id: string;
    subject: string | null;
    content: string;
    sentAt: string;
    readAt?: string | null;
    sender: { id?: string; firstName: string; lastName: string; email: string };
    recipient: { id?: string; firstName: string; lastName: string; email: string };
  }[];
  statusHistory?: {
    id: string;
    status: string;
    notes: string | null;
    timestamp: string;
    changedBy: string;
  }[];
}

/** Result of GET /api/admin/quotes/[id] — quote data plus ETag for If-Match on validate/reject. */
export interface QuoteDetailResult {
  quote: QuoteDetail;
  etag: string | null;
}
