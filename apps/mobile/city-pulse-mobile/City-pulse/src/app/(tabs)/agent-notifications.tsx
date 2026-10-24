import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/state/app-state';
import { isOfflineError, describeError } from '@/utils/api-client';
import {
  getCachedNotificationsSync,
  loadCachedNotifications,
  queuePendingRead,
  saveCachedNotifications,
  takePendingReads,
} from '@/utils/notification-cache';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from '@/utils/notification-api';

const COLOR_BG = '#FAF6EE';
const COLOR_TEXT = '#0F172A';
const COLOR_MUTED = '#94A3B8';
const COLOR_BORDER = '#E2E8F0';
const COLOR_UNREAD_BG = '#FFFFFF';
const COLOR_READ_BG = '#F8FAFC';
const COLOR_DANGER = '#DC2626';
const COLOR_ACCENT = '#187171';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TypeStyle = {
  icon: IconName;
  /** Background tint behind the icon. */
  tint: string;
  iconColor: string;
};


const TYPE_STYLES: Record<NotificationType, TypeStyle> = {
  report_filed: { icon: 'alert-circle', tint: '#FEF2F2', iconColor: COLOR_DANGER },
  trust_changed: { icon: 'shield-half', tint: '#FEF2F2', iconColor: COLOR_DANGER },
  listing_lapsed: { icon: 'hourglass-outline', tint: '#FFFBEB', iconColor: '#B45309' },
  listing_lapsed_final: { icon: 'hourglass', tint: '#FEF2F2', iconColor: COLOR_DANGER },
  status_updated: { icon: 'cloud-upload-outline', tint: '#ECFDF5', iconColor: '#047857' },
  profile_milestone: { icon: 'eye', tint: '#ECFDF5', iconColor: '#047857' },
  account_status: { icon: 'lock-closed', tint: '#FEF2F2', iconColor: COLOR_DANGER },
  system: { icon: 'notifications', tint: '#F1F5F9', iconColor: COLOR_MUTED },
};

