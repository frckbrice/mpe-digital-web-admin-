import type { MetadataRoute } from 'next';

/**
 * Admin app: disallow all crawlers to avoid indexing sensitive UI.
 * Aligns with metadata.robots in root layout.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '', disallow: '/' },
    sitemap: undefined,
  };
}
