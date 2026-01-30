'use client';

/**
 * Component: DashboardPageClient
 * 
 * Main dashboard home page component that displays an overview of key statistics
 * and metrics for administrators and moderators.
 * 
 * Features:
 * - Displays summary statistics (users, quotes, messages, documents)
 * - Shows quote status breakdown
 * - Auto-refreshes statistics every 60 seconds
 * - Loading and error states
 * - Internationalization support
 * 
 * Data Flow:
 * - Fetches statistics from /api/admin/stats endpoint
 * - Uses React Query with automatic refetch interval
 * - Displays data in stat cards and breakdown sections
 * 
 * Statistics Displayed:
 * - Total users (all roles)
 * - Total quotes
 * - Total messages
 * - Total documents
 * - Quote status breakdown (submitted, in progress, completed, etc.)
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Loader2, Users, FileText, MessageSquare, FolderOpen, TrendingUp } from 'lucide-react';
import { fetchAdminStats } from '../api/queries';

/**
 * Maps quote status to its translation key for i18n
 * @param status - Quote status string
 * @returns Translation key for the status
 */
function getStatusTranslationKey(status: string): string {
  const statusMap: Record<string, string> = {
    SUBMITTED: 'dashboard.quotes.statusSubmitted',
    UNDER_REVIEW: 'dashboard.quotes.statusUnderReview',
    QUOTE_PREPARED: 'dashboard.quotes.statusQuotePrepared',
    QUOTE_SENT: 'dashboard.quotes.statusQuoteSent',
    CLIENT_REVIEWING: 'dashboard.quotes.statusClientReviewing',
    ACCEPTED: 'dashboard.quotes.statusAccepted',
    REJECTED: 'dashboard.quotes.statusRejected',
    IN_PROGRESS: 'dashboard.quotes.statusInProgress',
    COMPLETED: 'dashboard.quotes.statusCompleted',
    CANCELLED: 'dashboard.quotes.statusCancelled',
  };
  return statusMap[status] || status;
}

/**
 * Dashboard Home Page Component
 * 
 * Renders the main dashboard overview with statistics cards and quote status breakdown.
 * Automatically refreshes data every 60 seconds to keep statistics up-to-date.
 */
export function DashboardPageClient() {
  const { t } = useTranslation();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    const msg = error?.message || `${t('dashboard.home.failedLoadStats')} ${t('common.ensureAppRunning')}`;
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {msg}
      </div>
    );
  }

  const { users, quotes, messages, documents, recentQuotes } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.home.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.home.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('dashboard.home.totalUsers')} value={users.total} sub={`${users.newLast30Days} ${t('dashboard.home.new30d')}`} icon={Users} />
        <StatCard title={t('dashboard.home.quoteRequests')} value={quotes.total} sub={`${quotes.pending} ${t('dashboard.home.pending')}, ${quotes.inProgress} ${t('dashboard.home.inProgress')}`} icon={FileText} />
        <StatCard title={t('dashboard.home.messages')} value={messages.total} sub={`${messages.unread} ${t('dashboard.home.unread')}`} icon={MessageSquare} />
        <StatCard title={t('dashboard.home.documents')} value={documents.total} icon={FolderOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('dashboard.home.users30d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.home.clients')}</span>
                <span>{users.clients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.home.agents')}</span>
                <span>{users.agents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.home.admins')}</span>
                <span>{users.admins}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.home.recentQuoteRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.home.noRecentQuotes')}</p>
            ) : (
              <ul className="text-sm space-y-2">
                {recentQuotes.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                    <span className="font-mono text-muted-foreground">{q.referenceNumber}</span>
                    <span>{t(getStatusTranslationKey(q.status))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
