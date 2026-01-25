'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, MoreHorizontal, Pencil, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['CLIENT', 'AGENT', 'ADMIN'] as const;

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: { quoteRequests: number; assignedQuotes: number };
}

interface UsersRes {
  success: boolean;
  data: UserRow[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

async function fetchUsers(params: { role?: string; search?: string; isActive?: string; page?: number; pageSize?: number }): Promise<UsersRes> {
  const sp = new URLSearchParams();
  if (params.role) sp.set('role', params.role);
  if (params.search) sp.set('search', params.search);
  if (params.isActive) sp.set('isActive', params.isActive);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/users?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch users');
  return j;
}

async function createUser(data: { email: string; firstName: string; lastName: string; phone?: string; role?: string; isActive?: boolean; isVerified?: boolean }): Promise<UserRow> {
  const res = await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to create user');
  return j.data;
}

async function updateUser(id: string, data: { firstName?: string; lastName?: string; phone?: string; role?: string; isActive?: boolean; isVerified?: boolean }): Promise<UserRow> {
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update user');
  return j.data;
}

async function deactivateUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.message || 'Failed to deactivate user');
}

export default function UsersPage() {
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
    queryFn: () =>
      fetchUsers({
        role: role || undefined,
        isActive: isActive || undefined,
        search: search || undefined,
        page,
        pageSize,
      }),
  });

  const createMu = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setCreateOpen(false);
      toast.success('User created');
    },
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
        return {
          ...old,
          data: old.data.map((u) => (u.id === id ? { ...u, ...applied } : u)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error('Failed to update user');
    },
    onSuccess: () => {
      setEditId(null);
      toast.success('User updated');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deactivateMu = useMutation({
    mutationFn: deactivateUser,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<UsersRes>(queryKey);
      qc.setQueryData<UsersRes>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      toast.error('Failed to deactivate user');
    },
    onSuccess: () => {
      setDeactivateId(null);
      toast.success('User deactivated');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [searchInput]);

  const users = data?.data ?? [];
  const pag = data?.pagination;
  const totalCount = pag?.totalCount ?? 0;
  const pageCount = pag?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (r) => `${r.firstName} ${r.lastName}`,
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>
        ),
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
      },
      {
        id: 'isActive',
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'destructive'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'counts',
        accessorFn: (r) => r._count.quoteRequests,
        header: 'Quotes / Assigned',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original._count.quoteRequests} / {row.original._count.assignedQuotes}
          </span>
        ),
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
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
                <DropdownMenuItem onClick={() => setEditId(u.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {u.isActive && (
                  <DropdownMenuItem
                    onClick={() => setDeactivateId(u.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage clients, agents, and admins.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select
              value={role || 'all'}
              onValueChange={(v) => {
                setRole(v === 'all' ? '' : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={isActive || 'all'}
              onValueChange={(v) => {
                setIsActive(v === 'all' ? '' : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Search name, email, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-56"
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
          <DataTable<UserRow>
            columns={columns}
            data={users}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={(updater) => setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater))}
            totalCount={totalCount}
            isLoading={isLoading}
            emptyMessage="No users found."
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(d) => createMu.mutate(d)}
        isPending={createMu.isPending}
      />

      {editId && (
        <EditUserDialog
          userId={editId}
          onClose={() => setEditId(null)}
          onSave={(d) => updateMu.mutate({ id: editId, data: d })}
          isPending={updateMu.isPending}
        />
      )}

      {deactivateId && (
        <Dialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate user</DialogTitle>
              <DialogDescription>
                The user will no longer be able to sign in. You can reactivate later by editing the user.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deactivateMu.mutate(deactivateId)}
                disabled={deactivateMu.isPending}
              >
                {deactivateMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (d: { email: string; firstName: string; lastName: string; phone?: string; role?: string; isActive?: boolean }) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('CLIENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('Email, first name, and last name are required');
      return;
    }
    onSubmit({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      role: role || 'CLIENT',
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>Create a new user. They can set a password via &quot;Forgot password&quot; or sign in with Google if enabled.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label>Last name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  userId,
  onClose,
  onSave,
  isPending,
}: {
  userId: string;
  onClose: () => void;
  onSave: (d: { firstName?: string; lastName?: string; phone?: string; role?: string; isActive?: boolean }) => void;
  isPending: boolean;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const j = await res.json();
      if (!j.success || !j.data) throw new Error(j.message || 'Failed to fetch user');
      return j.data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
      setRole(user.role);
      setIsActive(user.isActive);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName, phone: phone || undefined, role, isActive });
  };

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
