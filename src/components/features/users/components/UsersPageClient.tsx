'use client';

/**
 * Component: UsersPageClient
 * 
 * Main client component for the Users management page. Displays a table of all users
 * (CLIENT, AGENT, MODERATOR, ADMIN) with filtering, search, pagination, and CRUD capabilities.
 * 
 * Features:
 * - Displays all users in a sortable, paginated data table
 * - Filter by role and active/inactive status
 * - Search functionality for finding specific users
 * - Create new users (ADMIN only)
 * - Edit user details (name, email, role, etc.)
 * - Deactivate users
 * - Role-based access control (MODERATOR has limited permissions)
 * - Optimistic updates for better UX
 * 
 * State Management:
 * - Uses React Query for data fetching and caching
 * - Implements optimistic updates for user modifications
 * - Manages local state for filters, search, pagination, and dialog visibility
 * 
 * Data Flow:
 * - Fetches users from /api/admin/users endpoint
 * - Updates are handled via mutations with optimistic UI updates
 * - Invalidates related queries after mutations
 * 
 * Permissions:
 * - ADMIN: Full access (create, edit, deactivate)
 * - MODERATOR: Limited access (cannot create users, cannot edit ADMIN users)
 */

import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Search, Plus, MoreHorizontal, Pencil, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUsers } from '../api/queries';
import { createUser, updateUser, deactivateUser } from '../api/mutations';
import type { UserRow, UsersRes } from '../api/types';
import { ROLES } from '../api/data';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { useAuthStore } from '@/components/features/auth';

/**
 * Maps user role to its translation key for i18n
 * @param role - User role string (CLIENT, AGENT, MODERATOR, ADMIN)
 * @returns Translation key for the role
 */
function getRoleTranslationKey(role: string): string {
  const roleMap: Record<string, string> = {
    CLIENT: 'common.roleClient',
    AGENT: 'common.roleAgent',
    MODERATOR: 'common.roleModerator',
    ADMIN: 'common.roleAdmin',
  };
  return roleMap[role] || role;
}

/**
 * Users Page Component
 * 
 * Renders a comprehensive users management interface with filtering, search,
 * data table, and user management actions (create, edit, deactivate).
 * Supports role-based permissions for ADMIN and MODERATOR roles.
 */
