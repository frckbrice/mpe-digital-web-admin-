/**
 * Tests for UsersPageClient – main users management page component.
 * Covers: page header, add user button, filters, and table with mocked user list.
 * Mocks: react-i18next, auth store, users API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { UsersPageClient } from './UsersPageClient';
import { fetchUsers } from '../api/queries';

const mockUsersRes = {
  success: true,
  data: [
    {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      phone: null as string | null,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      lastLogin: null as string | null,
      createdAt: '2025-01-01T00:00:00Z',
      _count: { quoteRequests: 0, assignedQuotes: 0 },
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/features/auth', () => ({
  useAuthStore: () => ({ user: { id: '1', role: 'ADMIN' } }),
}));

vi.mock('../api/queries', () => ({
  fetchUsers: vi.fn(() => Promise.resolve(mockUsersRes)),
}));

describe('UsersPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchUsers).mockResolvedValue(mockUsersRes);
  });

  it('renders page header with title and subtitle', async () => {
    render(<UsersPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.users\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText('dashboard.users.subtitle')).toBeInTheDocument();
  });

  it('renders add user button for admin', async () => {
    render(<UsersPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.users\.title/i });
    expect(screen.getByRole('button', { name: /dashboard\.users\.addUser/i })).toBeInTheDocument();
  });

  it('renders filters and user data when loaded', async () => {
    render(<UsersPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.users\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
    await screen.findByText('Admin User', {}, { timeout: 3000 });
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });
});
