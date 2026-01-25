/**
 * Notifications – shared (own only). GET /api/notifications, /api/notifications/count, PATCH /api/notifications/[id]/read, /api/notifications/read-all
 */

export interface NotificationRow {
  id: string;
  title: string;
  body?: string | null;
  readAt: string | null;
  createdAt: string;
  type?: string;
}

export interface NotificationsRes {
  success: boolean;
  data: NotificationRow[];
  pagination?: { page: number; pageSize: number; totalCount: number; totalPages: number };
}
