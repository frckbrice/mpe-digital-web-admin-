import type { Metadata } from 'next';
import { DashboardPageClient } from '@/components/features/dashboard-home';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'DB Digital Agency Dashboard',
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
