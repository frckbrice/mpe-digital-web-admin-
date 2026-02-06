/**
 * Tests for AgentsPageClient – main agents management page component.
 * Covers: page header, filters, and data table with mocked agent list.
 * Mocks: react-i18next, agents API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { AgentsPageClient } from './AgentsPageClient';
import { fetchAgents } from '../api/queries';

const mockAgentsRes = {
  success: true,
  data: [
    {
      id: '1',
      email: 'agent@example.com',
      firstName: 'Agent',
      lastName: 'Smith',
      phone: '+33123456789',
      role: 'AGENT',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      lastLogin: '2025-02-01T12:00:00Z',
      _count: { quoteRequests: 2, assignedQuotes: 5 },
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
  fetchAgents: vi.fn(() => Promise.resolve(mockAgentsRes)),
}));

describe('AgentsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAgents).mockResolvedValue(mockAgentsRes);
  });

  it('renders page header with title and subtitle', async () => {
    render(<AgentsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.agents\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.agents\.subtitle/)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<AgentsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.agents\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders agent data in table when loaded', async () => {
    render(<AgentsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.agents\.title/i });
    await screen.findByText('Agent Smith', {}, { timeout: 3000 });
    expect(screen.getByText('agent@example.com')).toBeInTheDocument();
  });
});
