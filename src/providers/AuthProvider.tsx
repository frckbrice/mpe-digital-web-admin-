'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ensureFirebaseInitialized } from '@/lib/firebase/firebase-client';
import { useAuthStore } from '@/components/features/auth/store/authStore';
import { setupTokenRefresh } from '@/lib/utils/token-refresh';
import { authLog, authError } from '@/lib/utils/auth-logger';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { syncAuthState, setLoading } = useAuthStore();

  useEffect(() => {
    authLog('AuthProvider: initializing');
    let auth: ReturnType<typeof ensureFirebaseInitialized> | null = null;
    try {
      auth = ensureFirebaseInitialized();
      authLog('AuthProvider: Firebase initialized, setting up onAuthStateChanged');
    } catch (e) {
      authError('AuthProvider: Firebase init failed', e);
      setLoading(false);
      return;
    }
    if (!auth) {
      authLog('AuthProvider: no auth instance, stopping');
      setLoading(false);
      return;
    }

    const cleanupToken = setupTokenRefresh();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      authLog('onAuthStateChanged', { hasUser: !!fbUser, uid: fbUser?.uid, email: fbUser?.email });
      if (fbUser) {
        try {
          const { getValidIdToken } = await import('@/lib/utils/token-refresh');
          const token = await getValidIdToken(false);
          authLog('AuthProvider: got id token', { hasToken: !!token });
          if (token) await syncAuthState(fbUser, token);
          else await syncAuthState(null, '');
        } catch (e) {
          authError('AuthProvider: sync error', e);
          await syncAuthState(null, '');
        }
      } else {
        authLog('AuthProvider: no Firebase user, syncing to clear');
        await syncAuthState(null, '');
      }
    }, (e) => {
      authError('AuthProvider: onAuthStateChanged error', e);
      setLoading(false);
    });

    return () => {
      authLog('AuthProvider: cleanup (unsubscribe + token refresh)');
      unsubscribe();
      cleanupToken();
    };
  }, [syncAuthState, setLoading]);

  return <>{children}</>;
}
