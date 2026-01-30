/**
 * Cloudinary upload – single source of truth
 *
 * All file uploads to Cloudinary in this app should go through this module.
 * Config and upload logic live here; API routes and features call this lib
 * to avoid duplicating credentials or upload logic.
 *
 * Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { createHmac } from 'crypto';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryUploadOptions {
  /** Optional folder in Cloudinary (e.g. "messages", "documents") */
  folder?: string;
  /** Original filename for display/organization */
  originalName?: string;
  /** MIME type of the file */
  mimeType?: string;
  /** File size in bytes (for response metadata) */
  size?: number;
}

/** Normalized result for use as message attachment or any consumer */
export interface CloudinaryUploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

const ENV_KEYS = {
  cloudName: 'CLOUDINARY_CLOUD_NAME',
  apiKey: 'CLOUDINARY_API_KEY',
  apiSecret: 'CLOUDINARY_API_SECRET',
} as const;

/**
 * Returns Cloudinary config from env. Use only on server.
 * Throws if any required key is missing.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env[ENV_KEYS.cloudName];
  const apiKey = process.env[ENV_KEYS.apiKey];
  const apiSecret = process.env[ENV_KEYS.apiSecret];

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary config missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Checks if Cloudinary is configured (all env vars present).
 * Safe to call from routes to decide between upload vs proxy.
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env[ENV_KEYS.cloudName] &&
    process.env[ENV_KEYS.apiKey] &&
    process.env[ENV_KEYS.apiSecret]
  );
}

function buildUploadSignature(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHmac('sha1', apiSecret).update(sorted).digest('hex');
}

/**
 * Uploads file bytes to Cloudinary (server-side). Single place for all upload config.
 *
 * @param fileBuffer - Raw file bytes (e.g. from FormData or request body)
 * @param options - Optional folder, originalName, mimeType, size for metadata
 * @returns Normalized result (url, name, size, type, uploadedAt) for attachments or any consumer
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = { timestamp };
  if (options.folder) params.folder = options.folder;

  const signature = buildUploadSignature(params, apiSecret);

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(fileBuffer)]), options.originalName || 'file');
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  if (options.folder) form.append('folder', options.folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message || data?.message || `Cloudinary upload failed (${res.status})`;
    throw new Error(msg);
  }

  const secureUrl = data.secure_url ?? data.url;
  if (!secureUrl) {
    throw new Error('Cloudinary did not return a URL');
  }

  const now = new Date().toISOString();
  return {
    url: secureUrl,
    name: options.originalName ?? data.original_filename ?? 'file',
    size: options.size ?? data.bytes ?? 0,
    type: options.mimeType ?? data.format ?? 'application/octet-stream',
    uploadedAt: data.created_at ?? now,
  };
}
