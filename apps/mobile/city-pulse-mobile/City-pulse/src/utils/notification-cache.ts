import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppNotification } from './notification-api';

/**
 * Persisted copy of the notification feed, so the Alerts tab renders real content
 * on a cold start instead of waiting on the network.
 *
 * Follows the same shape as `listing-cache`: a memory copy that screens read
 * synchronously, backed by AsyncStorage, with best-effort writes. The server is
 * still the source of truth — this is a cache, and a failed write is never worse
 * than no cache at all.
 */
export const NOTIFICATIONS_STORAGE_KEY = '@citypulse:notifications';

/** Notifications marked read while offline, awaiting delivery. */
const PENDING_READS_STORAGE_KEY = '@citypulse:notifications:pendingReads';

/** Only the newest slice is worth keeping; the feed is a rolling window. */
const MAX_CACHED = 50;

/** Feeds older than this are treated as too stale to present as current. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CachedFeed = {
  /** Guards against showing one account's alerts to another on a shared device. */
  userId: string;
  notifications: AppNotification[];
  cachedAt: number;
};

let memoryCache: CachedFeed | null = null;
let memoryCacheInitialized = false;

type CacheChangeListener = () => void;
let cacheChangeListeners: CacheChangeListener[] = [];

/**
 * Subscribe to cache updates. Call the returned function to unsubscribe.
 *
 * Used by long-lived UI (e.g. the bottom tab bar) that needs to react when
 * notifications are marked read from another screen.
 */
export function subscribeToCacheChange(listener: CacheChangeListener): () => void {
  cacheChangeListeners.push(listener);
  return () => {
    cacheChangeListeners = cacheChangeListeners.filter((l) => l !== listener);
  };
}

function notifyCacheChange() {
  for (const listener of cacheChangeListeners) {
    listener();
  }
}

function readCacheFrom(raw: string | null, userId: string): CachedFeed | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CachedFeed>;
    if (!parsed || parsed.userId !== userId) return null;
    if (!Array.isArray(parsed.notifications)) return null;

    const cachedAt = typeof parsed.cachedAt === 'number' ? parsed.cachedAt : 0;
    if (Date.now() - cachedAt > MAX_AGE_MS) return null;

    return {
      userId,
      notifications: parsed.notifications.slice(0, MAX_CACHED),
      cachedAt,
    };
  } catch {
    // Corrupt entry — treat as absent rather than crash.
    return null;
  }
}

export async function loadCachedNotifications(userId: string): Promise<CachedFeed | null> {
  if (memoryCacheInitialized && memoryCache?.userId === userId) return memoryCache;

  memoryCacheInitialized = true;
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    memoryCache = readCacheFrom(raw, userId);
  } catch {
    memoryCache = null;
  }
  return memoryCache;
}

/**
 * Synchronous read, mirroring `getCachedListingSync`.
 *
 * Returns null on the first call of a cold session so the screen can show a
 * skeleton rather than flashing an empty feed that is about to be replaced.
 */
export function getCachedNotificationsSync(userId: string): CachedFeed | null {
  if (!memoryCacheInitialized) return null;
  return memoryCache?.userId === userId ? memoryCache : null;
}

export async function saveCachedNotifications(
  userId: string,
  notifications: AppNotification[],
): Promise<void> {
  const feed: CachedFeed = {
    userId,
    notifications: notifications.slice(0, MAX_CACHED),
    cachedAt: Date.now(),
  };
  memoryCache = feed;
  memoryCacheInitialized = true;
  notifyCacheChange();

  try {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(feed));
  } catch {
    // Best-effort: the in-memory copy still serves this session.
  }
}

/** Drops the feed. Called on sign-out so alerts never leak across accounts. */
export async function clearCachedNotifications(): Promise<void> {
  memoryCache = null;
  memoryCacheInitialized = true;
  notifyCacheChange();

  try {
    await AsyncStorage.multiRemove([NOTIFICATIONS_STORAGE_KEY, PENDING_READS_STORAGE_KEY]);
  } catch {
    // Best-effort.
  }
}

/**
 * Read-state written while the server was unreachable.
 *
 * Without this queue, a notification tapped offline would snap back to unread
 * on the next successful fetch, because the server never heard about it.
 */
export async function queuePendingRead(userId: string, notificationId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_READS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    const forUser = parsed[userId] ?? [];
    if (forUser.includes(notificationId)) return;

    parsed[userId] = [...forUser, notificationId];
    await AsyncStorage.setItem(PENDING_READS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Losing a queued read only means the dot reappears once; not worth failing.
  }
}

export async function takePendingReads(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_READS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    const forUser = parsed[userId] ?? [];
    if (forUser.length === 0) return [];

    delete parsed[userId];
    await AsyncStorage.setItem(PENDING_READS_STORAGE_KEY, JSON.stringify(parsed));
    return forUser;
  } catch {
    return [];
  }
}
