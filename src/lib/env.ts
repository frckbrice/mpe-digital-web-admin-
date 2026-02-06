import { z } from 'zod';

/**
 * Schema for required environment variables.
 * Validated at build/start so the app fails fast with clear errors.
 */
const envSchema = z.object({
  // Firebase (client) – required for auth
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID is required'),

  // MPE Web app URL – at least one required (dev vs prod)
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_LOCAL_APP_URL: z.string().url().optional().or(z.literal('')),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const raw = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_LOCAL_APP_URL: process.env.NEXT_PUBLIC_LOCAL_APP_URL,
  };
  return envSchema.parse(raw);
}

/** Validates env and throws with a clear message if invalid. Call at build/start. */
export function validateEnv(): Env {
  return getEnv();
}

/** Optional: validate that at least one MPE Web app URL is set (for runtime). */
export function requireMpeWebAppUrl(): void {
  const env = getEnv();
  const hasProd = env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL.length > 0;
  const hasLocal = env.NEXT_PUBLIC_LOCAL_APP_URL && env.NEXT_PUBLIC_LOCAL_APP_URL.length > 0;
  if (!hasProd && !hasLocal) {
    throw new Error(
      'At least one of NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_LOCAL_APP_URL must be set.'
    );
  }
}
