/**
 * Tests for AuditPageClient – audit log page component.
 * Covers: page header, filters, and data table with mocked moderation decisions.
 * Mocks: react-i18next, audit API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { AuditPageClient } from './AuditPageClient';
import { fetchModerationDecisions } from '../api/queries';

const mockDecisionsRes = {
  success: true,
  data: [
    {
      id: '1',
      moderatorId: 'm1',
      actionType: 'INVOICE_APPROVAL',
      decision: 'APPROVED',
      entityType: 'Invoice',
      entityId: 'inv-1',
      comment: null,
      createdAt: '2025-01-01T12:00:00Z',
      moderator: { id: 'm1', email: 'mod@example.com', firstName: 'Mod', lastName: 'User' },
    },
  ],
  pagination: {
    page: 1,
    pageSize: 50,
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
  fetchModerationDecisions: vi.fn(() => Promise.resolve(mockDecisionsRes)),
}));

describe('AuditPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchModerationDecisions).mockResolvedValue(mockDecisionsRes);
  });

  it('renders page header with title and subtitle', async () => {
    render(<AuditPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.audit\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.audit\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<AuditPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.audit\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders audit data in table when loaded', async () => {
    render(<AuditPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.audit\.title/i });
    await screen.findByText('INVOICE_APPROVAL', {}, { timeout: 3000 });
    expect(screen.getByText('Mod User')).toBeInTheDocument();
    expect(screen.getByText('mod@example.com')).toBeInTheDocument();
  });
});
