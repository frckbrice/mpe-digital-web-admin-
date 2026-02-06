import type { Metadata } from 'next';
import { ContractsPageClient } from '@/components/features/contracts';

export const metadata: Metadata = {
  title: 'Contracts',
  description: 'Browse contracts (scopes)',
};

export default function ContractsPage() {
  return <ContractsPageClient />;
}
