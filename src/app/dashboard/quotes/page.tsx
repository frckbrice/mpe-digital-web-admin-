import type { Metadata } from 'next';
import { QuotesPageClient } from '@/components/features/quotes';

export const metadata: Metadata = {
  title: 'Quotes',
  description: 'Manage quote requests',
};

export default function QuotesPage() {
  return <QuotesPageClient />;
}
