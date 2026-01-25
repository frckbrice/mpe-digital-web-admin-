'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface AdminStats {
  users: {
    total: number;
    clients: number;
    agents: number;
    admins: number;
    active: number;
    newLast30Days: number;
  };
  quotes: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    newLast30Days: number;
  };
  messages: {
    total: number;
    unread: number;
    newLast30Days: number;
  };
  documents: { total: number };
  recentQuotes: Array<{
    id: string;
    referenceNumber: string;
    status: string;
    submissionDate: string;
    client?: { firstName: string; lastName: string; email: string };
  }>;
}

async function fetchStats(): Promise<AdminStats> {
  const res = await apiFetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  const json = await res.json();
  if (!json.success || !json.data) throw new Error('Invalid stats response');
  return json.data;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
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
        Failed to load statistics. Ensure the MPE Web app is running and NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_LOCAL_APP_URL are correct.
      </div>
    );
  }

  const { users, quotes, messages, documents, recentQuotes } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">Admin dashboard statistics from the MPE Web app</p>
      </div>

      {/* Users */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Total" value={users.total} sub={`${users.newLast30Days} new (30d)`} icon={Users} />
          <StatCard title="Clients" value={users.clients} icon={UserCheck} />
          <StatCard title="Agents" value={users.agents} icon={UserCog} />
          <StatCard title="Admins" value={users.admins} icon={Shield} />
          <StatCard title="Active" value={users.active} icon={TrendingUp} />
          <StatCard title="New (30d)" value={users.newLast30Days} icon={TrendingUp} />
        </div>
      </div>

      {/* Quotes */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quote requests
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total" value={quotes.total} sub={`${quotes.newLast30Days} new (30d)`} icon={FileText} />
          <StatCard title="Pending" value={quotes.pending} sub="Submitted" icon={Clock} />
          <StatCard title="In progress" value={quotes.inProgress} icon={ArrowRight} />
          <StatCard title="Completed" value={quotes.completed} icon={CheckCircle} />
          <StatCard title="New (30d)" value={quotes.newLast30Days} icon={TrendingUp} />
        </div>
      </div>

      {/* Messages & Documents */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total" value={messages.total} icon={MessageSquare} />
            <StatCard title="Unread" value={messages.unread} icon={MessageSquare} />
            <StatCard title="New (30d)" value={messages.newLast30Days} icon={TrendingUp} />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Documents
          </h2>
          <StatCard title="Total documents" value={documents.total} icon={FolderOpen} />
        </div>
      </div>

      {/* Recent quotes table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent quote requests</CardTitle>
          <p className="text-sm text-muted-foreground">Last 10 submitted</p>
        </CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent quotes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Reference</th>
                    <th className="text-left py-2 font-medium">Client</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0">
                      <td className="py-2 font-mono text-muted-foreground">{q.referenceNumber}</td>
                      <td className="py-2">
                        {q.client
                          ? `${q.client.firstName} ${q.client.lastName}`
                          : '—'}
                      </td>
                      <td className="py-2 capitalize">{q.status.toLowerCase().replace('_', ' ')}</td>
                      <td className="py-2 text-muted-foreground">
                        {q.submissionDate
                          ? new Date(q.submissionDate).toLocaleDateString()
                          : '—'}
                      </td>
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
