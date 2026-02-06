/**
 * Tests for InvoicesPageClient – main invoices list page component.
 * Covers: page header, filters, and data table with mocked invoice list.
 * Mocks: react-i18next, invoices API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { InvoicesPageClient } from './InvoicesPageClient';

const mockInvoicesRes = {
  success: true,
  data: [
    {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      status: 'PAID',
      amount: 1000,
      currency: 'EUR',
      contractId: 'c1',
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
  fetchInvoices: vi.fn(() => Promise.resolve(mockInvoicesRes)),
}));

describe('InvoicesPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<InvoicesPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.invoices\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.invoices\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<InvoicesPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.invoices\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders invoice data in table when loaded', async () => {
    render(<InvoicesPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.invoices\.title/i });
    expect(await screen.findByText('INV-001', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });
});
