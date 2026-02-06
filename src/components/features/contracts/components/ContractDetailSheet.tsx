'use client';

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';
import { fetchContractDetail, fetchContractVersions } from '../api/queries';

export function ContractDetailSheet(props: {
  contractId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { contractId, open, onClose } = props;

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['contracts', 'detail', contractId],
    queryFn: () => fetchContractDetail(contractId),
    enabled: open && !!contractId,
  });

  const { data: versions, isLoading: isLoadingVersions } = useQuery({
    queryKey: ['contracts', 'versions', contractId],
    queryFn: () => fetchContractVersions(contractId),
    enabled: open && !!contractId,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('dashboard.contracts.detailTitle') || 'Contract detail'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">{t('common.details') || 'Details'}</div>
            {isLoadingDetail ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-80 whitespace-pre-wrap break-words">
                {JSON.stringify(detail?.data ?? detail ?? {}, null, 2)}
              </pre>
            )}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium mb-2">
              {t('dashboard.contracts.versions') || 'Versions'}
            </div>
            {isLoadingVersions ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-80 whitespace-pre-wrap break-words">
                {JSON.stringify(versions?.data ?? versions ?? {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
