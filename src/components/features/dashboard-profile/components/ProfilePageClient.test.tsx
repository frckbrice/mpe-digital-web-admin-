/**
 * Tests for ProfilePageClient – user profile page component.
 * Covers: page header, profile display when user is set, loading state when user is null.
 * Mocks: react-i18next, auth store, profile mutations, toast.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { useAuthStore } from '@/components/features/auth';
import { ProfilePageClient } from './ProfilePageClient';

const mockUser = {
  id: '1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '+33123456789',
  role: 'ADMIN' as const,
  isVerified: true,
  isActive: true,
};

const mockSetUser = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/features/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../api/mutations', () => ({
  updateProfile: vi.fn(() => Promise.resolve({ user: mockUser })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ProfilePageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
    } as ReturnType<typeof useAuthStore>);
  });

  it('renders loading state when user is null', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      setUser: mockSetUser,
    } as ReturnType<typeof useAuthStore>);
    render(<ProfilePageClient />);
    expect(
      screen.queryByRole('heading', { name: /dashboard\.profile\.title/i })
    ).not.toBeInTheDocument();
    expect(document.querySelector('[class*="animate-spin"]')).toBeInTheDocument();
  });

  it('renders page title and subtitle when user is set', async () => {
    render(<ProfilePageClient />);
    expect(
      await screen.findByRole('heading', { name: /dashboard\.profile\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText('dashboard.profile.subtitle')).toBeInTheDocument();
  });

  it('renders user name and email when user is set', async () => {
    render(<ProfilePageClient />);
    await screen.findByRole('heading', { name: /dashboard\.profile\.title/i });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    const emails = screen.getAllByText('user@example.com');
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails[0]).toBeInTheDocument();
  });

  it('renders edit profile button when not editing', async () => {
    render(<ProfilePageClient />);
    await screen.findByRole('heading', { name: /dashboard\.profile\.title/i });
    expect(
      screen.getByRole('button', { name: /dashboard\.profile\.editProfile/i })
    ).toBeInTheDocument();
  });
});
