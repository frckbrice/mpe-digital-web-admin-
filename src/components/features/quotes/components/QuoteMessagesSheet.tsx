'use client';

import { useTranslation } from 'react-i18next';
import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Send,
  MessageSquare,
  Mail,
  Paperclip,
  FileIcon,
  X,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { sendMessage, uploadMessageAttachment } from '../api/mutations';
import { fetchQuotes, fetchQuoteDetail } from '../api/queries';
import type { QuoteDetail, MessageAttachment, QuoteRow } from '../api/types';

interface QuoteMessagesSheetProps {
  quoteId?: string; // Optional - can be passed or selected via dropdown
  quote?: QuoteDetail | null; // Optional - can be passed or fetched
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getStatusTranslationKey(status: string): string {
  const statusMap: Record<string, string> = {
    SUBMITTED: 'dashboard.quotes.statusSubmitted',
    UNDER_REVIEW: 'dashboard.quotes.statusUnderReview',
    QUOTE_PREPARED: 'dashboard.quotes.statusQuotePrepared',
    QUOTE_SENT: 'dashboard.quotes.statusQuoteSent',
    CLIENT_REVIEWING: 'dashboard.quotes.statusClientReviewing',
    ACCEPTED: 'dashboard.quotes.statusAccepted',
    REJECTED: 'dashboard.quotes.statusRejected',
    IN_PROGRESS: 'dashboard.quotes.statusInProgress',
    COMPLETED: 'dashboard.quotes.statusCompleted',
    CANCELLED: 'dashboard.quotes.statusCancelled',
  };
  return statusMap[status] || status;
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'accent' {
  if (['SUBMITTED', 'UNDER_REVIEW', 'QUOTE_PREPARED', 'QUOTE_SENT', 'CLIENT_REVIEWING'].includes(s))
    return 'secondary';
  if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(s)) return 'default';
  if (['REJECTED', 'CANCELLED'].includes(s)) return 'destructive';
  return 'outline';
}

export function QuoteMessagesSheet({
  quoteId: initialQuoteId,
  quote: initialQuote,
  open,
  onClose,
  onSuccess,
}: QuoteMessagesSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedQuoteId, setSelectedQuoteId] = useState(initialQuoteId || '');
  const [msgRecipientId, setMsgRecipientId] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch quotes list for dropdown
  const {
    data: quotesData,
    isLoading: isLoadingQuotes,
    isError: isErrorLoadingQuotes,
    refetch: refetchQuotes,
  } = useQuery({
    queryKey: ['admin', 'quotes', null, null, null, null, 1, 100],
    queryFn: () => fetchQuotes({ page: 1, pageSize: 100 }),
    enabled: open,
    refetchOnMount: true,
    staleTime: 30 * 1000,
  });

  const quotes = useMemo(() => quotesData?.data || [], [quotesData?.data]);

  // Fetch quote detail when quoteId is selected (admin endpoint for internalNotes)
  const { data: quoteDetailResult, isLoading: isLoadingQuoteDetail } = useQuery({
    queryKey: ['admin', 'quotes', selectedQuoteId],
    queryFn: () => fetchQuoteDetail(selectedQuoteId),
    enabled: !!selectedQuoteId && open,
  });

  // Use initial quote if provided, otherwise use fetched quote detail (result is { quote, etag })
  const quote = initialQuote ?? quoteDetailResult?.quote ?? null;

  // Derive default recipient from quote when available (avoids setState in effect)
  const effectiveRecipientId = msgRecipientId || (quote?.client?.id ?? '');

