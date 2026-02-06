/**
 * Tests for ProjectsPageClient – main projects list page component.
 * Covers: page header, filters, and data table with mocked project list.
 * Mocks: react-i18next, projects API queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { ProjectsPageClient } from './ProjectsPageClient';

const mockProjectsRes = {
  success: true,
  data: [
    {
      id: 'proj1',
      name: 'Project Alpha',
      status: 'IN_PROGRESS',
      progress: 60,
      contractId: 'c1',
      quoteId: 'q1',
      updatedAt: '2025-01-15T00:00:00Z',
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
  fetchProjects: vi.fn(() => Promise.resolve(mockProjectsRes)),
}));

describe('ProjectsPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with title and subtitle', async () => {
    render(<ProjectsPageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.projects\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard\.projects\.subtitle/i)).toBeInTheDocument();
  });

  it('renders filters section', async () => {
    render(<ProjectsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.projects\.title/i });
    expect(screen.getByText('common.filters')).toBeInTheDocument();
  });

  it('renders project data in table when loaded', async () => {
    render(<ProjectsPageClient />);
    await screen.findByRole('heading', { name: /dashboard\.projects\.title/i });
    expect(await screen.findByText('Project Alpha', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
  });
});
