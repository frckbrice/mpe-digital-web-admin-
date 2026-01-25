// Firebase Admin SDK configuration for server-side operations
// Same pattern as MPE Web app: supports service account file (dev) or env vars (production)

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { authError } from '../utils/auth-logger';
import { sanitizeFirebaseError } from '../utils/error-sanitizer';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    if (!adminAuth) {
      adminAuth = getAuth(adminApp);
    }
    return;
  }


  // FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL: for production (Vercel etc.)
  const hasIndividualVars =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL;

  if (!hasIndividualVars) {
    console.warn(
      'Firebase Admin credentials not found. Firebase Admin features will not be available.'
    );
    return;
  }

  console.log("[firebase admin ] hasIndividualVars", hasIndividualVars)

  try {
    let initConfig;


    const missingVars: string[] = [];
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID.trim() === '') {
      missingVars.push('FIREBASE_PROJECT_ID');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.trim() === '') {
      missingVars.push('FIREBASE_PRIVATE_KEY');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL.trim() === '') {
      missingVars.push('FIREBASE_CLIENT_EMAIL');
    }
    if (missingVars.length > 0) {
      throw new Error(
        `Missing or empty required Firebase environment variable(s): ${missingVars.join(', ')}`
      );
    }
    initConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      }),
    };


    adminApp = initializeApp(initConfig);
    adminAuth = getAuth(adminApp);
  } catch (error) {
    authError('Firebase Admin init failed', error);
    throw new Error(sanitizeFirebaseError(error));
  }
};

initializeFirebaseAdmin();

export { adminApp, adminAuth };
