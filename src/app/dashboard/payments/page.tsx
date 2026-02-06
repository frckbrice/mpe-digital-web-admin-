import type { Metadata } from 'next';
import { PaymentsPageClient } from '@/components/features/payments';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Validate or reject payments',
};

export default function PaymentsPage() {
  return <PaymentsPageClient />;
}
