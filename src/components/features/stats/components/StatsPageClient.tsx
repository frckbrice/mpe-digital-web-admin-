'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import {
  Loader2,
  Users,
  FileText,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  UserCheck,
  UserCog,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { fetchStats } from '../api/queries';

export function StatsPageClient() {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchStats,
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
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {t('dashboard.stats.failedLoadStats')} {t('common.ensureAppRunning')}
      </div>
    );
  }

  const { users, quotes, messages, documents, recentQuotes } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.stats.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.stats.subtitle')}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" />{t('dashboard.stats.users')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title={t('dashboard.stats.total')} value={users.total} sub={`${users.newLast30Days} ${t('dashboard.stats.new30d')}`} icon={Users} />
          <StatCard title={t('dashboard.home.clients')} value={users.clients} icon={UserCheck} />
          <StatCard title={t('dashboard.home.agents')} value={users.agents} icon={UserCog} />
          <StatCard title={t('dashboard.home.admins')} value={users.admins} icon={Shield} />
          <StatCard title={t('dashboard.stats.active')} value={users.active} icon={TrendingUp} />
          <StatCard title={t('dashboard.stats.new30d')} value={users.newLast30Days} icon={TrendingUp} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />{t('dashboard.stats.quoteRequests')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title={t('dashboard.stats.total')} value={quotes.total} sub={`${quotes.newLast30Days} ${t('dashboard.stats.new30d')}`} icon={FileText} />
          <StatCard title={t('dashboard.home.pending')} value={quotes.pending} sub={t('dashboard.stats.submitted')} icon={Clock} />
          <StatCard title={t('dashboard.stats.inProgress')} value={quotes.inProgress} icon={ArrowRight} />
          <StatCard title={t('dashboard.stats.completed')} value={quotes.completed} icon={CheckCircle} />
          <StatCard title={t('dashboard.stats.new30d')} value={quotes.newLast30Days} icon={TrendingUp} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5" />{t('dashboard.stats.messages')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title={t('dashboard.stats.total')} value={messages.total} icon={MessageSquare} />
            <StatCard title={t('dashboard.home.unread')} value={messages.unread} icon={MessageSquare} />
            <StatCard title={t('dashboard.stats.new30d')} value={messages.newLast30Days} icon={TrendingUp} />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FolderOpen className="h-5 w-5" />{t('dashboard.stats.documents')}</h2>
          <StatCard title={t('dashboard.stats.totalDocuments')} value={documents.total} icon={FolderOpen} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.stats.recentQuoteRequests')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('dashboard.stats.last10Submitted')}</p>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.stats.noRecentQuotes')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">{t('dashboard.stats.reference')}</th>
                    <th className="text-left py-2 font-medium">{t('dashboard.stats.client')}</th>
                    <th className="text-left py-2 font-medium">{t('common.status')}</th>
                    <th className="text-left py-2 font-medium">{t('dashboard.stats.submitted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0">
                      <td className="py-2 font-mono text-muted-foreground">{q.referenceNumber}</td>
                      <td className="py-2">{q.client ? `${q.client.firstName} ${q.client.lastName}` : '—'}</td>
                      <td className="py-2 capitalize">{q.status.toLowerCase().replace('_', ' ')}</td>
                      <td className="py-2 text-muted-foreground">{q.submissionDate ? new Date(q.submissionDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
