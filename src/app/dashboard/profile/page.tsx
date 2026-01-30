import type { Metadata } from 'next';
import { ProfilePageClient } from '@/components/features/dashboard-profile';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'User profile settings',
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
