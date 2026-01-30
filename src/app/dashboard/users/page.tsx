import type { Metadata } from 'next';
import { UsersPageClient } from '@/components/features/users';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage users',
};

export default function UsersPage() {
  return <UsersPageClient />;
}
