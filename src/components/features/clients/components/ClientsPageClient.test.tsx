/**
 * Tests for ClientsPageClient – main clients list page component.
 * Covers: page header, filters, and data table with mocked client list.
 * Mocks: react-i18next, clients API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ClientsPageClient } from './ClientsPageClient';
import { fetchClients } from '../api/queries';

const mockClientsRes = {
  success: true,
  data: [
    {
      id: '1',
      email: 'client@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      _count: { quoteRequests: 3 },
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

vi.mock('../api/queries', () => ({
  fetchClients: vi.fn(() => Promise.resolve(mockClientsRes)),
}));

describe('ClientsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<ClientsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.clients\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText('dashboard.clients.subtitleReadOnly')).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<ClientsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.clients\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders client data in table when loaded', async () => {
    render(<ClientsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.clients\.title/i });
    await screen.findByText('Jane Doe', {}, { timeout: 3000 });
    expect(screen.getByText('client@example.com')).toBeInTheDocument();
  });
});
