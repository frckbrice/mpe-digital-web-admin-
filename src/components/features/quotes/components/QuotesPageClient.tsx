'use client';

/**
 * Component: QuotesPageClient
 *
 * Main client component for the Quotes management page. Displays a table of quotes with
 * filtering, search, pagination, and assignment capabilities.
 *
 * Features:
 * - Displays quotes in a sortable, paginated data table
 * - Filter by status, assigned agent, and client
 * - Search functionality for finding specific quotes
 * - Assign/unassign quotes to agents
 * - View quote details in a dialog
 * - Optimistic updates for better UX
 *
 * State Management:
 * - Uses React Query for data fetching and caching
 * - Implements optimistic updates for quote assignments
 * - Manages local state for filters, search, and pagination
 *
 * Data Flow:
 * - Fetches quotes from /api/admin/quotes endpoint
 * - Fetches agents and clients for filter dropdowns
 * - Updates are handled via mutations with optimistic UI updates
 *
 * Internationalization:
 * - All text is internationalized using react-i18next
 * - Supports multiple languages (en, fr)
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
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
import { PageHeader, FilterCard, SearchWithButton, DataTableCard } from '@/components/shared';
import {
  MoreHorizontal,
  Eye,
  UserPlus,
  Briefcase,
  MessageSquare,
  Archive,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchQuotes, fetchAgentsForQuotes, fetchClientsForQuotes } from '../api/queries';
import type { QuoteRow, QuotesRes, AgentsRes } from '../api/types';
import { assignQuote, archiveQuote, deleteQuote } from '../api/mutations';
import { QUOTE_STATUSES } from '../api/data';
import { QuoteDetailDialog } from './QuoteDetailDialog';
import { QuoteMessagesSheet } from './QuoteMessagesSheet';
import { useAuthStore } from '@/components/features/auth';

/**
 * Determines the badge variant color based on quote status
 * @param s - Quote status string
 * @returns Badge variant for visual status indication
 */
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
 * Maps quote priority to its translation key for i18n
 * @param priority - Quote priority string
 * @returns Translation key for the priority
 */
function getPriorityTranslationKey(priority: string): string {
  const priorityMap: Record<string, string> = {
    LOW: 'dashboard.quotes.priorityLow',
    NORMAL: 'dashboard.quotes.priorityNormal',
    HIGH: 'dashboard.quotes.priorityHigh',
    URGENT: 'dashboard.quotes.priorityUrgent',
  };
  return priorityMap[priority] || priority;
}

/**
 * Main Quotes Page Component
 *
 * Renders a comprehensive quotes management interface with:
 * - Filter controls (status, agent, client)
 * - Search functionality
 * - Data table with pagination
 * - Quote assignment actions
 * - Quote detail dialog
 */
