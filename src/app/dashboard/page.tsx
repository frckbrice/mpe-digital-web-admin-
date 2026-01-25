'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileText, MessageSquare, FolderOpen, TrendingUp } from 'lucide-react';

interface AdminStats {
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

async function fetchStats(): Promise<AdminStats> {
  const res = await apiFetch('/api/admin/stats');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || 'Failed to fetch stats';
    throw new Error(msg);
  }
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

export default function DashboardPage() {
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
    const msg = error?.message || 'Failed to load dashboard stats. Ensure the MPE Web app is running and NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_LOCAL_APP_URL are correct.';
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of MPE Web app</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={users.total} sub={`${users.newLast30Days} new (30d)`} icon={Users} />
        <StatCard title="Quote Requests" value={quotes.total} sub={`${quotes.pending} pending, ${quotes.inProgress} in progress`} icon={FileText} />
        <StatCard title="Messages" value={messages.total} sub={`${messages.unread} unread`} icon={MessageSquare} />
        <StatCard title="Documents" value={documents.total} icon={FolderOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Users (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clients</span>
                <span>{users.clients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agents</span>
                <span>{users.agents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admins</span>
                <span>{users.admins}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent quote requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent quotes</p>
            ) : (
              <ul className="text-sm space-y-2">
                {recentQuotes.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                    <span className="font-mono text-muted-foreground">{q.referenceNumber}</span>
                    <span className="capitalize">{q.status.toLowerCase().replace('_', ' ')}</span>
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
