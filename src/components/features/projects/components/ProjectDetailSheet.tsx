'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { fetchProjectDetail } from '../api/queries';

export function ProjectDetailSheet(props: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { projectId, open, onClose } = props;

  const { data: detail, isLoading } = useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: () => fetchProjectDetail(projectId),
    enabled: open && !!projectId,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('dashboard.projects.detailTitle') || 'Project detail'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 rounded-md border p-3">
          <div className="text-sm font-medium mb-2">{t('common.details') || 'Details'}</div>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <pre className="text-xs overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
              {JSON.stringify(detail?.data ?? detail ?? {}, null, 2)}
            </pre>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
