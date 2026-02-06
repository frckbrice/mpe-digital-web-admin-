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

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import {
  BarChart2,
  CreditCard,
  FileSignature,
  FileText,
  FolderKanban,
  FolderOpen,
  ListChecks,
  Loader2,
  MessageSquare,
  Receipt,
  ShieldCheck,
  TrendingUp,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { fetchAdminStats } from '../api/queries';
import { useAuthStore } from '@/components/features/auth';
import { fetchAgentQuotes } from '@/components/features/quotes/api/queries';

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

type QuickLinkItem = {
  href: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLinkCard({ href, title, description, icon: Icon }: QuickLinkItem) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:bg-accent/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        {description ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}

/**
 * Dashboard Home Page Component
 *
 * Renders the main dashboard overview with statistics cards and quote status breakdown.
 * Automatically refreshes data every 60 seconds to keep statistics up-to-date.
 */
export function DashboardPageClient() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isModerator = user?.role === 'MODERATOR';

  const quickLinks: QuickLinkItem[] = isModerator
    ? [
        {
          href: '/dashboard/moderation',
          title: t('dashboard.home.quickLinkModerationTitle'),
          description: t('dashboard.home.quickLinkModerationDescription'),
          icon: ShieldCheck,
        },
        {
          href: '/dashboard/payments',
          title: t('dashboard.home.quickLinkPaymentsTitle'),
          description: t('dashboard.home.quickLinkPaymentsDescription'),
          icon: CreditCard,
        },
        {
          href: '/dashboard/audit',
          title: t('dashboard.home.quickLinkAuditTitle'),
          description: t('dashboard.home.quickLinkAuditDescription'),
          icon: ListChecks,
        },
        { href: '/dashboard/quotes', title: t('dashboard.layout.navQuotes'), icon: FileText },
        { href: '/dashboard/clients', title: t('dashboard.layout.navClients'), icon: User },
        { href: '/dashboard/agents', title: t('dashboard.layout.navAgents'), icon: UserCog },
        { href: '/dashboard/users', title: t('dashboard.layout.navUsers'), icon: Users },
        {
          href: '/dashboard/projects',
          title: t('dashboard.layout.navProjects'),
          icon: FolderKanban,
        },
        {
          href: '/dashboard/contracts',
          title: t('dashboard.layout.navContracts'),
          icon: FileSignature,
        },
        { href: '/dashboard/invoices', title: t('dashboard.layout.navInvoices'), icon: Receipt },
      ]
    : [
        {
          href: '/dashboard/moderation',
          title: t('dashboard.home.quickLinkModerationTitle'),
          description: t('dashboard.home.quickLinkModerationDescription'),
          icon: ShieldCheck,
        },
        {
          href: '/dashboard/payments',
          title: t('dashboard.home.quickLinkPaymentsTitle'),
          description: t('dashboard.home.quickLinkPaymentsDescription'),
          icon: CreditCard,
        },
        {
          href: '/dashboard/audit',
          title: t('dashboard.home.quickLinkAuditTitle'),
          description: t('dashboard.home.quickLinkAuditDescription'),
          icon: ListChecks,
        },
        { href: '/dashboard/stats', title: t('dashboard.layout.navStats'), icon: BarChart2 },
        { href: '/dashboard/quotes', title: t('dashboard.layout.navQuotes'), icon: FileText },
        { href: '/dashboard/clients', title: t('dashboard.layout.navClients'), icon: User },
        { href: '/dashboard/agents', title: t('dashboard.layout.navAgents'), icon: UserCog },
        { href: '/dashboard/users', title: t('dashboard.layout.navUsers'), icon: Users },
        {
          href: '/dashboard/moderators',
          title: t('dashboard.layout.navModerators'),
          icon: UserCog,
        },
        {
          href: '/dashboard/projects',
          title: t('dashboard.layout.navProjects'),
          icon: FolderKanban,
        },
        {
          href: '/dashboard/contracts',
          title: t('dashboard.layout.navContracts'),
          icon: FileSignature,
        },
        { href: '/dashboard/invoices', title: t('dashboard.layout.navInvoices'), icon: Receipt },
      ];

  const adminStatsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
    enabled: !isModerator,
  });

  // Moderator dashboard uses allowed endpoints only (no /api/admin/stats).
  const moderatorQuotesQuery = useQuery({
    queryKey: ['agent', 'quotes', 'dashboard', 1, 10],
    queryFn: () => fetchAgentQuotes({ page: 1, pageSize: 10 }),
    refetchInterval: 60_000,
    enabled: isModerator,
  });
  const moderatorSubmittedCountQuery = useQuery({
    queryKey: ['agent', 'quotes', 'count', 'SUBMITTED'],
    queryFn: () => fetchAgentQuotes({ status: 'SUBMITTED', page: 1, pageSize: 1 }),
    refetchInterval: 60_000,
    enabled: isModerator,
  });
  const moderatorUnderReviewCountQuery = useQuery({
    queryKey: ['agent', 'quotes', 'count', 'UNDER_REVIEW'],
    queryFn: () => fetchAgentQuotes({ status: 'UNDER_REVIEW', page: 1, pageSize: 1 }),
    refetchInterval: 60_000,
    enabled: isModerator,
  });
  const moderatorInProgressCountQuery = useQuery({
    queryKey: ['agent', 'quotes', 'count', 'IN_PROGRESS'],
    queryFn: () => fetchAgentQuotes({ status: 'IN_PROGRESS', page: 1, pageSize: 1 }),
    refetchInterval: 60_000,
    enabled: isModerator,
  });

  const isLoading = isModerator ? moderatorQuotesQuery.isLoading : adminStatsQuery.isLoading;
  const error = isModerator ? moderatorQuotesQuery.error : adminStatsQuery.error;
  const stats = adminStatsQuery.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isModerator) {
    if (error || !moderatorQuotesQuery.data) {
      const msg =
        (error as any)?.message ||
        `${t('dashboard.home.failedLoadStats')} ${t('common.ensureAppRunning')}`;
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {msg}
        </div>
      );
    }

    const quotesRes = moderatorQuotesQuery.data;
    const totalQuotes = quotesRes.pagination?.totalCount ?? 0;
    const submittedCount = moderatorSubmittedCountQuery.data?.pagination?.totalCount ?? 0;
    const underReviewCount = moderatorUnderReviewCountQuery.data?.pagination?.totalCount ?? 0;
    const inProgressCount = moderatorInProgressCountQuery.data?.pagination?.totalCount ?? 0;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.home.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.home.moderatorSubtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t('dashboard.home.quoteRequests')} value={totalQuotes} icon={FileText} />
          <StatCard title={t('dashboard.stats.submitted')} value={submittedCount} icon={FileText} />
          <StatCard
            title={t('dashboard.quotes.statusUnderReview')}
            value={underReviewCount}
            icon={TrendingUp}
          />
          <StatCard
            title={t('dashboard.stats.inProgress')}
            value={inProgressCount}
            icon={TrendingUp}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('dashboard.home.quickLinks')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickLinks.map((l) => (
              <QuickLinkCard key={l.href} {...l} />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.home.recentQuoteRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            {quotesRes.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.home.noRecentQuotes')}</p>
            ) : (
              <ul className="text-sm space-y-2">
                {quotesRes.data.slice(0, 5).map((q) => (
                  <li
                    key={q.id}
                    className="flex justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span className="font-mono text-muted-foreground">{q.referenceNumber}</span>
                    <span>{t(getStatusTranslationKey(q.status))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    const msg =
      (error as any)?.message ||
      `${t('dashboard.home.failedLoadStats')} ${t('common.ensureAppRunning')}`;
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
        <StatCard
          title={t('dashboard.home.totalUsers')}
          value={users.total}
          sub={`${users.newLast30Days} ${t('dashboard.home.new30d')}`}
          icon={Users}
        />
        <StatCard
          title={t('dashboard.home.quoteRequests')}
          value={quotes.total}
          sub={`${quotes.pending} ${t('dashboard.home.pending')}, ${quotes.inProgress} ${t('dashboard.home.inProgress')}`}
          icon={FileText}
        />
        <StatCard
          title={t('dashboard.home.messages')}
          value={messages.total}
          sub={`${messages.unread} ${t('dashboard.home.unread')}`}
          icon={MessageSquare}
        />
        <StatCard title={t('dashboard.home.documents')} value={documents.total} icon={FolderOpen} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t('dashboard.home.quickLinks')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((l) => (
            <QuickLinkCard key={l.href} {...l} />
          ))}
        </div>
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
                  <li
                    key={q.id}
                    className="flex justify-between border-b border-border pb-2 last:border-0"
                  >
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
