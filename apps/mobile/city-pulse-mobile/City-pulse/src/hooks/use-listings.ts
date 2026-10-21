import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { getAllListings, getListing, subscribeToListings, type Listing } from '@/data/product';
import { describeError, isOfflineError } from '@/utils/api-client';
import {
  fetchMyListing,
  fetchNearbyListings,
  getListingSyncFailure,
  resubmitListingForReview,
  setListingVisibility,
  syncListings,
  toAvailability,
  updateListingStatus,
} from '@/utils/listing-sync';
import {
  getCachedListingSync,
  loadCachedListing,
  saveCachedListing,
  clearCachedListing,
} from '@/utils/listing-cache';

export type ListingsSyncState = {
  isSyncing: boolean;
  /** True when the latest live-listing request failed; local listings remain visible. */
  hasError: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  refresh: () => void;
};

/**
 * Subscribes to the merged listing set (seed data + anything fetched from the
 * API) and keeps it fresh.
 *
 * useSyncExternalStore is used so a screen only re-renders when the listing set
 * actually changes, and because the store hands back a stable array identity
 * between syncs.
 */
export function useListings(): Listing[] {
  return useSyncExternalStore(subscribeToListings, getAllListings, getAllListings);
}

export function useListing(id: string | undefined): Listing | undefined {
  useListings();
  return id ? getListing(id) : undefined;
}

/**
 * Fetches live listings on mount. Pass `refresh` to re-fetch (pull to refresh),
 * and `enabled: false` to stay on the seed data.
 */
export function useSyncedListings(options?: {
  refresh?: unknown;
  enabled?: boolean;
}): ListingsSyncState {
  const { refresh, enabled = true } = options || {};
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    const sync = async () => {
      setIsSyncing(true);
      try {
        await syncListings();
        if (active) {
          const failure = getListingSyncFailure();
          setHasError(Boolean(failure));
          setIsOffline(failure?.isOffline ?? false);
          setErrorMessage(failure?.message ?? null);
        }
      } finally {
        if (active) setIsSyncing(false);
      }
    };

    void sync();
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        wasOffline = true;
      } else if (state.isConnected === true && wasOffline) {
        wasOffline = false;
        void sync();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, refresh, retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { isSyncing, hasError, isOffline, errorMessage, refresh: retry };
}

/**
 * Hook for geospatial nearby listings.
 *
 * Fetches from /pulses/nearby when GPS coordinates are available.
 * Does NOT merge with seed data — returns only API results with
 * server-computed distanceMeters.
 *
 * Returns empty array when no GPS coordinates provided (caller should
 * navigate to location selection first).
 */
export interface NearbyListingsState {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refresh: () => void;
}

export interface NearbyListingsOptions {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  category?: string;
  status?: string | string[];
  enabled?: boolean;
}

export function useNearbyListings(
  options: NearbyListingsOptions
): NearbyListingsState {
  const { latitude, longitude, radiusMeters = 5000, category, status, enabled = true } = options;
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setListings([]);
      setError(null);
      setIsOffline(false);
      return;
    }

    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchNearbyListings({
        latitude,
        longitude,
        radiusMeters,
        category: category as any,
        status,
      });
      if (requestId !== latestRequest.current) return;
      setListings(results);
      setError(null);
      setIsOffline(false);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(describeError(err, 'Could not refresh nearby listings.'));
      setIsOffline(isOfflineError(err));
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [enabled, latitude, longitude, radiusMeters, category, status]);

  useEffect(() => {
    // The effect starts a bounded network request and updates loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const refresh = useCallback(() => {
    latestRequest.current += 1;
    load();
  }, [load]);

  return { listings, isLoading, error, isOffline, refresh };
}

export type MyListingState = {
  listing: Listing | null;
  /** True only for the first load, so a background refresh does not blank the screen. */
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  /** Set when the network request failed but cached data is still being shown. */
  isOffline: boolean;
  /** Re-fetches on demand, e.g. from a retry button. */
  refresh: () => void;
  /**
   * Optimistically applies `pulseStatus`, then confirms it with the API.
   * Resolves true when the server accepted the change. On failure the previous
   * listing is restored and the reason is surfaced through `error`.
   */
  setStatus: (pulseStatus: string) => Promise<boolean>;
  resubmit: () => Promise<string | null>;
  /**
   * Publishes or unpublishes the provider's listing.
   *
   * Unpublishing is reversible: the listing is left intact on the provider's
   * account, so `listing` stays in state either way and they keep seeing and
   * editing it while it is down. What changes is the public feed, which is
   * re-synced so an unpublished listing disappears from Discover immediately
   * rather than lingering in the cache.
   *
   * Returns null on success, or the reason it failed. The message is returned
   * rather than only pushed into `error` so a caller can show it inside a
   * confirmation dialog, where the screen behind is covered.
   */
  setVisibility: (visibility: 'public' | 'private') => Promise<string | null>;
};

/**
 * Owns the provider's own listing for the agent dashboard.
 *
 * `accountId` scopes every cache read and write. It is not optional in
 * practice: without it the cache cannot tell whose listing it is holding, and
 * one account's dashboard will render the previous account's business.
 *
 * Reads from an in-memory + AsyncStorage cache on mount so a returning screen
 * (or a cold start after being killed) shows the last-known listing instantly,
 * then re-fetches from the network in the background. When the network fails
 * the cached listing is kept in state and `isOffline` surfaces an indicator,
 * so the provider can still browse and manage their listing while disconnected.
 *
 * NetInfo listens for connectivity changes and triggers a background refresh the
 * moment the network returns — no pull-to-refresh needed.
 */
