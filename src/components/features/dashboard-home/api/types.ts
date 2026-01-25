/**
 * Dashboard home feature - shared types
 */

export interface AdminStats {
  users: { total: number; clients: number; agents: number; admins: number; active: number; newLast30Days: number };
  quotes: { total: number; pending: number; inProgress: number; completed: number; newLast30Days: number };
  messages: { total: number; unread: number; newLast30Days: number };
  documents: { total: number };
  recentQuotes: Array<{
    id: string;
    referenceNumber: string;
    status: string;
    submissionDate: string;
    client?: { firstName: string; lastName: string; email: string };
  }>;
}
