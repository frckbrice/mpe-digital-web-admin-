/**
 * Tests for ModerationPageClient – moderation requests page component.
 * Covers: page header, filters, and data table with mocked moderation requests.
 * Mocks: react-i18next, moderation API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ModerationPageClient } from './ModerationPageClient';
import { fetchModerationRequests } from '../api/queries';

const mockRequestsRes = {
  success: true,
  data: [
    {
      id: 'req1',
      actionType: 'INVOICE_APPROVAL',
      status: 'PENDING',
      requestedAt: '2025-01-01T12:00:00Z',
      requestedBy: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      invoice: { id: 'inv1', invoiceNumber: 'INV-001' },
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
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
  fetchModerationRequests: vi.fn(() => Promise.resolve(mockRequestsRes)),
}));

describe('ModerationPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchModerationRequests).mockResolvedValue(mockRequestsRes);
  });

  it('renders page header with title and subtitle', async () => {
    render(<ModerationPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.moderation\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.moderation\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<ModerationPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.moderation\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders moderation request data in table when loaded', async () => {
    render(<ModerationPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.moderation\.title/i });
    await screen.findByText('INVOICE_APPROVAL', {}, { timeout: 3000 });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
