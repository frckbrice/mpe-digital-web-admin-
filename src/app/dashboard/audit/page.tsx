import type { Metadata } from 'next';
import { AuditPageClient } from '@/components/features/audit';

export const metadata: Metadata = {
  title: 'Audit',
  description: 'Moderation decisions audit log',
};

export default function AuditPage() {
  return <AuditPageClient />;
}
