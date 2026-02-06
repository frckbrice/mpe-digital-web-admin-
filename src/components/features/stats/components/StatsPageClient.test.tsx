/**
 * Tests for StatsPageClient – detailed statistics page component.
 * Covers: page title, stat cards, and loading state.
 * Mocks: react-i18next, auth store, stats API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { StatsPageClient } from './StatsPageClient';

const { mockStats } = vi.hoisted(() => {
  const stats = {
    users: {
      total: 100,
      clients: 50,
      agents: 30,
      admins: 5,
      active: 95,
      newLast30Days: 10,
    },
    quotes: { total: 200, pending: 20, inProgress: 15, completed: 160, newLast30Days: 25 },
    messages: { total: 500, unread: 5, newLast30Days: 50 },
    documents: { total: 120 },
    recentQuotes: [] as const,
  };
  return { mockStats: stats };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/features/auth', () => {
  const adminUser = { id: '1', role: 'ADMIN' as const };
  return {
    useAuthStore: (selector: (s: { user: typeof adminUser }) => unknown) =>
      selector ? selector({ user: adminUser }) : { user: adminUser },
  };
});

vi.mock('../api/queries', () => ({
  fetchStats: vi.fn(() => Promise.resolve(mockStats)),
}));

describe('StatsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats page title', async () => {
    render(<StatsPageClient />);
    expect(await screen.findByText('dashboard.stats.title')).toBeInTheDocument();
  });

  it('renders stat values when loaded', async () => {
    render(<StatsPageClient />);
    await screen.findByText('dashboard.stats.title');
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('eventually shows stats content after load', async () => {
    render(<StatsPageClient />);
    await screen.findByText('dashboard.stats.title');
    expect(screen.getByText('dashboard.stats.subtitle')).toBeInTheDocument();
  });
});
