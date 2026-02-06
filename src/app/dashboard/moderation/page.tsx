import type { Metadata } from 'next';
import { ModerationPageClient } from '@/components/features/moderation';

export const metadata: Metadata = {
  title: 'Moderation',
  description: 'Review and decide moderation requests',
};

export default function ModerationPage() {
  return <ModerationPageClient />;
}
