'use client';

import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchNotifications, fetchUnreadCount } from '../api/queries';
import { markNotificationRead, markAllNotificationsRead } from '../api/mutations';
import type { NotificationRow } from '../api/types';

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const countKey = ['notifications', 'count'];
  const listKey = ['notifications', 'list'];

  const { data: count = 0 } = useQuery({
    queryKey: countKey,
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });

  const { data: list, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchNotifications({ page: 1, pageSize: 10 }),
    enabled: false, // fetch when dropdown opens
  });

  const markOneMu = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countKey });
      qc.invalidateQueries({ queryKey: listKey });
    },
  });

  const markAllMu = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: countKey });
      qc.invalidateQueries({ queryKey: listKey });
    },
  });

  const notifications = (list?.data ?? []) as NotificationRow[];

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) qc.fetchQuery({ queryKey: listKey });
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={t('dashboard.layout.notifications')}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] max-h-[min(400px,70vh)] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-medium text-sm">{t('dashboard.layout.notifications')}</span>
          {notifications.some((n) => !n.readAt) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllMu.mutate()}
              disabled={markAllMu.isPending}
            >
              {markAllMu.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              {t('dashboard.layout.markAllRead')}
            </Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading && !list && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-6 text-center">
              {t('dashboard.layout.noNotifications')}
            </p>
          )}
          {!isLoading && notifications.length > 0 && (
            <ul className="py-1">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-3 py-2 flex items-start justify-between gap-2 border-b last:border-0 ${!n.readAt ? 'bg-muted/50' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => markOneMu.mutate(n.id)}
                      disabled={markOneMu.isPending}
                      aria-label={t('dashboard.layout.markRead')}
                    >
                      {markOneMu.isPending && markOneMu.variables === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
