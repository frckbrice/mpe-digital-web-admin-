/**
 * Tests for QuotesPageClient – main quotes management page component.
 * Covers: page header, filters, and table with mocked quote list.
 * Mocks: react-i18next, auth store, quotes/agents/clients API and mutations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { QuotesPageClient } from './QuotesPageClient';

const mockQuotesRes = {
  success: true,
  data: [
    {
      id: 'q1',
      referenceNumber: 'QR-2025-001',
      status: 'SUBMITTED',
      priority: 'NORMAL',
      submissionDate: '2025-01-15',
      lastUpdated: '2025-01-15',
      assignedAgentId: null,
      projectDescription: 'Test project',
      client: {
        id: 'c1',
        firstName: 'Client',
        lastName: 'One',
        email: 'client@example.com',
      },
      assignedAgent: null,
      documents: [],
      _count: { messages: 0 },
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

const mockAgentsRes = {
  success: true,
  data: [{ id: 'a1', firstName: 'Agent', lastName: 'One', email: 'agent@example.com' }],
};

const mockClientsRes = {
  success: true,
  data: [{ id: 'c1', firstName: 'Client', lastName: 'One', email: 'client@example.com' }],
  pagination: { totalCount: 1 },
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
  fetchQuotes: vi.fn(() => Promise.resolve(mockQuotesRes)),
  fetchAgentsForQuotes: vi.fn(() => Promise.resolve(mockAgentsRes)),
  fetchClientsForQuotes: vi.fn(() => Promise.resolve(mockClientsRes)),
}));

vi.mock('../api/mutations', () => ({
  assignQuote: vi.fn(),
  archiveQuote: vi.fn(),
  deleteQuote: vi.fn(),
}));

describe('QuotesPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<QuotesPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.quotes\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText('dashboard.quotes.subtitle')).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<QuotesPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.quotes\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders quote reference in table when loaded', async () => {
    render(<QuotesPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.quotes\.title/i });
    expect(await screen.findByText('QR-2025-001', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