export function QuotesPageClient() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isModerator = user?.role === 'MODERATOR';
  const [status, setStatus] = useState<string>('');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [detailQuoteId, setDetailQuoteId] = useState<string | null>(null);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  const queryClient = useQueryClient();
  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  // ADMIN and MODERATOR both use admin quotes API so moderator gets same data (including internalNotes in detail)
  const queryKey = [
    'admin',
    'quotes',
    status || null,
    isModerator && assignedToMe ? (user?.id ?? 'me') : assignedAgentId || null,
    clientId || null,
    search || null,
    page,
    pageSize,
  ] as const;

  const { data: quotesData, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchQuotes({
        status: status || undefined,
        assignedAgentId:
          isModerator && assignedToMe ? (user?.id ?? undefined) : assignedAgentId || undefined,
        clientId: clientId || undefined,
        search: search || undefined,
        page,
        pageSize,
      }),
    refetchInterval: 15_000, // Keep table in sync when client cancels/updates from elsewhere
    refetchOnWindowFocus: true,
  });

  const { data: agentsData, isError: isAgentsError } = useQuery({
    queryKey: ['admin', 'users', 'AGENT'],
    queryFn: fetchAgentsForQuotes,
  });
  const { data: clientsData } = useQuery({
    queryKey: ['agent', 'clients'],
    queryFn: fetchClientsForQuotes,
  });

  const assignMu = useMutation({
    mutationFn: ({
      quoteId,
      assignedAgentId,
    }: {
      quoteId: string;
      assignedAgentId: string | null;
    }) => assignQuote(quoteId, assignedAgentId),
    onMutate: async ({ quoteId, assignedAgentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<QuotesRes>(queryKey);
      const agents = queryClient.getQueryData<AgentsRes>(['admin', 'users', 'AGENT'])?.data ?? [];
      const agent = assignedAgentId ? (agents.find((a) => a.id === assignedAgentId) ?? null) : null;
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
                  ? {
                    id: agent.id,
                    firstName: agent.firstName,
                    lastName: agent.lastName,
                    email: agent.email,
                  }
                  : null,
              }
              : q
          ),
        };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      const message = err instanceof Error ? err.message : null;
      toast.error(message || t('dashboard.quotes.failedAssignment'));
    },
    onSuccess: (_, { assignedAgentId: aid }) => {
      toast.success(
        aid ? t('dashboard.quotes.quoteAssigned') : t('dashboard.quotes.quoteUnassigned')
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
    },
  });

  const archiveMu = useMutation({
    mutationFn: (quoteId: string) => archiveQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
      toast.success(t('dashboard.quotes.quoteArchived'));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t('dashboard.quotes.failedArchive')),
  });

  const deleteMu = useMutation({
    mutationFn: (quoteId: string) => deleteQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
      toast.success(t('dashboard.quotes.quoteDeleted'));
      setDetailQuoteId(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t('dashboard.quotes.failedDelete')),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const agents = useMemo(() => agentsData?.data ?? [], [agentsData?.data]);
  const clients = clientsData?.data ?? [];
  const quotes = quotesData?.data ?? [];
  const pag = quotesData?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;
  const canAssign = agents.length > 0;

  const columns = useMemo<ColumnDef<QuoteRow>[]>(
    () => [
      {
        id: 'referenceNumber',
        accessorKey: 'referenceNumber',
        header: t('common.reference'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#fe4438]" />
            <span className="font-medium">{row.original.referenceNumber}</span>
          </div>
        ),
      },
      {
        id: 'client',
        accessorFn: (r) => `${r.client.firstName} ${r.client.lastName}`,
        header: t('common.client'),
        cell: ({ row }) => {
          const c = row.original.client;
          return (
            <div>
              <div className="text-sm">
                {c.firstName} {c.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{c.email}</div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: t('common.status'),
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {t(getStatusTranslationKey(row.original.status))}
          </Badge>
        ),
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: t('dashboard.quotes.priority'),
        cell: ({ row }) => (
          <Badge variant={priorityVariant(row.original.priority)}>
            {t(getPriorityTranslationKey(row.original.priority))}
          </Badge>
        ),
      },
      {
        id: 'assignedAgent',
        accessorFn: (r) => r.assignedAgent?.firstName,
        header: t('dashboard.quotes.agent'),
        cell: ({ row }) => {
          const a = row.original.assignedAgent;
          return a ? (
            <span className="text-sm">
              {a.firstName} {a.lastName}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        id: 'submissionDate',
        accessorKey: 'submissionDate',
        header: t('dashboard.stats.submitted'),
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
          const isCancelled = q.status === 'CANCELLED';
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
                  {t('common.viewDetails')}
                </DropdownMenuItem>
                {isCancelled ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => archiveMu.mutate(q.id)}
                      disabled={archiveMu.isPending}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {t('dashboard.quotes.archiveQuote')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        window.confirm(t('dashboard.quotes.deleteQuoteConfirm')) &&
                        deleteMu.mutate(q.id)
                      }
                      disabled={deleteMu.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('dashboard.quotes.deleteQuote')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {canAssign ? (
                      agents.map((a) => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: a.id })}
                          disabled={assignMu.isPending || q.assignedAgentId === a.id}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t('common.assignTo', { name: `${a.firstName} ${a.lastName}` })}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        {isAgentsError
                          ? t('dashboard.quotes.agentsListUnavailable')
                          : t('common.loading')}
                      </DropdownMenuItem>
                    )}
                    {q.assignedAgentId && (
                      <DropdownMenuItem
                        onClick={() => assignMu.mutate({ quoteId: q.id, assignedAgentId: null })}
                        disabled={assignMu.isPending}
                        className="text-muted-foreground"
                      >
                        {t('common.unassign')}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [agents, assignMu, archiveMu, deleteMu, t, canAssign, isAgentsError]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.quotes.title')}
        subtitle={t('dashboard.quotes.subtitle')}
        icon={<Briefcase className="h-8 w-8 text-[#fe4438]" />}
        action={
          <Button
            onClick={() => setShowMessageComposer(true)}
            className="flex items-center gap-2 bg-[#fe4438] hover:bg-[#fe4438]/90 text-white"
          >
            <MessageSquare className="h-4 w-4" />
            {t('dashboard.quotes.newMessage') || 'New Message'}
          </Button>
        }
      />

      <FilterCard title={t('common.filters')} accentBorder>
        <div className="flex items-center gap-2">
          <Select
            value={status || 'all'}
            onValueChange={(v) => {
              setStatus(v === 'all' ? '' : v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full min-w-0 sm:w-[180px]">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.quotes.allStatuses')}</SelectItem>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isModerator ? (
          <div className="flex items-center gap-2">
            <Select
              value={assignedToMe ? 'me' : 'all'}
              onValueChange={(v) => {
                setAssignedToMe(v === 'me');
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full min-w-0 sm:w-[200px]">
                <SelectValue placeholder={t('dashboard.quotes.assignedScope')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.quotes.assignedScopeAll')}</SelectItem>
                <SelectItem value="me">{t('dashboard.quotes.assignedScopeMe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Select
                value={assignedAgentId || 'all'}
                onValueChange={(v) => {
                  setAssignedAgentId(v === 'all' ? '' : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-full min-w-0 sm:w-[200px]">
                  <SelectValue placeholder={t('common.assignedAgent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.quotes.allAgents')}</SelectItem>
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
                <SelectTrigger className="w-full min-w-0 sm:w-[200px]">
                  <SelectValue placeholder={t('common.client')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.quotes.allClients')}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SearchWithButton
              placeholder={t('dashboard.quotes.searchPlaceholder')}
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              ariaLabel={t('common.search')}
              inputClassName="sm:w-64"
            />
          </>
        )}
      </FilterCard>

      <DataTableCard<QuoteRow>
        columns={columns}
        data={quotes}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(updater) =>
          setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))
        }
        totalCount={totalCount}
        isLoading={isLoading}
        emptyMessage={t('dashboard.quotes.noQuotesFound')}
        pageSizeOptions={[10, 20, 50, 100]}
        accentBorder
      />

      {detailQuoteId && (
        <QuoteDetailDialog
          quoteId={detailQuoteId}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
            queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
            setDetailQuoteId(null);
          }}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
            queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
          }}
        />
      )}

      {/* Message Composer Sheet */}
      <QuoteMessagesSheet
        open={showMessageComposer}
        onClose={() => {
          setShowMessageComposer(false);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
          queryClient.invalidateQueries({ queryKey: ['agent', 'quotes'] });
        }}
      />
    </div>
  );
}
