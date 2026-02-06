import { create } from 'zustand';
import { toast } from 'sonner';
import i18n from '@/lib/i18n/config';
import { authLog, authError, authWarn } from '@/lib/utils/auth-logger';
import { getApiErrorPayload } from '@/lib/utils/error-sanitizer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: 'CLIENT' | 'AGENT' | 'MODERATOR' | 'ADMIN';
  isVerified: boolean;
  isActive: boolean;
  firebaseId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { user: User; accessToken: string; refreshToken?: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
  syncAuthState: (firebaseUser: unknown, token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (data) => {
    authLog('setAuth', { userId: data.user.id, email: data.user.email, role: data.user.role });
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'userCache',
        JSON.stringify({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          isVerified: data.user.isVerified,
          isActive: data.user.isActive,
        })
      );
      localStorage.setItem('authTimestamp', Date.now().toString());
    }
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (u) => {
    authLog('setUser', { userId: u.id, role: u.role });
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'userCache',
        JSON.stringify({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isVerified: u.isVerified,
          isActive: u.isActive,
        })
      );
    }
    set({ user: u });
  },

  logout: () => {
    authLog('logout: clearing state and local storage');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userCache');
      localStorage.removeItem('authTimestamp');
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  syncAuthState: async (firebaseUser, token) => {
    authLog('syncAuthState', { hasFirebaseUser: !!firebaseUser, hasToken: !!token });
    if (!firebaseUser) {
      authLog('syncAuthState: no Firebase user, clearing auth');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userCache');
        localStorage.removeItem('authTimestamp');
      }
      return;
    }

    try {
      authLog('syncAuthState: fetching /api/auth/me');
      const { apiFetch } = await import('@/lib/api-client');
      const { getValidIdToken } = await import('@/lib/utils/token-refresh');
      // Ensure we have a token: if token is empty but firebaseUser exists, try to get it directly
      let finalToken = token;
      if (
        !finalToken &&
        firebaseUser &&
        typeof firebaseUser === 'object' &&
        'getIdToken' in firebaseUser
      ) {
        authLog('syncAuthState: token empty, trying getIdToken from firebaseUser');
        try {
          finalToken = await (firebaseUser as { getIdToken: () => Promise<string> }).getIdToken();
        } catch (e) {
          authWarn('syncAuthState: getIdToken from firebaseUser failed', e);
        }
      }
      // Pass token explicitly: if auth is null or getValidIdToken fails in apiFetch, we still send a valid request.
      let res = await apiFetch(
        '/api/auth/me',
        finalToken ? { headers: { Authorization: `Bearer ${finalToken}` } } : {}
      );
      let data = (await res.json().catch(() => ({}))) as { user?: User; code?: string } & Record<
        string,
        unknown
      >;
      // On 401 with TOKEN_INVALID, retry once with a force-refreshed token (handles expiry race).
      if (res.status === 401 && data?.code === 'TOKEN_INVALID') {
        authLog('syncAuthState: 401 TOKEN_INVALID, retrying with force refresh');
        let refreshed = await getValidIdToken(true);
        // Fallback: if getValidIdToken fails, try direct getIdToken from firebaseUser
        if (
          !refreshed &&
          firebaseUser &&
          typeof firebaseUser === 'object' &&
          'getIdToken' in firebaseUser
        ) {
          try {
            refreshed = await (
              firebaseUser as { getIdToken: (forceRefresh?: boolean) => Promise<string> }
            ).getIdToken(true);
          } catch (e) {
            authWarn('syncAuthState: force getIdToken from firebaseUser failed', e);
          }
        }
        if (refreshed) {
          finalToken = refreshed; // Update finalToken with refreshed value
          res = await apiFetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${refreshed}` },
          });
          data = (await res.json().catch(() => ({}))) as { user?: User } & Record<string, unknown>;
        }
      }
      if (!res.ok) throw new Error((data?.message as string) || 'Request failed');
      const { user } = data;
      authLog('syncAuthState: /api/auth/me response', {
        userId: user?.id,
        role: user?.role,
        isActive: user?.isActive,
      });

      if (!user?.isActive) {
        authLog('syncAuthState: user not active, clearing auth');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userCache');
          localStorage.removeItem('authTimestamp');
        }
        return;
      }

      // Admin app: only ADMIN and MODERATOR roles are allowed
      if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        authLog('syncAuthState: user role is not ADMIN or MODERATOR, clearing auth', {
          role: user.role,
        });
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userCache');
          localStorage.removeItem('authTimestamp');
        }
        return;
      }

      authLog('syncAuthState: synced successfully', { userId: user.id, role: user.role });
      // Use finalToken if we got it, otherwise fall back to original token
      const savedToken = finalToken || token;
      set({
        user,
        accessToken: savedToken,
        refreshToken: savedToken,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'userCache',
          JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
          })
        );
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : '';
      const msg = rawMsg || i18n.t('error.syncFailed');
      const isNetworkError =
        e instanceof TypeError &&
        /fetch|network|failed to fetch/i.test(String((e as Error).message));
      if (isNetworkError) {
        authWarn(
          'syncAuthState: cannot reach MPE Web app API. Ensure it is running at NEXT_PUBLIC_LOCAL_APP_URL and CORS allows this app.',
          e
        );
      } else {
        authError('syncAuthState failed', e);
      }
      if (typeof window !== 'undefined') {
        let displayMsg = msg;
        if (/failed to fetch|network|econnrefused/i.test(rawMsg)) {
          displayMsg = i18n.t('error.networkUnreachable');
        } else if (rawMsg === 'Request failed') {
          displayMsg = i18n.t('error.requestFailed');
        }
        toast.error(displayMsg);
      }
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userCache');
        localStorage.removeItem('authTimestamp');
      }
    }
  },
}));
