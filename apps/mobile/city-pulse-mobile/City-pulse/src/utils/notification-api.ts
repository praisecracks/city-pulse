import { apiRequest } from './api-client';
import { MOCK_API } from './api-config';

/**
 * Mirrors the backend's NOTIFICATION_TYPES enum.
 *
 * Kept in sync deliberately: the feed switches exhaustively on this union, so
 * adding a case here without backend support is a type error, and a backend type
 * without a case here falls through to the generic icon instead of crashing.
 */
export const NOTIFICATION_TYPES = [
  'report_filed',
  'trust_changed',
  'listing_lapsed',
  'listing_lapsed_final',
  'status_updated',
  'profile_milestone',
  'account_status',
  'system',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Route to open when tapped. Empty string means "no destination". */
  action: string;
  data: Record<string, unknown>;
  /** null when unread. */
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResult = {
  notifications: AppNotification[];
  unreadCount: number;
};

function mapNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw._id ?? ''),
    // An unknown type from a newer backend is surfaced as a generic
    // notification rather than being discarded, so a deploy can never silently
    // hide a message from a user.
    type: isNotificationType(raw.type) ? raw.type : 'system',
    title: String(raw.title ?? ''),
    body: String(raw.body ?? ''),
    action: String(raw.action ?? ''),
    data: (raw.data as Record<string, unknown>) ?? {},
    readAt: raw.readAt ? String(raw.readAt) : null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

type NotificationsPayload = {
  data?: Record<string, unknown>[];
  unreadCount?: number;
};

/**
 * Fetches the notification feed and unread count together — the screen needs
 * both on every open, so they share one request.
 *
 * In mock mode this resolves to an empty feed rather than throwing: the
 * screen has a real empty state, and notifications are not something worth
 * blocking the tab over.
 */
export async function fetchNotifications(token: string | null): Promise<NotificationsResult> {
  if (MOCK_API) {
    return { notifications: [], unreadCount: 0 };
  }

  const payload = await apiRequest<NotificationsPayload>('/notifications', { token });
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return {
    notifications: rows.map(mapNotification),
    unreadCount: typeof payload?.unreadCount === 'number' ? payload.unreadCount : 0,
  };
}

/**
 * Marks one notification read. Throws `ApiError`, so the caller can tell an
 * offline failure (worth queueing) from a server rejection (worth retrying).
 */
export async function markNotificationRead(id: string, token: string | null): Promise<void> {
  if (MOCK_API) return;

  await apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
    body: {},
    token,
  });
}

export async function markAllNotificationsRead(token: string | null): Promise<void> {
  if (MOCK_API) return;

  await apiRequest('/notifications/read-all', {
    method: 'POST',
    body: {},
    token,
  });
}
