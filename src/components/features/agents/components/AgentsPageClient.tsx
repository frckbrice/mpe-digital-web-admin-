'use client';

/**
 * Component: AgentsPageClient
 * 
 * Main client component for the Agents management page. Displays a table of agents with
 * filtering, search, pagination, and management capabilities.
 * 
 * Features:
 * - Displays agents in a sortable, paginated data table
 * - Filter by active/inactive status
 * - Search functionality for finding specific agents
 * - Edit agent details (name, email, etc.)
 * - Deactivate agents
 * - Demote agents to CLIENT role
 * - Shows assigned quotes count and last login time
 * - Optimistic updates for better UX
 * 
 * State Management:
 * - Uses React Query for data fetching and caching
 * - Implements optimistic updates for agent modifications
 * - Manages local state for filters, search, pagination, and dialog visibility
 * 
 * Data Flow:
 * - Fetches agents from /api/admin/agents endpoint
 * - Updates are handled via mutations with optimistic UI updates
 * - Invalidates related queries after mutations (agents, clients)
 * 
 * Role Management:
 * - Allows demoting agents to CLIENT role
 * - Deactivation sets isActive to false without changing role
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Search, MoreHorizontal, Pencil, UserX, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAgents } from '../api/queries';
import { updateAgent, deactivateAgent } from '../api/mutations';
import type { AgentRow, AgentsRes } from '../api/types';
import { EditAgentDialog } from './EditAgentDialog';

/**
 * Agents Page Component
 * 
 * Renders a comprehensive agents management interface with filtering, search,
 * data table, and agent management actions (edit, deactivate, demote).
 */
export function AgentsPageClient() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isActive, setIsActive] = useState<string>('true');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const qc = useQueryClient();
  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = ['admin', 'agents', search || null, isActive || null, page, pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAgents({ search: search || undefined, isActive: isActive || undefined, page, pageSize }),
  });

  const updateMu = useMutation({
    mutationFn: ({ id, data: patch }: { id: string; data: Parameters<typeof updateAgent>[1] }) => updateAgent(id, patch),
    onMutate: async ({ id, data: patch }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<AgentsRes>(queryKey);
      qc.setQueryData<AgentsRes>(queryKey, (old) => {
        if (!old) return old;
        const applied = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<AgentRow>;
        return { ...old, data: old.data.map((u) => (u.id === id ? { ...u, ...applied } : u)) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(t('dashboard.agents.failedUpdate'));
    },
    onSuccess: () => {
      setEditId(null);
      toast.success(t('dashboard.agents.agentUpdated'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });

  const deactivateMu = useMutation({
    mutationFn: deactivateAgent,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<AgentsRes>(queryKey);
      qc.setQueryData<AgentsRes>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((u) => (u.id === id ? { ...u, isActive: false } : u)) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error('Failed to deactivate agent');
    },
    onSuccess: () => {
      setDeactivateId(null);
      toast.success('Agent deactivated');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });

  const demoteMu = useMutation({
    mutationFn: (id: string) => updateAgent(id, { role: 'CLIENT' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<AgentsRes>(queryKey);
      qc.setQueryData<AgentsRes>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((u) => u.id !== id),
          pagination: { ...old.pagination, totalCount: Math.max(0, old.pagination.totalCount - 1) },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(t('dashboard.agents.failedDemote'));
    },
    onSuccess: () => {
      toast.success(t('dashboard.agents.agentDemoted'));
      qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
      qc.invalidateQueries({ queryKey: ['admin', 'clients'] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const agents = data?.data ?? [];
  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<AgentRow>[]>(
    () => [
      { id: 'name', accessorFn: (r) => `${r.firstName} ${r.lastName}`, header: t('common.name'), cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span> },
      { id: 'email', accessorKey: 'email', header: t('common.email') },
      { id: 'isActive', accessorKey: 'isActive', header: t('common.status'), cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'destructive'}>{row.original.isActive ? t('common.active') : t('common.inactive')}</Badge> },
      { id: 'assignedQuotes', accessorFn: (r) => r._count.assignedQuotes, header: t('dashboard.agents.assignedQuotes'), cell: ({ row }) => row.original._count.assignedQuotes },
      { id: 'lastLogin', accessorKey: 'lastLogin', header: t('dashboard.agents.lastLogin'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.lastLogin ? new Date(row.original.lastLogin).toLocaleString() : '—'}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          const isDemoting = demoteMu.isPending && demoteMu.variables === u.id;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditId(u.id)}><Pencil className="mr-2 h-4 w-4" />{t('common.edit')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => demoteMu.mutate(u.id)} disabled={isDemoting}>
                  {isDemoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
                  {t('dashboard.agents.demoteToClient')}
                </DropdownMenuItem>
                {u.isActive && (
                  <DropdownMenuItem onClick={() => setDeactivateId(u.id)} className="text-destructive focus:text-destructive">
                    <UserX className="mr-2 h-4 w-4" />{t('dashboard.agents.deactivate')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [demoteMu.isPending, demoteMu.variables, demoteMu.mutate, t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.agents.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.agents.subtitle')}{' '}
          <Link href="/dashboard/clients" className="text-primary underline hover:no-underline">{t('dashboard.agents.clientsLink')}</Link>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters')}</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select value={isActive || 'all'} onValueChange={(v) => { setIsActive(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('dashboard.agents.activeOnly')}</SelectItem>
                <SelectItem value="false">{t('dashboard.agents.inactiveOnly')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input placeholder={t('dashboard.agents.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-56" />
              <Button variant="secondary" size="icon" onClick={handleSearch} aria-label={t('common.search')}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<AgentRow>
            columns={columns}
            data={agents}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={(updater) => setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))}
            totalCount={totalCount}
            isLoading={isLoading}
            emptyMessage={t('dashboard.agents.noAgentsFound')}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {editId && <EditAgentDialog userId={editId} onClose={() => setEditId(null)} onSave={(d) => updateMu.mutate({ id: editId, data: d })} isPending={updateMu.isPending} />}

      {deactivateId && (
        <Dialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.agents.deactivateTitle')}</DialogTitle>
              <DialogDescription>{t('dashboard.agents.deactivateDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateId(null)}>{t('common.cancel')}</Button>
              <Button variant="destructive" onClick={() => deactivateMu.mutate(deactivateId)} disabled={deactivateMu.isPending}>
                {deactivateMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.agents.deactivate')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
