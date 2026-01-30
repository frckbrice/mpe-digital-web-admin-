'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/utils/error-sanitizer';
import { authLog, authError } from '@/lib/utils/auth-logger';
import { loginWithEmail, loginWithGoogle, logoutUser } from './mutations';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: loginWithEmail,
    onSuccess: (data) => {
      authLog('useLogin: success, setting auth and redirecting to /dashboard', { userId: data.user.id });
      setAuth(data);
      q.invalidateQueries();
      toast.success('Logged in');
      router.push('/dashboard');
    },
    onError: (e) => {
      authError('useLogin: error', e);
      const msg = e instanceof Error ? e.message : (e != null && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string' ? (e as { message: string }).message : String(e ?? ''));
      toast.error(msg);
    },
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      authLog('useGoogleLogin: success, setting auth and redirecting', { userId: data.user.id });
      setAuth(data);
      q.invalidateQueries();
      toast.success('Logged in');
      router.push('/dashboard');
    },
    onError: (e) => {
      authError('useGoogleLogin: error', e);
      toast.error(getSafeErrorMessage(e, 'Google login failed').message);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      authLog('useLogout: success, clearing store and redirecting to /login');
      logout();
      q.clear();
      router.push('/login');
      toast.success('Logged out');
    },
    onError: (e) => {
      authError('useLogout: error (still clearing and redirecting)', e);
      logout();
      q.clear();
      router.push('/login');
    },
  });
}
