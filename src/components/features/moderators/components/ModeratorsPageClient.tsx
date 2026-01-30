'use client';

/**
 * Component: ModeratorsPageClient
 * 
 * Main client component for the Moderators management page. Displays a table of moderators
 * with filtering, search, pagination, and management capabilities.
 * 
 * Features:
 * - Displays moderators in a sortable, paginated data table
 * - Filter by active/inactive status
 * - Search functionality for finding specific moderators
 * - Edit moderator details (name, email, etc.)
 * - Deactivate moderators
 * - Optimistic updates for better UX
 * 
 * State Management:
 * - Uses React Query for data fetching and caching
 * - Implements optimistic updates for moderator modifications
 * - Manages local state for filters, search, pagination, and dialog visibility
 * 
 * Data Flow:
 * - Fetches moderators from /api/admin/moderators endpoint
 * - Updates are handled via mutations with optimistic UI updates
 * - Invalidates related queries after mutations
 * 
 * Note: Moderators can manage other moderators but cannot create new ones.
 * Only ADMIN users can create new moderators.
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
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
import { Search, MoreHorizontal, Pencil, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchModerators } from '../api/queries';
import { updateModerator, deactivateModerator } from '../api/mutations';
import type { ModeratorRow, ModeratorsRes } from '../api/types';
import { EditModeratorDialog } from './EditModeratorDialog';

/**
 * Moderators Page Component
 * 
 * Renders a comprehensive moderators management interface with filtering, search,
 * data table, and moderator management actions (edit, deactivate).
 */
export function ModeratorsPageClient() {
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
  const queryKey = ['admin', 'moderators', search || null, isActive || null, page, pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchModerators({ search: search || undefined, isActive: isActive || undefined, page, pageSize }),
  });

  const updateMu = useMutation({
    mutationFn: ({ id, data: patch }: { id: string; data: Parameters<typeof updateModerator>[1] }) => updateModerator(id, patch),
    onMutate: async ({ id, data: patch }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ModeratorsRes>(queryKey);
      qc.setQueryData<ModeratorsRes>(queryKey, (old) => {
        if (!old) return old;
        const applied = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<ModeratorRow>;
        return { ...old, data: old.data.map((u) => (u.id === id ? { ...u, ...applied } : u)) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(t('dashboard.moderators.failedUpdate'));
    },
    onSuccess: () => {
      setEditId(null);
      toast.success(t('dashboard.moderators.moderatorUpdated'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'moderators'] }),
  });

  const deactivateMu = useMutation({
    mutationFn: deactivateModerator,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ModeratorsRes>(queryKey);
      qc.setQueryData<ModeratorsRes>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((u) => (u.id === id ? { ...u, isActive: false } : u)) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error(t('dashboard.moderators.failedDeactivate'));
    },
    onSuccess: () => {
      setDeactivateId(null);
      toast.success(t('dashboard.moderators.moderatorDeactivated'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'moderators'] }),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const moderators = data?.data ?? [];
  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<ModeratorRow>[]>(
    () => [
      { id: 'name', accessorFn: (r) => `${r.firstName} ${r.lastName}`, header: t('common.name'), cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span> },
      { id: 'email', accessorKey: 'email', header: t('common.email') },
      { id: 'isActive', accessorKey: 'isActive', header: t('common.status'), cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'destructive'}>{row.original.isActive ? t('common.active') : t('common.inactive')}</Badge> },
      { id: 'lastLogin', accessorKey: 'lastLogin', header: t('dashboard.moderators.lastLogin'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.lastLogin ? new Date(row.original.lastLogin).toLocaleString() : '—'}</span> },
      { id: 'createdAt', accessorKey: 'createdAt', header: t('dashboard.moderators.createdAt'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditId(u.id)}><Pencil className="mr-2 h-4 w-4" />{t('common.edit')}</DropdownMenuItem>
                {u.isActive && (
                  <DropdownMenuItem onClick={() => setDeactivateId(u.id)} className="text-destructive focus:text-destructive">
                    <UserX className="mr-2 h-4 w-4" />{t('dashboard.moderators.deactivate')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.moderators.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.moderators.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters')}</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select value={isActive || 'all'} onValueChange={(v) => { setIsActive(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('dashboard.moderators.activeOnly')}</SelectItem>
                <SelectItem value="false">{t('dashboard.moderators.inactiveOnly')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input placeholder={t('dashboard.moderators.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-56" />
              <Button variant="secondary" size="icon" onClick={handleSearch} aria-label={t('common.search')}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<ModeratorRow>
            columns={columns}
            data={moderators}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={(updater) => setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))}
            totalCount={totalCount}
            isLoading={isLoading}
            emptyMessage={t('dashboard.moderators.noModeratorsFound')}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {editId && <EditModeratorDialog userId={editId} onClose={() => setEditId(null)} onSave={(d) => updateMu.mutate({ id: editId, data: d })} isPending={updateMu.isPending} />}

      {deactivateId && (
        <Dialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.moderators.deactivateTitle')}</DialogTitle>
              <DialogDescription>{t('dashboard.moderators.deactivateDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateId(null)}>{t('common.cancel')}</Button>
              <Button variant="destructive" onClick={() => deactivateMu.mutate(deactivateId)} disabled={deactivateMu.isPending}>
                {deactivateMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.moderators.deactivate')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
