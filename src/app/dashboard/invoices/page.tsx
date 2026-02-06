import type { Metadata } from 'next';
import { InvoicesPageClient } from '@/components/features/invoices';

export const metadata: Metadata = {
  title: 'Invoices',
  description: 'Browse invoices',
};

export default function InvoicesPage() {
  return <InvoicesPageClient />;
}
