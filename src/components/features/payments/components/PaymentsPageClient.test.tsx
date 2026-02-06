/**
 * Tests for PaymentsPageClient – payments list page component.
 * Covers: page header, filters, and data table with mocked payment list.
 * Mocks: react-i18next, payments API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { PaymentsPageClient } from './PaymentsPageClient';

const mockPaymentsRes = {
  success: true,
  data: [
    {
      id: 'pay1',
      status: 'PENDING',
      amount: 500,
      currency: 'EUR',
      createdAt: '2025-01-01T00:00:00Z',
      contractId: 'c1',
      invoiceId: 'inv1',
      invoice: { id: 'inv1', invoiceNumber: 'INV-001' },
      contract: { id: 'c1', contractNumber: 'CONTRACT-001' },
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
  fetchPayments: vi.fn(() => Promise.resolve(mockPaymentsRes)),
}));

describe('PaymentsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<PaymentsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.payments\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.payments\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<PaymentsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.payments\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders payment data in table when loaded', async () => {
    render(<PaymentsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.payments\.title/i });
    expect(await screen.findByText('pay1', {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