function styleFor(type: NotificationType): TypeStyle {
  return TYPE_STYLES[type] ?? TYPE_STYLES.system;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AgentNotificationsScreen() {
  const { user, token } = useAppState();
  const userId = user?.id ?? null;

  /**
   * Feed state, layered oldest-source-last.
   *
   * Nothing here is "the data". The rows actually shown are resolved during
   * render: server data when we have it, otherwise the disk cache, otherwise the
   * warm memory cache. Keeping the cache as a derived value rather than copying
   * it into state on mount is what lets a warm cache paint in the first frame
   * instead of a frame later.
   */
  const [serverFeed, setServerFeed] = useState<{ userId: string; rows: AppNotification[] } | null>(null);
  const [diskFeed, setDiskFeed] = useState<AppNotification[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /**
   * `null` means "no problem". A string means the network failed, and
   * `isOffline` decides whether the screen offers "try again" (server problem)
   * or quietly serves the cache (connectivity problem). Collapsing these two
   * into one "something went wrong" state is what made this screen useless
   * offline.
   */
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const persist = useCallback(
    (userId: string, rows: AppNotification[]) => {
      setServerFeed({ userId, rows });
      void saveCachedNotifications(userId, rows);
    },
    [],
  );

  /**
   * Fetches the feed.
   *
   * Deliberately sets no state before its first await: this is called directly
   * from the mount effect, and the initial render already has isLoading true
   * and error null, so an up-front setState would be a redundant synchronous
   * update that cascades an extra render for no benefit.
   */
   const load = useCallback(async () => {
    if (!userId) {
      setError('You must be signed in to view notifications.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // Deliver reads recorded while offline *before* pulling the feed. Doing it
      // in this order means a notification tapped on the train stays read once
      // the connection returns, instead of reappearing as unread from the
      // server's untouched copy.
      const pending = await takePendingReads(userId);
      for (const id of pending) {
        try {
          await markNotificationRead(id, token);
        } catch {
          // Re-queue the ones that still fail; the rest are already applied.
          await queuePendingRead(userId, id);
        }
      }

      const result = await fetchNotifications(token);
      persist(userId, result.notifications);
      setError(null);
      setIsOffline(false);
    } catch (err) {
      setError(describeError(err, 'We could not load your notifications.'));
      setIsOffline(isOfflineError(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, token, persist]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    // `load` sets no state before its first await, so this is async data
    // fetching rather than a synchronous update cascading a render. The rule
    // cannot see through the await, hence the scoped disable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [userId, load]);

  useEffect(() => {
    // Hydrate from disk once per account. Async, so the setState lands in a
    // callback and is not a synchronous cascade.
    if (!userId) return;
    let cancelled = false;

    void loadCachedNotifications(userId).then((cached) => {
      if (cancelled) return;
      setDiskFeed(cached ? cached.notifications : []);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /**
   * Resolution order, best available first. Guarded on `userId` throughout so a
   * sign-out or an account switch can never surface the previous account's rows,
   * however briefly.
   */
  const visible = useMemo<AppNotification[]>(() => {
    if (!user || !userId) return [];
    if (serverFeed?.userId === userId) return serverFeed.rows;
    if (diskFeed) return diskFeed;
    return getCachedNotificationsSync(userId)?.notifications ?? [];
  }, [user, userId, serverFeed, diskFeed]);

  const showLoading = Boolean(user && userId && isLoading && visible.length === 0);

  const unreadCount = useMemo(
    () => visible.filter((n) => n.readAt === null).length,
    [visible],
  );

  /**
   * Marks read before navigating, and optimistically.
   *
   * Read state is not what the user is here for, so the row updates instantly.
   * An offline failure does *not* roll back: the read is queued and delivered on
   * the next successful load. Rolling back would make the unread dot reappear
   * over something the user just deliberately dismissed, and then vanish again
   * minutes later — worse than either stable state.
   */
  const handlePress = useCallback(
    async (notification: AppNotification) => {
      if (notification.readAt === null && userId) {
        const now = new Date().toISOString();
        persist(
          userId,
          visible.map((n) => (n.id === notification.id ? { ...n, readAt: now } : n)),
        );

        try {
          await markNotificationRead(notification.id, token);
        } catch (err) {
          if (isOfflineError(err)) {
            await queuePendingRead(userId, notification.id);
          } else {
            // A server rejection is not a connectivity problem, so retrying
            // later is not the fix; put the dot back.
            persist(
              userId,
              visible.map((n) =>
                n.id === notification.id ? { ...n, readAt: null } : n,
              ),
            );
          }
        }
      }

      if (notification.action) {
        router.push(notification.action as never);
      }
    },
    [visible, persist, token, userId],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0 || !userId) return;

    const previous = visible;
    const now = new Date().toISOString();
    persist(userId, previous.map((n) => ({ ...n, readAt: n.readAt ?? now })));

    try {
      await markAllNotificationsRead(token);
    } catch (err) {
      // Offline: queue each unread id so they are delivered individually later,
      // since "mark all read" cannot be replayed as a single call.
      if (isOfflineError(err)) {
        await Promise.all(
          previous.filter((n) => n.readAt === null).map((n) => queuePendingRead(userId, n.id)),
        );
        return;
      }
      persist(userId, previous);
    }
  }, [visible, persist, token, userId, unreadCount]);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const isUnread = item.readAt === null;
      const style = styleFor(item.type);

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.body}${isUnread ? '. Unread' : ''}`}
          onPress={() => void handlePress(item)}
          style={({ pressed }) => [
            styles.row,
            isUnread ? styles.rowUnread : styles.rowRead,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: style.tint }]}>
            <Ionicons name={style.icon} size={20} color={style.iconColor} />
          </View>

          <View style={styles.rowBody}>
            <View style={styles.rowHeader}>
              <ThemedText style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </ThemedText>
              {isUnread && <View style={styles.unreadDot} accessibilityElementsHidden />}
            </View>

            {!!item.body && (
              <ThemedText style={styles.rowBodyText} numberOfLines={3}>
                {item.body}
              </ThemedText>
            )}

            <ThemedText style={styles.timestamp}>{relativeTime(item.createdAt)}</ThemedText>
          </View>
        </Pressable>
      );
    },
    [handlePress],
  );

  const renderEmpty = () => {
    if (showLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLOR_ACCENT} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color={COLOR_MUTED} />
          <ThemedText style={styles.emptyTitle}>
            {isOffline ? 'You are offline' : 'Could not load notifications'}
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            {isOffline
              ? 'Alerts appear here as soon as you reconnect. Pull down to check again.'
              : error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={handleRefresh}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          >
            <ThemedText style={styles.retryText}>Try again</ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Ionicons name="notifications-off-outline" size={56} color={COLOR_MUTED} />
        <ThemedText style={styles.emptyTitle}>No notifications</ThemedText>
        <ThemedText style={styles.emptyText}>
          We will tell you here when someone reports your listing, when your trust score changes, or
          when your status is about to lapse.
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <ThemedText style={styles.title}>Notifications</ThemedText>
            {unreadCount > 0 && !showLoading && (
              <ThemedText style={styles.subtitle}>
                {unreadCount} unread
              </ThemedText>
            )}
          </View>

          {unreadCount > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleMarkAllRead()}
              style={({ pressed }) => [styles.markAllBtn, pressed && styles.pressed]}
            >
              <ThemedText style={styles.markAllText}>Mark all read</ThemedText>
            </Pressable>
          )}
        </View>

        {/*
          Shown only when there is cached content to stand down for. Serving
          stale alerts quietly is correct — an alert that was true a minute ago
          is still worth reading — but the user should know it may not be the
          latest, so this is a banner rather than a silent staleness.
        */}
        {isOffline && visible.length > 0 && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
            <ThemedText style={styles.offlineBannerText}>
              You are offline. Showing your saved alerts.
            </ThemedText>
          </View>
        )}

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            visible.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLOR_MUTED}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR_BG },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitles: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: COLOR_TEXT },
  subtitle: { fontSize: 13, color: COLOR_MUTED, marginTop: 2 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  markAllText: { fontSize: 13, fontWeight: '600', color: COLOR_ACCENT },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
  },
  offlineBannerText: { flex: 1, fontSize: 12, fontWeight: '500', color: '#B45309' },
  listContentEmpty: { flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    marginBottom: 10,
  },
  rowUnread: { backgroundColor: COLOR_UNREAD_BG },
  rowRead: { backgroundColor: COLOR_READ_BG },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLOR_TEXT },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR_ACCENT,
    marginTop: 6,
  },
  rowBodyText: { fontSize: 13, color: COLOR_MUTED, lineHeight: 18 },
  timestamp: { fontSize: 11, color: COLOR_MUTED, marginTop: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLOR_TEXT },
  emptyText: { fontSize: 14, color: COLOR_MUTED, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLOR_ACCENT,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
