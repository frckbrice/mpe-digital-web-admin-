import { auth } from '../firebase/firebase-client';
import { authLog, authError } from './auth-logger';

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 min before expiry

export async function getValidIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) {
    authLog('getValidIdToken: no currentUser, returning null');
    return null;
  }
  try {
    if (forceRefresh) {
      authLog('getValidIdToken: forceRefresh=true, refreshing');
      return await auth.currentUser.getIdToken(true);
    }
    const result = await auth.currentUser.getIdTokenResult();
    const exp = result.expirationTime ? new Date(result.expirationTime).getTime() : 0;
    const needsRefresh = exp - Date.now() < TOKEN_REFRESH_BUFFER;
    if (needsRefresh) {
      authLog('getValidIdToken: token near expiry, refreshing', { exp, now: Date.now() });
      return await auth.currentUser.getIdToken(true);
    }
    return result.token;
  } catch (e) {
    authError('getValidIdToken error', e);
    return null;
  }
}

export function setupTokenRefresh(intervalMs = 55 * 60 * 1000): () => void {
  authLog('setupTokenRefresh', { intervalMinutes: Math.round(intervalMs / 60 / 1000) });
  const id = setInterval(async () => {
    if (auth?.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
        authLog('setupTokenRefresh: token refreshed');
      } catch (e) {
        authError('setupTokenRefresh: token refresh failed', e);
      }
    }
  }, intervalMs);
  return () => clearInterval(id);
}
