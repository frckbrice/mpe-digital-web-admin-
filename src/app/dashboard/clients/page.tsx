import type { Metadata } from 'next';
import { ClientsPageClient } from '@/components/features/clients';

export const metadata: Metadata = {
  title: 'Clients',
  description: 'Manage clients',
};

export default function ClientsPage() {
  return <ClientsPageClient />;
}
