'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModeratorsPageClient } from './ModeratorsPageClient';
import { useAuthStore } from '@/components/features/auth';
import { Loader2 } from 'lucide-react';

export function ModeratorsPageClientWrapper() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only admins can access moderators management page
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-[#fe4438]" />
      </div>
    );
  }

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-[#fe4438]" />
      </div>
    );
  }

  return <ModeratorsPageClient />;
}
