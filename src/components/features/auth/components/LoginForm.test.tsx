import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const mockMutate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'login.title': 'Admin Login',
        'login.description': 'Sign in to manage MPE Web app',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.emailPlaceholder': 'admin@example.com',
        'login.passwordPlaceholder': '••••••••',
        'login.login': 'Login',
        'login.loggingIn': 'Logging in...',
        'login.orContinueWith': 'Or continue with',
        'login.signInWithGoogle': 'Sign in with Google',
        'login.signingIn': 'Signing in...',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../api/useAuth', () => ({
  useLogin: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useGoogleLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('renders login form with title and fields', () => {
    render(<LoginForm />);
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  });

  it('renders Google sign-in button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('calls login mutation on form submit with email and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('admin@example.com'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123',
    });
  });

  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const passwordContainer = passwordInput.closest('.relative');
    const toggleButton = passwordContainer?.querySelector('button');
    expect(toggleButton).toBeInTheDocument();
    if (toggleButton) await user.click(toggleButton as HTMLElement);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('shows required validation on empty submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const form = screen.getByRole('button', { name: /^login$/i }).closest('form');
    if (form) {
      await user.click(screen.getByRole('button', { name: /^login$/i }));
      const emailInput = screen.getByPlaceholderText('admin@example.com');
      expect(emailInput).toBeRequired();
    }
  });
});
