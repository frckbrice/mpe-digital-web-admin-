'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (isDev) {
      console.error('Dashboard error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">{t('error.somethingWentWrong')}</h2>
      <p className="text-muted-foreground text-sm">{error.message || t('error.unexpectedError')}</p>
      <Button onClick={reset} variant="outline">
        {t('error.tryAgain')}
      </Button>
    </div>
  );
}
