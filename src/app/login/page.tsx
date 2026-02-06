import type { Metadata } from 'next';
import { LoginPageClient } from '@/components/features/auth/components/LoginPageClient';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to DB Digital Agency',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
