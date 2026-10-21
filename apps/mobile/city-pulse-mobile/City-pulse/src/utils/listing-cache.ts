import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@/data/product';

/**
 * Key under which the provider's own listing is persisted for offline use.
 * Cleared on sign-out.
 */
export const MY_LISTING_STORAGE_KEY = '@citypulse:myListing';

/**
 * The cached listing together with the account it belongs to.
 *
 * The owner is stored rather than assumed because a listing is account-scoped:
 * showing the previous account's listing on a new account's dashboard is worse
 * than showing nothing, and the cache outlives the sign-out that is supposed to
 * have cleared it whenever that write fails or is still in flight.
 */
type CacheEnvelope = {
  accountId: string | null;
  listing: Listing;
};

/**
 * In-memory copy so screens don't flash the skeleton on every tab switch
 * within a session — the cache is already warm from the last network fetch.
 */
let memoryCache: CacheEnvelope | null = null;
let memoryCacheInitialized = false;

/** True when `envelope` was written by the account now asking for it. */
function belongsTo(envelope: CacheEnvelope | null, accountId: string | null | undefined): boolean {
  if (!envelope) return false;
  return envelope.accountId === (accountId ?? null);
}

/** Writes the listing to both the in-memory cache and AsyncStorage. */
export async function saveCachedListing(
  listing: Listing | null,
  accountId?: string | null,
): Promise<void> {
  if (!listing) {
    await clearCachedListing();
    return;
  }

  const envelope: CacheEnvelope = { accountId: accountId ?? null, listing };
  memoryCache = envelope;
  memoryCacheInitialized = true;
  try {
    await AsyncStorage.setItem(MY_LISTING_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Best-effort: a failed write is never worse than no cache at all.
  }
}

/**
 * Hydrates the in-memory cache from AsyncStorage on first call, then returns
 * the in-memory value on every subsequent call.
 *
 * A cached listing written for a different account — or by a build that did not
 * record an owner — reads as no cache at all, so the caller falls back to the
 * network instead of rendering someone else's business.
 */
export async function loadCachedListing(accountId?: string | null): Promise<Listing | null> {
  if (!memoryCacheInitialized) {
    memoryCacheInitialized = true;
    try {
      const raw = await AsyncStorage.getItem(MY_LISTING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEnvelope | Listing;
        memoryCache =
          parsed && typeof parsed === 'object' && 'listing' in parsed
            ? (parsed as CacheEnvelope)
            : { accountId: null, listing: parsed as Listing };
      }
    } catch {
      // Corrupt entry — wipe it rather than crash.
      memoryCache = null;
    }
  }

  return belongsTo(memoryCache, accountId) ? memoryCache!.listing : null;
}

/**
 * Synchronous read of the in-memory cache. Returns null on the very first
 * call of a cold session (before AsyncStorage has been hydrated) so the
 * skeleton is shown rather than briefly flashing "no listing".
 */
export function getCachedListingSync(accountId?: string | null): Listing | null {
  if (!memoryCacheInitialized) return null;
  return belongsTo(memoryCache, accountId) ? memoryCache!.listing : null;
}

export const PUBLIC_FEED_CACHE_KEY = '@citypulse:publicFeedCache';
const PUBLIC_FEED_TTL_MS = 5 * 60 * 1000;

export async function savePublicFeedCache(listings: Listing[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PUBLIC_FEED_CACHE_KEY,
      JSON.stringify({ listings, cachedAt: Date.now() }),
    );
  } catch {
    // best-effort
  }
}

export async function loadPublicFeedCache(): Promise<{ listings: Listing[]; fresh: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(PUBLIC_FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { listings: Listing[]; cachedAt: number };
    if (!Array.isArray(parsed.listings)) return null;
    const fresh = Date.now() - parsed.cachedAt < PUBLIC_FEED_TTL_MS;
    return { listings: parsed.listings, fresh };
  } catch {
    return null;
  }
}

export async function clearPublicFeedCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PUBLIC_FEED_CACHE_KEY);
  } catch {
    // best-effort
  }
}

/** Drops the listing from both caches. */
export async function clearCachedListing(): Promise<void> {
  memoryCache = null;
  memoryCacheInitialized = true;
  try {
    await AsyncStorage.removeItem(MY_LISTING_STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}