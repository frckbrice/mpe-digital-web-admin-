'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Search, MoreHorizontal, Eye, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { QuoteDetailDialog } from './QuoteDetailDialog';

const QUOTE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'QUOTE_PREPARED',
  'QUOTE_SENT',
  'CLIENT_REVIEWING',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

type QuoteStatus = (typeof QUOTE_STATUSES)[number];

interface QuoteRow {
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

interface QuotesRes {
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

interface AgentsRes {
  success: boolean;
  data: { id: string; firstName: string; lastName: string; email: string; role: string }[];
}

interface ClientsRes {
  success: boolean;
  data: { id: string; firstName: string; lastName: string; email: string; phone?: string }[];
  pagination?: { totalCount: number };
}

async function fetchQuotes(params: {
  status?: string;
  assignedAgentId?: string;
  clientId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuotesRes> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.assignedAgentId) sp.set('assignedAgentId', params.assignedAgentId);
  if (params.clientId) sp.set('clientId', params.clientId);
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/quotes?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch quotes');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch quotes');
  return json;
}

async function fetchAgents(): Promise<AgentsRes> {
  const res = await apiFetch('/api/admin/users?role=AGENT&isActive=true&pageSize=100');
  if (!res.ok) throw new Error('Failed to fetch agents');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch agents');
  return json;
}

async function fetchClients(): Promise<ClientsRes> {
  const res = await apiFetch('/api/agent/clients?pageSize=200');
  if (!res.ok) throw new Error('Failed to fetch clients');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch clients');
  return json;
}

async function assignQuote(quoteId: string, assignedAgentId: string | null): Promise<void> {
  const res = await apiFetch(`/api/admin/quotes/${quoteId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedAgentId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to assign quote');
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'accent' {
  if (['SUBMITTED', 'UNDER_REVIEW', 'QUOTE_PREPARED', 'QUOTE_SENT', 'CLIENT_REVIEWING'].includes(s))
    return 'secondary';
  if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(s)) return 'default';
  if (['REJECTED', 'CANCELLED'].includes(s)) return 'destructive';
  return 'outline';
}

function priorityVariant(p: string): 'default' | 'destructive' | 'accent' | 'outline' {
  if (p === 'URGENT') return 'destructive';
  if (p === 'HIGH') return 'accent';
  return 'outline';
}

export default function QuotesPage() {
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
    queryFn: () =>
      fetchQuotes({
        status: status || undefined,
        assignedAgentId: assignedAgentId || undefined,
        clientId: clientId || undefined,
        search: search || undefined,
        page,
        pageSize,
      }),
  });

  const { data: agentsData } = useQuery({
    queryKey: ['admin', 'users', 'AGENT'],
    queryFn: fetchAgents,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['agent', 'clients'],
    queryFn: fetchClients,
  });

  const assignMu = useMutation({
    mutationFn: ({ quoteId, assignedAgentId }: { quoteId: string; assignedAgentId: string | null }) =>
      assignQuote(quoteId, assignedAgentId),
    onMutate: async ({ quoteId, assignedAgentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<QuotesRes>(queryKey);
      const agents = (queryClient.getQueryData<AgentsRes>(['admin', 'users', 'AGENT'])?.data) ?? [];
      const agent = assignedAgentId ? agents.find((a) => a.id === assignedAgentId) ?? null : null;
      queryClient.setQueryData<QuotesRes>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((q) =>
            q.id === quoteId
              ? {
                  ...q,
                  assignedAgentId,
                  assignedAgent: agent
                    ? { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email }
                    : null,
                }
              : q
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Failed to update assignment');
    },
    onSuccess: (_, { assignedAgentId }) => {
      toast.success(assignedAgentId ? 'Quote assigned' : 'Quote unassigned');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
    },
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const agents = agentsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const quotes = quotesData?.data ?? [];
  const pag = quotesData?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      {
        id: 'referenceNumber',
        accessorKey: 'referenceNumber',
        header: 'Reference',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.referenceNumber}</span>
        ),
      },
      {
        id: 'client',
        accessorFn: (r) => `${r.client.firstName} ${r.client.lastName}`,
        header: 'Client',
        cell: ({ row }) => {
          const c = row.original.client;
          return (
            <div>
              <div className="text-sm">{c.firstName} {c.lastName}</div>
              <div className="text-xs text-muted-foreground">{c.email}</div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <Badge variant={priorityVariant(row.original.priority)}>{row.original.priority}</Badge>
        ),
      },
      {
        id: 'assignedAgent',
        accessorFn: (r) => r.assignedAgent?.firstName,
        header: 'Agent',
        cell: ({ row }) => {
          const a = row.original.assignedAgent;
          return a ? (
            <span className="text-sm">{a.firstName} {a.lastName}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        id: 'submissionDate',
        accessorKey: 'submissionDate',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.submissionDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const q = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailQuoteId(q.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                {agents.map((a) => (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: a.id })}
                    disabled={assignMu.isPending || q.assignedAgentId === a.id}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign to {a.firstName} {a.lastName}
                  </DropdownMenuItem>
                ))}
                {q.assignedAgentId && (
                  <DropdownMenuItem
                    onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: null })}
                    disabled={assignMu.isPending}
                    className="text-muted-foreground"
                  >
                    Unassign
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [agents, assignMu]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quote Requests</h1>
        <p className="text-muted-foreground">Manage client quote requests and assign to agents.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Select
                value={status || 'all'}
                onValueChange={(v) => {
                  setStatus(v === 'all' ? '' : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={assignedAgentId || 'all'}
                onValueChange={(v) => {
                  setAssignedAgentId(v === 'all' ? '' : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Assigned agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={clientId || 'all'}
                onValueChange={(v) => {
                  setClientId(v === 'all' ? '' : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search ref, project, client..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button variant="secondary" size="icon" onClick={handleSearch} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
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
            emptyMessage="No quotes found."
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {detailQuoteId && (
        <QuoteDetailDialog
          quoteId={detailQuoteId}
          onClose={() => setDetailQuoteId(null)}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] })}
        />
      )}
    </div>
  );
}
