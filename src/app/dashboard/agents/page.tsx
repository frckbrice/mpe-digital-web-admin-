'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { apiFetch } from '@/lib/api-client';
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Search } from 'lucide-react';

interface AgentRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: { quoteRequests: number; assignedQuotes: number };
}

interface UsersRes {
  success: boolean;
  data: AgentRow[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

async function fetchAgents(params: { search?: string; isActive?: string; page?: number; pageSize?: number }): Promise<UsersRes> {
  const sp = new URLSearchParams();
  sp.set('role', 'AGENT');
  if (params.search) sp.set('search', params.search);
  if (params.isActive) sp.set('isActive', params.isActive);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize ?? 20));
  const res = await apiFetch(`/api/admin/users?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  const j = await res.json();
  if (!j.success) throw new Error(j.message || 'Failed to fetch agents');
  return j;
}

export default function AgentsPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isActive, setIsActive] = useState<string>('true');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const queryKey = ['admin', 'users', 'AGENT', search || null, isActive || null, page, pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAgents({
        search: search || undefined,
        isActive: isActive || undefined,
        page,
        pageSize,
      }),
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
        id: 'assignedQuotes',
        accessorFn: (r) => r._count.assignedQuotes,
        header: 'Assigned quotes',
        cell: ({ row }) => row.original._count.assignedQuotes,
      },
      {
        id: 'lastLogin',
        accessorKey: 'lastLogin',
        header: 'Last login',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.lastLogin
              ? new Date(row.original.lastLogin).toLocaleString()
              : '—'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-muted-foreground">
          Agents can be assigned to quote requests from the Quotes page. Manage users in{' '}
          <Link href="/dashboard/users" className="text-primary underline hover:no-underline">
            Users
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select
              value={isActive || 'all'}
              onValueChange={(v) => {
                setIsActive(v === 'all' ? '' : v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active only</SelectItem>
                <SelectItem value="false">Inactive only</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Search name, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-56"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={handleSearch}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
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
            emptyMessage="No agents found."
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
