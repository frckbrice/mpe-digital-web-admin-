/**
 * Quotes feature - constants / data
 */

export const QUOTE_STATUSES = [
  'SUBMITTED', 'UNDER_REVIEW', 'QUOTE_PREPARED', 'QUOTE_SENT', 'CLIENT_REVIEWING',
  'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
] as const;

export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const UNASSIGNED = '__unassigned__';

/** Document types for upload (aligned with admin-tasks spec) */
export const DOCUMENT_TYPES = [
  'PROJECT_BRIEF', 'DESIGN_MOCKUP', 'LOGO_FILE', 'BRAND_GUIDELINES', 'CONTENT_DOCUMENT',
  'REFERENCE_IMAGE', 'CONTRACT', 'INVOICE', 'OTHER',
] as const;
