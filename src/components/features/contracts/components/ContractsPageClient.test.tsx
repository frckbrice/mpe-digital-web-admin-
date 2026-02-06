/**
 * Tests for ContractsPageClient – main contracts list page component.
 * Covers: page header, filters, and data table with mocked contract list.
 * Mocks: react-i18next, contracts API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ContractsPageClient } from './ContractsPageClient';

const mockContractsRes = {
  success: true,
  data: [
    {
      id: 'c1',
      contractNumber: 'CONTRACT-001',
      status: 'SIGNED',
      quoteId: 'q1',
      createdAt: '2025-01-01T00:00:00Z',
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
  fetchContracts: vi.fn(() => Promise.resolve(mockContractsRes)),
}));

describe('ContractsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<ContractsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.contracts\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.contracts\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<ContractsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.contracts\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders contract data in table when loaded', async () => {
    render(<ContractsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.contracts\.title/i });
    expect(await screen.findByText('CONTRACT-001', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('SIGNED')).toBeInTheDocument();
  });
});