export function UsersPageClient() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isModerator = user?.role === 'MODERATOR';
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const qc = useQueryClient();
  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = ['admin', 'users', role || null, isActive || null, search || null, page, pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      let r = role || undefined;
      if (isModerator && r === 'ADMIN') r = undefined;
      return fetchUsers({ role: r, isActive: isActive || undefined, search: search || undefined, page, pageSize });
    },
  });

  const createMu = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setCreateOpen(false); toast.success(t('dashboard.users.userCreated')); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMu = useMutation({
    mutationFn: ({ id, data: patch }: { id: string; data: Parameters<typeof updateUser>[1] }) => updateUser(id, patch),
    onMutate: async ({ id, data: patch }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<UsersRes>(queryKey);
      qc.setQueryData<UsersRes>(queryKey, (old) => {
        if (!old) return old;
        const applied = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<UserRow>;
        return { ...old, data: old.data.map((u) => (u.id === id ? { ...u, ...applied } : u)) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) qc.setQueryData(queryKey, context.previous); toast.error(t('dashboard.users.failedUpdate')); },
    onSuccess: () => { setEditId(null); toast.success(t('dashboard.users.userUpdated')); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deactivateMu = useMutation({
    mutationFn: deactivateUser,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<UsersRes>(queryKey);
      qc.setQueryData<UsersRes>(queryKey, (old) => (!old ? old : { ...old, data: old.data.map((u) => (u.id === id ? { ...u, isActive: false } : u)) }));
      return { previous };
    },
    onError: (_err, _vars, context) => { if (context?.previous) qc.setQueryData(queryKey, context.previous); toast.error(t('dashboard.users.failedDeactivate')); },
    onSuccess: () => { setDeactivateId(null); toast.success(t('dashboard.users.userDeactivated')); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const handleSearch = useCallback(() => { setSearch(searchInput.trim()); setPagination((p) => ({ ...p, pageIndex: 0 })); }, [searchInput]);

  const allUsers = data?.data ?? [];
  const users = allUsers;

  // MODERATOR cannot deactivate anyone; cannot filter by ADMIN (ADMIN_MODERATOR_ENDPOINTS)
  const canDeactivateUser = !isModerator;
  const filterRoles = isModerator ? ROLES.filter((r) => r !== 'ADMIN') : ROLES;

  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      { id: 'name', accessorFn: (r) => `${r.firstName} ${r.lastName}`, header: t('common.name'), cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span> },
      { id: 'email', accessorKey: 'email', header: t('common.email') },
      { id: 'role', accessorKey: 'role', header: t('common.role'), cell: ({ row }) => <Badge variant="outline">{t(getRoleTranslationKey(row.original.role))}</Badge> },
      { id: 'isActive', accessorKey: 'isActive', header: t('common.status'), cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'destructive'}>{row.original.isActive ? t('common.active') : t('common.inactive')}</Badge> },
      { id: 'counts', accessorFn: (r) => r._count.quoteRequests, header: t('dashboard.users.quotesAssigned'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original._count.quoteRequests} / {row.original._count.assignedQuotes}</span> },
      { id: 'createdAt', accessorKey: 'createdAt', header: t('dashboard.users.created'), cell: ({ row }) => <span className="text-muted-foreground text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          // Moderators: read-only for ADMIN and MODERATOR; cannot deactivate anyone
          const canEdit = !isModerator || (u.role !== 'ADMIN' && u.role !== 'MODERATOR');
          if (!canEdit) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditId(u.id)}><Pencil className="mr-2 h-4 w-4" />{t('common.edit')}</DropdownMenuItem>
                {canDeactivateUser && u.isActive && <DropdownMenuItem onClick={() => setDeactivateId(u.id)} className="text-destructive focus:text-destructive"><UserX className="mr-2 h-4 w-4" />{t('dashboard.users.deactivate')}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, isModerator, canDeactivateUser]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.users.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.users.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{t('dashboard.users.addUser')}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters')}</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select value={role || 'all'} onValueChange={(v) => { setRole(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-full min-w-0 sm:w-[140px]"><SelectValue placeholder={t('common.role')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.users.allRoles')}</SelectItem>
                {filterRoles.map((r) => <SelectItem key={r} value={r}>{t(getRoleTranslationKey(r))}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={isActive || 'all'} onValueChange={(v) => { setIsActive(v === 'all' ? '' : v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
              <SelectTrigger className="w-full min-w-0 sm:w-[140px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('dashboard.users.active')}</SelectItem>
                <SelectItem value="false">{t('dashboard.users.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <Input placeholder={t('dashboard.users.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full min-w-0 sm:w-56" />
              <Button variant="secondary" size="icon" onClick={handleSearch} aria-label={t('common.search')} className="flex-shrink-0"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable<UserRow>
            columns={columns}
            data={users}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={(updater) => setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))}
            totalCount={totalCount}
            isLoading={isLoading}
            emptyMessage={t('dashboard.users.noUsersFound')}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={(d) => createMu.mutate(d)} isPending={createMu.isPending} />

      {editId && <EditUserDialog userId={editId} onClose={() => setEditId(null)} onSave={(d) => updateMu.mutate({ id: editId, data: d })} isPending={updateMu.isPending} />}

      {deactivateId && canDeactivateUser && (
        <Dialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.users.deactivateTitle')}</DialogTitle>
              <DialogDescription>{t('dashboard.users.deactivateDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateId(null)}>{t('common.cancel')}</Button>
              <Button variant="destructive" onClick={() => deactivateMu.mutate(deactivateId)} disabled={deactivateMu.isPending}>
                {deactivateMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.users.deactivate')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
