'use client';

import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Check, X, Trash2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadDocument, updateDocumentStatus, deleteDocument } from '../api/mutations';
import { ADMIN_DOCUMENT_TYPES } from '../api/data';
import type { QuoteDetail } from '../api/types';

const MAX_FILE_MB = 10;

interface QuoteDocumentUploadDialogProps {
  quoteId: string;
  quote: QuoteDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuoteDocumentUploadDialog({ quoteId, quote, open, onClose, onSuccess }: QuoteDocumentUploadDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const [hasUploadFile, setHasUploadFile] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const quoteDetailKey = ['agent', 'quotes', quoteId];

  const uploadDocMu = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) => uploadDocument(quoteId, file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteDetailKey });
      onSuccess();
      toast.success(t('dashboard.quotes.documentUploaded'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setHasUploadFile(false);
      setUploadDocType('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const docStatusMu = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      updateDocumentStatus(id, { status, rejectionReason }),
    onSuccess: (_, v) => {
      setRejectDocId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: quoteDetailKey });
      onSuccess();
      toast.success(v.status === 'APPROVED' ? t('dashboard.quotes.documentApproved') : t('dashboard.quotes.documentRejected'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const docDeleteMu = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, id) => {
      setDeleteDocId(null);
      queryClient.invalidateQueries({ queryKey: quoteDetailKey });
      onSuccess();
      toast.success(t('dashboard.quotes.documentDeleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(t('dashboard.quotes.documentMaxSize', { mb: MAX_FILE_MB }));
        e.target.value = '';
        setHasUploadFile(false);
        return;
      }
      setHasUploadFile(!!f);
    } else {
      setHasUploadFile(false);
    }
  };

  const handleUpload = () => {
    const f = fileInputRef.current?.files?.[0];
    if (!f) {
      toast.error(t('dashboard.quotes.documentSelectFile'));
      return;
    }
    if (!uploadDocType) {
      toast.error(t('dashboard.quotes.documentSelectType'));
      return;
    }
    uploadDocMu.mutate({ file: f, documentType: uploadDocType });
  };

  const handleClose = () => {
    setUploadDocType('');
    setHasUploadFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setRejectDocId(null);
    setRejectReason('');
    setDeleteDocId(null);
    onClose();
  };

  const getDocumentTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  // Filter to show only admin documents
  const adminDocuments = quote.documents.filter((d) => ADMIN_DOCUMENT_TYPES.includes(d.documentType as any));
  const clientDocuments = quote.documents.filter((d) => !ADMIN_DOCUMENT_TYPES.includes(d.documentType as any));

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('dashboard.quotes.uploadDocuments')}</DialogTitle>
            <DialogDescription>{t('dashboard.quotes.uploadDocumentsDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto pr-2 -mr-2 flex-1">
            {/* Upload Section */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t('dashboard.quotes.uploadNewDocument')}</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>{t('dashboard.quotes.documentType')} *</Label>
                  <Select value={uploadDocType} onValueChange={setUploadDocType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('dashboard.quotes.selectDocumentType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {getDocumentTypeLabel(dt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.quotes.adminDocumentTypesHint')}
                  </p>
                </div>
                <div>
                  <Label>{t('dashboard.quotes.selectFile')} *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="mt-1 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.quotes.documentFormats')} ({t('dashboard.quotes.maxSize', { mb: MAX_FILE_MB })})
                  </p>
                </div>
                <Button onClick={handleUpload} disabled={!hasUploadFile || !uploadDocType || uploadDocMu.isPending} className="w-full sm:w-auto">
                  {uploadDocMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  {t('dashboard.quotes.documentUpload')}
                </Button>
              </div>
            </div>

            {/* Admin Documents Section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t('dashboard.quotes.adminDocuments')}</h4>
              </div>
              {adminDocuments.length > 0 ? (
                <div className="space-y-2">
                  {adminDocuments.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 border border-border rounded-md bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.originalName || d.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{getDocumentTypeLabel(d.documentType)}</span>
                          <span className="text-xs">
                            {d.status === 'APPROVED' && (
                              <span className="text-green-600 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                {t('common.approved')}
                              </span>
                            )}
                            {d.status === 'REJECTED' && (
                              <span className="text-red-600 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {t('common.rejected')}
                              </span>
                            )}
                            {!['APPROVED', 'REJECTED'].includes(d.status) && (
                              <span className="text-amber-600">{t('common.pending')}</span>
                            )}
                          </span>
                        </div>
                        {d.uploadedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.quotes.uploadedBy')}: {d.uploadedBy.firstName} {d.uploadedBy.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!['APPROVED', 'REJECTED'].includes(d.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-green-600 hover:text-green-700 border-green-600"
                              onClick={() => docStatusMu.mutate({ id: d.id, status: 'APPROVED' })}
                              disabled={docStatusMu.isPending}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-amber-600 hover:text-amber-700 border-amber-600"
                              onClick={() => {
                                setRejectDocId(d.id);
                                setRejectReason('');
                              }}
                              disabled={docStatusMu.isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDocId(d.id)}
                          disabled={docDeleteMu.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.quotes.noAdminDocuments')}</p>
              )}
            </div>

            {/* Client Documents Info - Only show if client has uploaded documents */}
            {clientDocuments.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100 mb-1">
                      {t('dashboard.quotes.clientDocuments')}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                      {t('dashboard.quotes.clientDocumentsDescription')}
                    </p>
                    <div className="space-y-1">
                      {clientDocuments.map((d) => (
                        <p key={d.id} className="text-xs text-amber-800 dark:text-amber-200">
                          • {d.originalName || d.fileName} ({getDocumentTypeLabel(d.documentType)})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject document dialog */}
      <Dialog open={!!rejectDocId} onOpenChange={(o) => !o && setRejectDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.quotes.documentRejectTitle')}</DialogTitle>
            <DialogDescription>{t('dashboard.quotes.documentRejectReasonRequired')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>{t('dashboard.quotes.rejectionReason')} *</Label>
            <Textarea
              placeholder={t('dashboard.quotes.documentRejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDocId(null); setRejectReason(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectDocId && rejectReason.trim() && docStatusMu.mutate({ id: rejectDocId, status: 'REJECTED', rejectionReason: rejectReason.trim() })}
              disabled={!rejectReason.trim() || docStatusMu.isPending}
            >
              {docStatusMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.quotes.documentReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete document confirm */}
      <Dialog open={!!deleteDocId} onOpenChange={(o) => !o && setDeleteDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.quotes.documentDeleteTitle')}</DialogTitle>
            <DialogDescription>{t('dashboard.quotes.documentDeleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteDocId && docDeleteMu.mutate(deleteDocId)} disabled={docDeleteMu.isPending}>
              {docDeleteMu.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.quotes.documentDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
