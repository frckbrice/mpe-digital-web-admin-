// Firebase client configuration – same as MPE Web app

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { sanitizeFirebaseError } from '@/lib/utils/error-sanitizer';
import { authLog, authError } from '@/lib/utils/auth-logger';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let isInitializing = false;
let initializationError: Error | null = null;

const initializeFirebaseClient = () => {
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    authLog('Firebase: reusing existing app');
    return;
  }
  if (isInitializing) return;

  isInitializing = true;
  initializationError = null;
  authLog('Firebase: initializing');

  const missingVars: string[] = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missingVars.length > 0) {
    initializationError = new Error(`Missing Firebase env: ${missingVars.join(', ')}`);
    isInitializing = false;
    authError('Firebase: missing env', missingVars);
    throw new Error('Firebase configuration error. Check your .env file.');
  }

  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    };
    try {
      app = getApp();
    } catch {
      app = initializeApp(firebaseConfig);
    }
    auth = getAuth(app);
    if (typeof window !== 'undefined' && auth) {
      setPersistence(auth, browserLocalPersistence).catch((e) => authError('Firebase persistence failed', e));
    }
    authLog('Firebase: initialized', { projectId: firebaseConfig.projectId });
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    authError('Firebase init failed', error);
    throw new Error(sanitizeFirebaseError(error));
  } finally {
    isInitializing = false;
  }
};

if (typeof window !== 'undefined') {
  try {
    initializeFirebaseClient();
  } catch (e) {
    authError('Firebase init on load', e);
  }
}

export function ensureFirebaseInitialized(): Auth {
  if (typeof window === 'undefined') throw new Error('Firebase can only be initialized in the browser');
  if (initializationError) {
    authLog('ensureFirebaseInitialized: previous init error', { message: initializationError.message });
    throw new Error(sanitizeFirebaseError(initializationError));
  }
  if (!auth) {
    try {
      initializeFirebaseClient();
    } catch (e) {
      authError('ensureFirebaseInitialized: init failed', e);
      throw new Error(sanitizeFirebaseError(e));
    }
  }
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  return auth;
}

export { app, auth };
