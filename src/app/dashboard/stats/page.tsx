import type { Metadata } from 'next';
import { StatsPageClient } from '@/components/features/stats';

export const metadata: Metadata = {
  title: 'Statistics',
  description: 'View dashboard statistics',
};

export default function StatsPage() {
  return <StatsPageClient />;
}
