/**
 * Tests for ModeratorsPageClient – main moderators management page component.
 * Covers: page header, filters, and data table with mocked moderator list.
 * Mocks: react-i18next, moderators API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ModeratorsPageClient } from './ModeratorsPageClient';
import { fetchModerators } from '../api/queries';

const mockModeratorsRes = {
  success: true,
  data: [
    {
      id: 'mod1',
      email: 'mod@example.com',
      firstName: 'Mod',
      lastName: 'User',
      phone: null,
      role: 'MODERATOR',
      isActive: true,
      lastLogin: '2025-02-01T12:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      _count: { quoteRequests: 0, assignedQuotes: 2 },
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
  useAuthStore: () => ({
    user: { id: '1', role: 'ADMIN' },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

vi.mock('../api/queries', () => ({
  fetchModerators: vi.fn(() => Promise.resolve(mockModeratorsRes)),
}));

describe('ModeratorsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchModerators).mockResolvedValue(mockModeratorsRes);
  });

  it('renders page header with title and subtitle', async () => {
    render(<ModeratorsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.moderators\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText('dashboard.moderators.subtitle')).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<ModeratorsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.moderators\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders moderator data in table when loaded', async () => {
    render(<ModeratorsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.moderators\.title/i });
    await screen.findByText('Mod User', {}, { timeout: 3000 });
    expect(screen.getByText('mod@example.com')).toBeInTheDocument();
  });
});
