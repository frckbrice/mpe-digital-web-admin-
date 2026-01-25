import { create } from 'zustand';
import { authLog, authError, authWarn } from '@/lib/utils/auth-logger';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
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
      localStorage.setItem('userCache', JSON.stringify({
        id: data.user.id, firstName: data.user.firstName, lastName: data.user.lastName,
        role: data.user.role, isVerified: data.user.isVerified, isActive: data.user.isActive,
      }));
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
      localStorage.setItem('userCache', JSON.stringify({
        id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, isVerified: u.isVerified, isActive: u.isActive,
      }));
    }
    set({ user: u });
  },

  logout: () => {
    authLog('logout: clearing state and local storage');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userCache');
      localStorage.removeItem('authTimestamp');
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  syncAuthState: async (firebaseUser, token) => {
    authLog('syncAuthState', { hasFirebaseUser: !!firebaseUser, hasToken: !!token });
    if (!firebaseUser) {
      authLog('syncAuthState: no Firebase user, clearing auth');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userCache');
        localStorage.removeItem('authTimestamp');
      }
      return;
    }

    try {
      authLog('syncAuthState: fetching /api/auth/me');
      const { apiFetch } = await import('@/lib/api-client');
      const res = await apiFetch('/api/auth/me');
      const data = await res.json().catch(() => ({})) as { user?: User; message?: string };
      if (!res.ok) throw new Error(data?.message || 'Failed to get user');
      const { user } = data;
      authLog('syncAuthState: /api/auth/me response', { userId: user?.id, role: user?.role, isActive: user?.isActive });

      if (!user?.isActive) {
        authLog('syncAuthState: user not active, clearing auth');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== 'undefined') { localStorage.removeItem('userCache'); localStorage.removeItem('authTimestamp'); }
        return;
      }

      // Admin app: only ADMIN role is allowed
      if (user.role !== 'ADMIN') {
        authLog('syncAuthState: user role is not ADMIN, clearing auth', { role: user.role });
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== 'undefined') { localStorage.removeItem('userCache'); localStorage.removeItem('authTimestamp'); }
        return;
      }

      authLog('syncAuthState: synced successfully', { userId: user.id, role: user.role });
      set({
        user,
        accessToken: token,
        refreshToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('userCache', JSON.stringify({
          id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role, isVerified: user.isVerified, isActive: user.isActive,
        }));
        localStorage.setItem('authTimestamp', Date.now().toString());
      }
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError && /fetch|network|failed to fetch/i.test(String((e as Error).message));
      if (isNetworkError) {
        authWarn(
          'syncAuthState: cannot reach MPE Web app API. Ensure it is running at NEXT_PUBLIC_LOCAL_APP_URL and CORS allows this app.',
          e
        );
      } else {
        authError('syncAuthState failed', e);
      }
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      if (typeof window !== 'undefined') { localStorage.removeItem('userCache'); localStorage.removeItem('authTimestamp'); }
    }
  },
}));
