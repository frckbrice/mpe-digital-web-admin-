/**
 * Auth Feature - Mutations
 *
 * This module contains mutation functions for authentication operations.
 * All functions interact with Firebase Authentication and the backend API.
 *
 * Mutation Functions:
 * - loginWithEmail: Authenticates user with email/password
 * - loginWithGoogle: Authenticates user with Google OAuth
 * - logoutUser: Signs out the current user
 */

'use client';

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { ensureFirebaseInitialized } from '@/lib/firebase/firebase-client';
import { getApiErrorPayload } from '@/lib/utils/error-sanitizer';
import { authLog, authWarn } from '@/lib/utils/auth-logger';
import type { User } from '../store/authStore';

/**
 * Payload for email/password login
 */
export type LoginPayload = { email: string; password: string };

/**
 * Response type for login operations
 */
export type LoginResponse = { user: User; accessToken: string; refreshToken: string };

/**
 * Authenticates user with email and password
 *
 * Flow:
 * 1. Signs in with Firebase using email/password
 * 2. Retrieves Firebase ID token
 * 3. Calls backend /api/auth/me to verify token and get user data
 * 4. Validates user role (must be ADMIN or MODERATOR)
 * 5. Returns user data and tokens
 *
 * Endpoint: Uses Firebase Auth + GET /api/auth/me
 *
 * @param data - Login credentials
 * @param data.email - User email address
 * @param data.password - User password
 * @returns Promise resolving to LoginResponse with user data and tokens
 * @throws Error if authentication fails, user is not ADMIN/MODERATOR, or API call fails
 */
export async function loginWithEmail(data: LoginPayload): Promise<LoginResponse> {
  authLog('loginWithEmail: starting email/password sign-in', { email: data.email });
  const fb = ensureFirebaseInitialized();
  const cred = await signInWithEmailAndPassword(fb, data.email, data.password);
  authLog('loginWithEmail: Firebase sign-in OK, getting id token');
  const token = await cred.user.getIdToken();
  const { apiFetch } = await import('@/lib/api-client');
  authLog('loginWithEmail: calling /api/auth/me');

  const res = await apiFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Response not OK:', res, text);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorPayload(json, ''));

  const { user } = json;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw new Error('Access denied. Admin or Moderator only.');
  }

  return { user, accessToken: token, refreshToken: token };
}

export async function loginWithGoogle(): Promise<LoginResponse> {
  authLog('loginWithGoogle: starting Google sign-in popup');
  const fb = ensureFirebaseInitialized();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const cred = await signInWithPopup(fb, provider);
  authLog('loginWithGoogle: popup OK', { email: cred.user.email });
  const token = await cred.user.getIdToken();
  const { apiFetch } = await import('@/lib/api-client');
  authLog('loginWithGoogle: calling /api/auth/google');

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

  const json = (await res.json().catch(() => ({}))) as { user?: User } & Record<string, unknown>;
  if (!res.ok) throw new Error(getApiErrorPayload(json, 'Google sign-in failed'));

  const { user } = json;
  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    throw new Error('Access denied. Admin or Moderator only.');
  }

  return { user, accessToken: token, refreshToken: token };
}

/**
 * Signs out the current user
 *
 * Flow:
 * 1. Signs out from Firebase Authentication
 * 2. Calls backend /api/auth/logout to invalidate server-side session
 *
 * Both operations are attempted even if one fails, ensuring cleanup on both
 * client and server sides.
 *
 * Endpoints:
 * - Firebase signOut()
 * - POST /api/auth/logout
 *
 * @returns Promise that resolves when logout is complete
 * @throws Never throws - errors are logged but don't prevent logout
 */
export async function logoutUser(): Promise<void> {
  authLog('logoutUser: signing out Firebase');
  try {
    const fb = ensureFirebaseInitialized();
    await signOut(fb);
    authLog('logoutUser: Firebase signOut OK');
  } catch (e) {
    authWarn('logoutUser: Firebase signOut', e);
  }

  try {
    const { apiFetch } = await import('@/lib/api-client');
    await apiFetch('/api/auth/logout', { method: 'POST' });
    authLog('logoutUser: /api/auth/logout OK');
  } catch (e) {
    authWarn('logoutUser: /api/auth/logout', e);
  }
}
