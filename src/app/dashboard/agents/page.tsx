import type { Metadata } from 'next';
import { AgentsPageClient } from '@/components/features/agents';

export const metadata: Metadata = {
  title: 'Agents',
  description: 'Manage agents',
};

export default function AgentsPage() {
  return <AgentsPageClient />;
}
