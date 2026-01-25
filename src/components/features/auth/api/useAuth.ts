'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { ensureFirebaseInitialized } from '@/lib/firebase/firebase-client';
import { useAuthStore, type User } from '../store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/utils/error-sanitizer';
import { authLog, authError, authWarn } from '@/lib/utils/auth-logger';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      authLog('useLogin: starting email/password sign-in', { email: data.email });
      const fb = ensureFirebaseInitialized();
      const cred = await signInWithEmailAndPassword(fb, data.email, data.password);
      authLog('useLogin: Firebase sign-in OK, getting id token');
      const token = await cred.user.getIdToken();
      const { apiFetch } = await import('@/lib/api-client');
      authLog('useLogin: calling /api/auth/me');
      // Pass token explicitly: auth.currentUser can lag briefly after sign-in, so getValidIdToken
      // may be null in apiFetch. Sending the token we just got avoids that race in production.
      const res = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({})) as { user?: User; message?: string };
      if (!res.ok) throw new Error(json?.message || 'Failed to get user');
      const { user } = json;
      authLog('useLogin: /api/auth/me', { userId: user?.id, role: user?.role });
      if (!user || user.role !== 'ADMIN') throw new Error('Access denied. Admin only.');
      return { user, accessToken: token, refreshToken: token };
    },
    onSuccess: (data) => {
      authLog('useLogin: success, setting auth and redirecting to /dashboard', { userId: data.user.id });
      setAuth(data);
      q.invalidateQueries();
      toast.success('Logged in');
      router.push('/dashboard');
    },
    onError: (e) => {
      authError('useLogin: error', e);
      toast.error(getSafeErrorMessage(e, 'Login failed').message);
    },
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const q = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      authLog('useGoogleLogin: starting Google sign-in popup');
      const fb = ensureFirebaseInitialized();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const cred = await signInWithPopup(fb, provider);
      authLog('useGoogleLogin: popup OK', { email: cred.user.email });
      const token = await cred.user.getIdToken();
      const { apiFetch } = await import('@/lib/api-client');
      authLog('useGoogleLogin: calling /api/auth/google');
      // Pass token in Authorization and in body so MPE Web can verify even if auth.currentUser lags.
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          idToken: token,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
        }),
      });
      if (!res.ok) throw new Error('Google sign-in failed');
      const { user } = await res.json();
      authLog('useGoogleLogin: /api/auth/google', { userId: user?.id, role: user?.role });
      if (user?.role !== 'ADMIN') throw new Error('Access denied. Admin only.');
      return { user, accessToken: token, refreshToken: token };
    },
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
    mutationFn: async () => {
      authLog('useLogout: signing out Firebase');
      try {
        const fb = ensureFirebaseInitialized();
        await signOut(fb);
        authLog('useLogout: Firebase signOut OK');
      } catch (e) {
        authWarn('useLogout: Firebase signOut', e);
      }
      try {
        const { apiFetch } = await import('@/lib/api-client');
        await apiFetch('/api/auth/logout', { method: 'POST' });
        authLog('useLogout: /api/auth/logout OK');
      } catch (e) {
        authWarn('useLogout: /api/auth/logout', e);
      }
    },
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
