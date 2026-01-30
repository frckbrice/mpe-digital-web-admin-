/**
 * Auth Feature - Queries
 * 
 * This module contains query functions for fetching authentication-related data.
 * All functions interact with Firebase Authentication and the backend API.
 * 
 * Query Functions:
 * - getCurrentUser: Fetches the current authenticated user's data from the backend
 */

'use client';

import { ensureFirebaseInitialized } from '@/lib/firebase/firebase-client';
import { getApiErrorPayload } from '@/lib/utils/error-sanitizer';
import { authLog } from '@/lib/utils/auth-logger';
import type { User } from '../store/authStore';

/**
 * Response type for current user query
 */
export type CurrentUserResponse = { user: User };

/**
 * Fetches the current authenticated user's data from the backend
 * 
 * Endpoint: GET /api/auth/me
 * 
 * This function:
 * 1. Gets the current Firebase user
 * 2. Retrieves the Firebase ID token
 * 3. Calls the backend /api/auth/me endpoint with the token
 * 4. Returns the user data from the backend
 * 
 * The backend verifies the token and returns user data from the database.
 * This ensures the user data is always up-to-date with the backend state.
 * 
 * @returns Promise resolving to CurrentUserResponse with user data
 * @throws Error if no user is authenticated, token retrieval fails, or API call fails
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  authLog('getCurrentUser: getting Firebase token');
  const fb = ensureFirebaseInitialized();
  const user = fb.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const token = await user.getIdToken();
  const { apiFetch } = await import('@/lib/api-client');
  authLog('getCurrentUser: calling /api/auth/me');
  
  const res = await apiFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const json = (await res.json().catch(() => ({})));
  if (!res.ok) throw new Error(getApiErrorPayload(json, 'Failed to get current user'));
  
  return json as CurrentUserResponse;
}
