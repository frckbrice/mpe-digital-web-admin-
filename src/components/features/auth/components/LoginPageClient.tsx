'use client';

/**
 * Component: LoginPageClient
 * 
 * Client-side wrapper for the login page that handles authentication state and redirects.
 * 
 * Features:
 * - Checks authentication status on mount
 * - Redirects authenticated ADMIN/MODERATOR users to dashboard
 * - Shows loading state while checking authentication
 * - Renders LoginForm for unauthenticated users
 * 
 * Authentication Flow:
 * - Uses authStore to check if user is authenticated
 * - Only ADMIN and MODERATOR roles can access the admin app
 * - Automatically redirects authenticated users to /dashboard
 * 
 * State Management:
 * - Uses authStore (Zustand) for global authentication state
 * - Monitors isLoading, isAuthenticated, and user.role
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Login Page Client Component
 * 
 * Wrapper component that handles authentication state checks and redirects.
 * Only renders the login form if user is not authenticated or not an admin/moderator.
 */
export function LoginPageClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  );
}