export function useMyListing(
  token: string | null | undefined,
  accountId?: string | null,
): MyListingState {
  // Seed from the in-memory cache so warm screen switches skip the skeleton
  // entirely. On a cold start this is null and the AsyncStorage hydration below
  // fills it in.
  const [listing, setListing] = useState<Listing | null>(() =>
    getCachedListingSync(accountId),
  );
  const [isLoading, setIsLoading] = useState(() => !getCachedListingSync(accountId));
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Guards against an older, slower request overwriting a newer one. A counter
  // is used rather than a cleanup flag because refresh() and the focus effect
  // both trigger loads that can overlap.
  const latestRequest = useRef(0);

  // Refs so the load callback and NetInfo listener can read the latest token
  // and listing without being recreated (which would resubscribe the listener).
  const listingRef = useRef<Listing | null>(listing);
  const tokenRef = useRef<string | null>(token ?? null);
  const accountIdRef = useRef<string | null>(accountId ?? null);
  useEffect(() => {
    listingRef.current = listing;
  }, [listing]);
  useEffect(() => {
    tokenRef.current = token ?? null;
  }, [token]);
  useEffect(() => {
    accountIdRef.current = accountId ?? null;
  }, [accountId]);

  // Hydrate the in-memory cache from AsyncStorage on mount (covers cold starts
  // where getCachedListingSync returned null). Also clears state when the
  // account is signed out.
  useEffect(() => {
    if (!token) {
      void clearCachedListing();
      // Signing out must clear the previous account's listing, and that is a
      // real state change rather than a render cascade. The rule cannot tell
      // the two apart here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setListing(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    loadCachedListing(accountId).then((cached) => {
      if (!active) return;
      if (cached) {
        setListing(cached);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [token, accountId]);

  const load = useCallback(async () => {
    if (!tokenRef.current) {
      void clearCachedListing();
      setListing(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    // Keep the skeleton only when there is no cached data to show yet.
    if (!listingRef.current) {
      setIsLoading(true);
    }

    try {
      const result = await fetchMyListing(tokenRef.current);
      if (requestId !== latestRequest.current) return;

      if (result) {
        setListing(result);
        void saveCachedListing(result, accountIdRef.current);
      } else {
        setListing(null);
        void clearCachedListing();
      }
      setError(null);
      setIsOffline(false);
    } catch (err) {
      if (requestId !== latestRequest.current) return;

      const message = describeError(err, 'Unable to load your listing.');
      setError(message);
      setIsOffline(isOfflineError(err));
      // Deliberately leave the existing listing (from cache) in state so the
      // screen keeps showing usable data instead of going blank.
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, []);

  // Auto-retry when the network returns while we are in offline mode.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && isOffline) {
        void load();
      }
    });
    return () => unsubscribe();
  }, [isOffline, load]);

  // Refetch on focus rather than only on mount: the listing is created on a
  // different screen, so a provider who registers, returns to this tab, then
  // switches away and back must not keep a result fetched before it existed.
  // The cache keeps the last-known listing visible while this refresh runs, so
  // there is no skeleton flash on re-focus.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setIsLoading(true);
    load();
  }, [load]);

  const setStatus = useCallback(
    async (pulseStatus: string) => {
      if (!listing) return false;

      const previous = listing;
      setIsSyncing(true);
      setError(null);
      // Optimistic: the radio moves immediately. lastUpdated is deliberately
      // left alone so the countdown does not claim a refresh that has not
      // happened yet — the server's own timestamp replaces it on success.
      setListing({ ...listing, status: toAvailability(pulseStatus) });

      try {
        const updated = await updateListingStatus(listing.id, pulseStatus, token ?? null);
        setListing(updated);
        void saveCachedListing(updated, accountId ?? null);
        setError(null);
        setIsOffline(false);
        return true;
      } catch (err) {
        setListing(previous);
        setError(describeError(err, 'Unable to update your status.'));
        setIsOffline(isOfflineError(err));
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [listing, token, accountId],
  );

  const setVisibility = useCallback(
    async (visibility: 'public' | 'private') => {
      if (!listing) return 'There is no listing to update.';

      setIsSyncing(true);
      setError(null);
      // Any load already in flight was issued before this change, so it can
      // describe the old visibility. Bumping the counter makes those responses
      // stale so they cannot overwrite what we are about to write.
      latestRequest.current += 1;

      try {
        await setListingVisibility(visibility, token ?? null);

        // The listing itself is untouched by hiding, so it stays in state and
        // the provider keeps managing it. Only the public feed has to be
        // rebuilt, and it must be a forced sync: a shared one could be a
        // response issued before the hide and would put the listing back.
        await syncListings({ force: true });
        setError(null);
        setIsOffline(false);
        return null;
      } catch (err) {
        const message = describeError(err, 'Unable to update your listing visibility.');
        setError(message);
        setIsOffline(isOfflineError(err));
        return message;
      } finally {
        setIsSyncing(false);
      }
    },
    [listing, token],
  );

  const resubmit = useCallback(async () => {
    if (!listing) return 'There is no listing to resubmit.';
    setIsSyncing(true);
    setError(null);
    try {
      const updated = await resubmitListingForReview(listing.id, token ?? null);
      setListing(updated);
      void saveCachedListing(updated, accountId ?? null);
      setError(null);
      setIsOffline(false);
      return null;
    } catch (err) {
      const message = describeError(err, 'Unable to resubmit your listing.');
      setError(message);
      setIsOffline(isOfflineError(err));
      return message;
    } finally {
      setIsSyncing(false);
    }
  }, [listing, token, accountId]);

  return { listing, isLoading, isSyncing, error, isOffline, refresh, setStatus, setVisibility, resubmit };
}
