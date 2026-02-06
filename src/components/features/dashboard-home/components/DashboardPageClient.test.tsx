/**
 * Tests for DashboardPageClient – main dashboard home component.
 * Covers admin view: stats loading, title, stat cards, and quick links.
 * Mocks: react-i18next, auth store (admin), dashboard + quotes API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { DashboardPageClient } from './DashboardPageClient';

const mockStats = {
  users: {
    total: 42,
    clients: 20,
    agents: 10,
    admins: 2,
    active: 40,
    newLast30Days: 5,
  },
  quotes: { total: 100, pending: 10, inProgress: 5, completed: 80, newLast30Days: 8 },
  messages: { total: 200, unread: 3, newLast30Days: 20 },
  documents: { total: 50 },
  recentQuotes: [
    { id: '1', referenceNumber: 'QR-001', status: 'SUBMITTED', submissionDate: '2025-01-01' },
  ],
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
  fetchAdminStats: vi.fn(() => Promise.resolve(mockStats)),
}));

vi.mock('@/components/features/quotes/api/queries', () => ({
  fetchAgentQuotes: vi.fn(() =>
    Promise.resolve({
      data: [],
      pagination: {
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title and subtitle for admin', async () => {
    render(<DashboardPageClient />);
    // Component fetches stats; wait for loading to finish and title to appear
    expect(await screen.findByText('dashboard.home.title')).toBeInTheDocument();
    expect(screen.getByText('dashboard.home.subtitle')).toBeInTheDocument();
  });

  it('renders stat cards with fetched counts', async () => {
    render(<DashboardPageClient />);
    await screen.findByText('dashboard.home.title');
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders quick links section', async () => {
    render(<DashboardPageClient />);
    await screen.findByText('dashboard.home.title');
    expect(screen.getByText('dashboard.home.quickLinks')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<DashboardPageClient />);
    // Loader is present while fetching (Loader2 has animate-spin)
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });
});