  const sendMsgMu = useMutation({
    mutationFn: (body: {
      recipientId: string;
      content: string;
      subject?: string;
      attachments?: MessageAttachment[];
      quoteId: string;
    }) => sendMessage({ ...body, quoteId: body.quoteId }),
    onSuccess: () => {
      setMsgContent('');
      setMsgSubject('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes', selectedQuoteId] });
      onSuccess();
      toast.success(t('dashboard.quotes.messageSent'));
    },
    onError: (e: Error) => toast.error(e?.message || t('error.unexpectedError')),
  });

  const handleSend = useCallback(() => {
    if (!selectedQuoteId) {
      toast.error(t('dashboard.quotes.selectQuoteFirst'));
      return;
    }
    if (!effectiveRecipientId) {
      toast.error(t('dashboard.quotes.messageRecipientRequired'));
      return;
    }
    if (!msgContent.trim()) {
      toast.error(t('dashboard.quotes.messageContentRequired'));
      return;
    }
    sendMsgMu.mutate({
      recipientId: effectiveRecipientId,
      content: msgContent.trim(),
      subject: msgSubject.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      quoteId: selectedQuoteId,
    });
  }, [
    selectedQuoteId,
    effectiveRecipientId,
    msgContent,
    msgSubject,
    attachments,
    sendMsgMu,
    t,
  ]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      if (attachments.length + fileArray.length > 3) {
        toast.error(t('dashboard.quotes.maxAttachmentsReached'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      const isImage = (t: string) => t.startsWith('image/');
      const isPDF = (t: string) => t === 'application/pdf';
      const isWord = (t: string) =>
        t === 'application/msword' ||
        t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isValidType = (t: string) => isImage(t) || isPDF(t) || isWord(t);

      // Validate all files before starting uploads
      for (const file of fileArray) {
        if (file.size > maxSize) {
          toast.error(
            `${file.name}: ${t('dashboard.quotes.fileTooLarge') || 'File size exceeds 10MB'}`
          );
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        if (!isValidType(file.type)) {
          toast.error(`${file.name}: ${t('dashboard.quotes.invalidFileType')}`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }

      setIsUploading(true);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const results = await Promise.allSettled(
        fileArray.map((file) => uploadMessageAttachment(file))
      );

      const uploadedAttachments: MessageAttachment[] = [];
      const errors: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          uploadedAttachments.push(result.value);
        } else {
          errors.push(
            fileArray[i].name +
            ': ' +
            (result.reason?.message ?? t('dashboard.quotes.uploadFailed'))
          );
        }
      });

      if (uploadedAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...uploadedAttachments]);
        if (uploadedAttachments.length === fileArray.length) {
          toast.success(t('dashboard.quotes.filesUploaded'));
        } else {
          toast.warning(
            t('dashboard.quotes.partialUploadWarning', {
              uploaded: uploadedAttachments.length,
              total: fileArray.length,
              errors: errors.join(' '),
            })
          );
        }
      }
      if (errors.length > 0 && uploadedAttachments.length === 0) {
        toast.error(errors[0] || t('dashboard.quotes.uploadFailed'));
      }

      setIsUploading(false);
    },
    [attachments.length, t]
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClose = () => {
    setMsgContent('');
    setMsgSubject('');
    setAttachments([]);
    setSelectedQuoteId(initialQuoteId || '');
    setMsgRecipientId('');
    onClose();
  };

  const handleQuoteChange = useCallback((value: string) => {
    setSelectedQuoteId(value);
    setMsgRecipientId(''); // Reset recipient when quote changes
  }, []);

  const isFormValid = useMemo(
    () => selectedQuoteId && effectiveRecipientId && msgContent.trim(),
    [selectedQuoteId, effectiveRecipientId, msgContent]
  );

  // Form content component (matching EmailComposer layout)
  const FormContent = useMemo(
    () => (
      <div className="space-y-4 sm:space-y-6 px-0 sm:px-1">
        {/* Quote Selector - Required */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="quote-select"
              className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 text-foreground"
            >
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-primary" />
              <span className="truncate">
                {t('dashboard.quotes.selectQuote') || 'Select Quote'}
              </span>
              <span className="text-primary">*</span>
            </Label>
            {quotes.length > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
              </span>
            )}
          </div>

          {isLoadingQuotes ? (
            <div className="space-y-2">
              <div className="h-14 w-full rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>
          ) : isErrorLoadingQuotes ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-red-700 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{t('dashboard.quotes.unableToLoadQuotes')}</p>
                  <p className="text-xs mt-1 opacity-90">{t('dashboard.quotes.quotesLoadError')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchQuotes()}
                className="w-full h-10"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('common.retry') || 'Retry'}
              </Button>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex items-start gap-3 text-sm text-amber-700 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('dashboard.quotes.noQuotesFound')}</p>
                <p className="text-xs mt-1 opacity-90">
                  {t('dashboard.quotes.noQuotesAvailable') ||
                    'Please create a quote first to send messages.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Select value={selectedQuoteId} onValueChange={handleQuoteChange}>
                <SelectTrigger
                  id="quote-select"
                  className="h-12 sm:h-14 transition-all text-sm sm:text-base text-foreground bg-input border border-primary/30 hover:border-primary/50 focus:border-primary [&[data-placeholder]]:text-muted-foreground"
                >
                  {selectedQuoteId ? (
                    <SelectValue>
                      {(() => {
                        const selectedQuote = quotes.find(
                          (q: QuoteRow) => q.id === selectedQuoteId
                        );
                        if (!selectedQuote) return null;

                        return (
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-sm text-foreground">
                                {selectedQuote.referenceNumber}
                              </span>
                              <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                <Briefcase className="h-3 w-3 text-primary" />
                                {selectedQuote.client.firstName} {selectedQuote.client.lastName}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusVariant(selectedQuote.status) === 'secondary'
                                ? 'bg-blue-100 text-blue-700'
                                : statusVariant(selectedQuote.status) === 'default'
                                  ? 'bg-green-100 text-green-700'
                                  : statusVariant(selectedQuote.status) === 'destructive'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                              {t(getStatusTranslationKey(selectedQuote.status))}
                            </span>
                          </div>
                        );
                      })()}
                    </SelectValue>
                  ) : (
                    <SelectValue
                      placeholder={
                        t('dashboard.quotes.chooseQuotePlaceholder') ||
                        'Choose a quote to continue...'
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover border-border">
                  {quotes.map((quoteItem: QuoteRow) => {
                    const statusColor =
                      statusVariant(quoteItem.status) === 'secondary'
                        ? 'bg-blue-100 text-blue-700'
                        : statusVariant(quoteItem.status) === 'default'
                          ? 'bg-green-100 text-green-700'
                          : statusVariant(quoteItem.status) === 'destructive'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700';

                    return (
                      <SelectItem
                        key={quoteItem.id}
                        value={quoteItem.id}
                        className="py-3 cursor-pointer transition-all hover:bg-accent"
                      >
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {quoteItem.referenceNumber}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}
                            >
                              {t(getStatusTranslationKey(quoteItem.status))}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3 text-primary" />
                            <span>
                              {quoteItem.client.firstName} {quoteItem.client.lastName}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg border border-border bg-card">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t('dashboard.quotes.quoteHelper') ||
                    'Your message will be sent to the client or assigned agent for the selected quote'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Recipient - Only show when quote is selected */}
        {selectedQuoteId && quote && (
          <div className="space-y-2 sm:space-y-3">
            <Label
              htmlFor="msg-recipient"
              className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 text-foreground"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-primary" />
              {t('dashboard.quotes.messageRecipient')} <span className="text-primary">*</span>
            </Label>
            <Select value={effectiveRecipientId} onValueChange={setMsgRecipientId}>
              <SelectTrigger
                id="msg-recipient"
                className="h-11 sm:h-12 text-sm sm:text-base text-foreground bg-input border border-primary/30 hover:border-primary/50 focus:border-primary [&[data-placeholder]]:text-muted-foreground"
              >
                <SelectValue placeholder={t('dashboard.quotes.selectRecipient')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-popover border-border">
                <SelectItem
                  value={quote.client.id}
                  className="py-3 cursor-pointer transition-all hover:bg-accent"
                >
                  {quote.client.firstName} {quote.client.lastName} ({t('common.client')})
                </SelectItem>
                {quote.assignedAgent && (
                  <SelectItem
                    value={quote.assignedAgent.id}
                    className="py-3 cursor-pointer transition-all hover:bg-accent"
                  >
                    {quote.assignedAgent.firstName} {quote.assignedAgent.lastName} (
                    {t('dashboard.quotes.agent')})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2 sm:space-y-2.5">
          <Label
            htmlFor="msg-subject"
            className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 text-foreground"
          >
            {t('dashboard.quotes.messageSubject')}
          </Label>
          <Input
            id="msg-subject"
            value={msgSubject}
            onChange={(e) => setMsgSubject(e.target.value)}
            placeholder={t('dashboard.quotes.messageSubjectPlaceholder')}
            maxLength={200}
            className="h-11 sm:h-12 text-sm sm:text-base text-foreground bg-input border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <div className="flex justify-between items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {t('dashboard.quotes.messageSubject')}
            </p>
            <p className="text-xs text-muted-foreground shrink-0">{msgSubject.length}/200</p>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-2 sm:space-y-2.5">
          <Label
            htmlFor="msg-content"
            className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 text-foreground"
          >
            {t('dashboard.quotes.messageContent')} <span className="text-primary">*</span>
          </Label>
          <Textarea
            id="msg-content"
            value={msgContent}
            onChange={(e) => setMsgContent(e.target.value)}
            placeholder={t('dashboard.quotes.messageContentPlaceholder')}
            className="min-h-[180px] sm:min-h-[220px] resize-y text-sm sm:text-base leading-relaxed text-foreground bg-input border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            maxLength={5000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex justify-between items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">
              {msgContent.trim()
                ? `${msgContent.split(/\s+/).filter(Boolean).length} words`
                : t('dashboard.quotes.sendHint')}
            </p>
            <p className="text-xs text-muted-foreground shrink-0">{msgContent.length}/5000</p>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-xs sm:text-sm font-semibold text-foreground">
            {t('dashboard.quotes.attachments') || 'Attachments'} (Optional)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          {attachments.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                Attached Files ({attachments.length}/3)
              </p>
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-slate-200 shadow-sm"
                >
                  <div className="p-2 bg-blue-50 rounded">
                    <FileIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.size > 1024 * 1024
                        ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                        : `${(attachment.size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleRemoveAttachment(index)}
                    disabled={isUploading || sendMsgMu.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || attachments.length >= 3 || sendMsgMu.isPending}
            className="w-full h-10 sm:h-11 border-dashed border-2 hover:border-solid text-sm sm:text-base border-primary/30 hover:border-primary/50 text-foreground"
          >
            <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0 text-primary" />
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin shrink-0" />
                <span className="truncate">
                  {t('dashboard.quotes.uploading') || 'Uploading...'}
                </span>
              </>
            ) : (
              <span className="truncate">
                {attachments.length === 0
                  ? t('dashboard.quotes.addFiles')
                  : t('dashboard.quotes.addMoreFiles')}{' '}
                ({attachments.length}/3)
              </span>
            )}
          </Button>
          {attachments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center px-2">
              {t('dashboard.quotes.attachmentsHint') || 'Images, PDF, Word • Max 3 files'}
            </p>
          )}
        </div>
      </div>
    ),
    [
      quotes,
      isLoadingQuotes,
      isErrorLoadingQuotes,
      selectedQuoteId,
      quote,
      effectiveRecipientId,
      msgSubject,
      msgContent,
      attachments,
      isUploading,
      sendMsgMu.isPending,
      t,
      handleQuoteChange,
      refetchQuotes,
      handleSend,
      handleFileSelect,
      handleRemoveAttachment,
    ]
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <SheetTitle>{t('dashboard.quotes.messages')}</SheetTitle>
          </div>
          <SheetDescription>
            {t('dashboard.quotes.composeMessage') || 'Compose a new message'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col border-t bg-background shrink-0">
            <div className="overflow-y-auto max-h-[calc(100vh-200px)] px-6 py-4">{FormContent}</div>

            <SheetFooter className="gap-3 sm:gap-3 pt-6 border-t sticky bottom-0 pb-6 px-6 bg-background border-border flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={sendMsgMu.isPending}
                className="flex-1 h-11 border-border hover:border-primary/50"
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!isFormValid || sendMsgMu.isPending || isUploading}
                className="flex-1 h-11 bg-primary text-primary-foreground border border-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMsgMu.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dashboard.quotes.sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('dashboard.quotes.messageSend')}
                  </>
                )}
              </Button>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
