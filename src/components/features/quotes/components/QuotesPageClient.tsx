'use client';

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Search, MoreHorizontal, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { fetchQuotes, fetchAgentsForQuotes, fetchClientsForQuotes } from '../api/queries';
import type { QuoteRow, QuotesRes, AgentsRes } from '../api/types';
import { assignQuote } from '../api/mutations';
import { QUOTE_STATUSES } from '../api/data';
import { QuoteDetailDialog } from './QuoteDetailDialog';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'accent' {
  if (['SUBMITTED', 'UNDER_REVIEW', 'QUOTE_PREPARED', 'QUOTE_SENT', 'CLIENT_REVIEWING'].includes(s)) return 'secondary';
  if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(s)) return 'default';
  if (['REJECTED', 'CANCELLED'].includes(s)) return 'destructive';
  return 'outline';
}

function priorityVariant(p: string): 'default' | 'destructive' | 'accent' | 'outline' {
  if (p === 'URGENT') return 'destructive';
  if (p === 'HIGH') return 'accent';
  return 'outline';
}

export function QuotesPageClient() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [detailQuoteId, setDetailQuoteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = ['admin', 'quotes', status || null, assignedAgentId || null, clientId || null, search || null, page, pageSize];

  const { data: quotesData, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchQuotes({ status: status || undefined, assignedAgentId: assignedAgentId || undefined, clientId: clientId || undefined, search: search || undefined, page, pageSize }),
  });

  const { data: agentsData } = useQuery({ queryKey: ['admin', 'users', 'AGENT'], queryFn: fetchAgentsForQuotes });
  const { data: clientsData } = useQuery({ queryKey: ['agent', 'clients'], queryFn: fetchClientsForQuotes });

  const assignMu = useMutation({
    mutationFn: ({ quoteId, assignedAgentId }: { quoteId: string; assignedAgentId: string | null }) => assignQuote(quoteId, assignedAgentId),
    onMutate: async ({ quoteId, assignedAgentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<QuotesRes>(queryKey);
      const agents = (queryClient.getQueryData<AgentsRes>(['admin', 'users', 'AGENT'])?.data) ?? [];
      const agent = assignedAgentId ? agents.find((a) => a.id === assignedAgentId) ?? null : null;
      queryClient.setQueryData<QuotesRes>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((q) => q.id === quoteId ? { ...q, assignedAgentId, assignedAgent: agent ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email } : null } : q) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) queryClient.setQueryData(queryKey, context.previous); toast.error(t('dashboard.quotes.failedAssignment')); },
    onSuccess: (_, { assignedAgentId: aid }) => { toast.success(aid ? t('dashboard.quotes.quoteAssigned') : t('dashboard.quotes.quoteUnassigned')); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] }),
  });

  const handleSearch = useCallback(() => { setSearch(searchInput.trim()); setPagination((p) => ({ ...p, pageIndex: 0 })); }, [searchInput]);

  const agents = agentsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const quotes = quotesData?.data ?? [];
  const pag = quotesData?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      { id: 'referenceNumber', accessorKey: 'referenceNumber', header: t('common.reference'), cell: ({ row }) => <span className="font-mono text-sm">{row.original.referenceNumber}</span> },
      { id: 'client', accessorFn: (r) => `${r.client.firstName} ${r.client.lastName}`, header: t('common.client'), cell: ({ row }) => { const c = row.original.client; return <div><div className="text-sm">{c.firstName} {c.lastName}</div><div className="text-xs text-muted-foreground">{c.email}</div></div>; } },
      { id: 'status', accessorKey: 'status', header: t('common.status'), cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status.replace(/_/g, ' ')}</Badge> },
      { id: 'priority', accessorKey: 'priority', header: t('dashboard.quotes.priority'), cell: ({ row }) => <Badge variant={priorityVariant(row.original.priority)}>{row.original.priority}</Badge> },
      { id: 'assignedAgent', accessorFn: (r) => r.assignedAgent?.firstName, header: t('dashboard.quotes.agent'), cell: ({ row }) => { const a = row.original.assignedAgent; return a ? <span className="text-sm">{a.firstName} {a.lastName}</span> : <span className="text-muted-foreground text-sm">—</span>; } },
      { id: 'submissionDate', accessorKey: 'submissionDate', header: t('dashboard.stats.submitted'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{new Date(row.original.submissionDate).toLocaleDateString()}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const q = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailQuoteId(q.id)}><Eye className="mr-2 h-4 w-4" />{t('common.viewDetails')}</DropdownMenuItem>
                {agents.map((a) => (
                  <DropdownMenuItem key={a.id} onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: a.id })} disabled={assignMu.isPending || q.assignedAgentId === a.id}>
                    <UserPlus className="mr-2 h-4 w-4" />{t('common.assignTo', { name: `${a.firstName} ${a.lastName}` })}
                  </DropdownMenuItem>
                ))}
                {q.assignedAgentId && <DropdownMenuItem onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: null })} disabled={assignMu.isPending} className="text-muted-foreground">{t('common.unassign')}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [agents, assignMu, t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.quotes.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.quotes.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters')}</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.quotes.allStatuses')}</SelectItem>
                  {QUOTE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={assignedAgentId || 'all'} onValueChange={(v) => { setAssignedAgentId(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('common.assignedAgent')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.quotes.allAgents')}</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.firstName} {a.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={clientId || 'all'} onValueChange={(v) => { setClientId(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('common.client')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.quotes.allClients')}</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input placeholder={t('dashboard.quotes.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-64" />
              <Button variant="secondary" size="icon" onClick={handleSearch} aria-label={t('common.search')}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable<QuoteRow>
            columns={columns}
            data={quotes}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={(updater) => setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))}
            totalCount={totalCount}
            isLoading={isLoading}
            emptyMessage={t('dashboard.quotes.noQuotesFound')}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {detailQuoteId && <QuoteDetailDialog quoteId={detailQuoteId} onClose={() => setDetailQuoteId(null)} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] })} />}
    </div>
  );
}
