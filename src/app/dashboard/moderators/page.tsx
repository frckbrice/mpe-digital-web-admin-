import type { Metadata } from 'next';
import { ModeratorsPageClientWrapper } from '@/components/features/moderators/components/ModeratorsPageClientWrapper';

export const metadata: Metadata = {
  title: 'Moderators',
  description: 'Manage moderators',
};

export default function ModeratorsPage() {
  return <ModeratorsPageClientWrapper />;
}
