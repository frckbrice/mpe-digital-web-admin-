'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/utils/error-sanitizer';
import { authLog, authError } from '@/lib/utils/auth-logger';
import { loginWithEmail, loginWithGoogle, logoutUser } from './mutations';

export function useLogin() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: loginWithEmail,
    onSuccess: (data) => {
      authLog('useLogin: success, setting auth and redirecting to /dashboard', {
        userId: data.user.id,
      });
      setAuth(data);
      q.invalidateQueries();
      toast.success(t('login.loggedIn'));
      router.push('/dashboard');
    },
    onError: (e) => {
      authError('useLogin: error', e);
      const { message, translationKey } = getSafeErrorMessage(e, t('error.unexpectedError'));
      let displayMsg: string;
      if (message === 'Access denied. Admin or Moderator only.') {
        displayMsg = t('login.errors.access_denied');
      } else if (translationKey) {
        displayMsg = t(translationKey);
      } else {
        displayMsg = message || t('error.unexpectedError');
      }
      toast.error(displayMsg);
    },
  });
}

export function useGoogleLogin() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      authLog('useGoogleLogin: success, setting auth and redirecting', { userId: data.user.id });
      setAuth(data);
      q.invalidateQueries();
      toast.success(t('login.loggedIn'));
      router.push('/dashboard');
    },
    onError: (e) => {
      authError('useGoogleLogin: error', e);
      const { message, translationKey } = getSafeErrorMessage(
        e,
        t('login.errors.google_sign_in_failed')
      );
      toast.error(translationKey ? t(translationKey) : message);
    },
  });
}

export function useLogout() {
  const { t } = useTranslation();
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
      toast.success(t('login.loggedOut'));
    },
    onError: (e) => {
      authError('useLogout: error (still clearing and redirecting)', e);
      logout();
      q.clear();
      router.push('/login');
    },
  });
}
