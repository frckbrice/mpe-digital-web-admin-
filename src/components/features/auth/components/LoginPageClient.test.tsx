/**
 * Tests for LoginPageClient – login page wrapper (auth state + redirect).
 * Covers: loading state, redirect when authenticated, and LoginForm when unauthenticated.
 * Mocks: react-i18next, next/navigation, auth store.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import { LoginPageClient } from './LoginPageClient';

const mockReplace = vi.hoisted(() => vi.fn());
const mockUseAuthStore = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('../api/useAuth', () => ({
  useLogin: () => ({ mutate: vi.fn(), isPending: false }),
  useGoogleLogin: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('LoginPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  });

  it('renders LoginForm when not loading and not authenticated', async () => {
    render(<LoginPageClient />);
    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login\.login/i })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });
    render(<LoginPageClient />);
    expect(document.querySelector('[class*="animate-spin"]')).toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });
});
