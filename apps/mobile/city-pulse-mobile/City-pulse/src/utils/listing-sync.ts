import {
  CATEGORIES,
  type Availability,
  type Category,
  getAllListings,
  getListing,
  type Listing,
  type ListingPhoto,
  type ListingReviewStatus,
  setRemoteListings,
} from '@/data/product';
import { API_BASE_URL, MOCK_API, resolveApiAssetUrl } from './api-config';
import { ApiError } from './api-client';
import { savePublicFeedCache, loadPublicFeedCache } from './listing-cache';
import { formatDistance } from './location';

const FETCH_TIMEOUT_MS = 10_000;

export type ListingSyncFailure = {
  isOffline: boolean;
  message: string;
};

let lastSyncFailure: ListingSyncFailure | null = null;

export function getListingSyncFailure(): ListingSyncFailure | null {
  return lastSyncFailure;
}

/**
 * The subset of a Pulse a provider may change after publishing.
 *
 * `title`, location/address, Ogun State/LGA and coordinates are fixed at
 * publish time and the API rejects any attempt to change them, so they are
 * removed from the update type. Excluding them here turns a regression into a
 * compile error rather than a 400 that only shows up once a provider presses
 * Save.
 */
export type EditablePulse = Omit<
  Partial<Pulse>,
  'title' | 'location' | 'state' | 'localGovernment' | 'address' | 'coordinates'
>;

/** The Pulse document as returned by GET /api/v1/pulses or GET /api/v1/pulses/nearby. */
export type Pulse = {
  _id: string;
  title: string;
  description?: string;
  location: string;
  category: string;
  status: string;
  state?: string;
  localGovernment?: string;
  reviewStatus?: ListingReviewStatus;
  reviewNote?: string;
  trustScore?: number;
  contactPhone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  details?: Record<string, unknown>;
  images?: { path?: string; caption?: string; isCover?: boolean }[];
  agent?: string | { _id?: string; isVerified?: boolean };
  lastUpdated?: string;
  updatedAt?: string;
  createdAt?: string;
  /** Only present on /nearby responses — distance from query point in meters. */
  distanceMeters?: number;
};

type PulsesResponse = {
  success?: boolean;
  message?: string;
  data?: Pulse[];
};

const STATUS_MAP: Record<string, Availability> = {
  available: 'available',
  'low supply': 'low_supply',
  unavailable: 'unavailable',
  unconfirmed: 'unconfirmed',
};

/** Reverse of STATUS_MAP, so a screen that thinks in `Availability` can still send the vocabulary the API expects without hardcoding the strings. */
export const PULSE_STATUS_BY_AVAILABILITY: Record<Availability, string> = {
  available: 'Available',
  low_supply: 'Low Supply',
  unavailable: 'Unavailable',
  unconfirmed: 'Unconfirmed',
};

export function toAvailability(status: string | undefined): Availability {
  if (!status) return 'unconfirmed';
  return STATUS_MAP[status.toLowerCase()] ?? 'unconfirmed';
}

function toCategory(category: string | undefined): Category | null {
  if (!category) return null;
  return (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : null;
}

export function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return 'just now';

  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return 'just now';

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Condenses the category-specific `details` blob into the one-line price the
 * cards show. Falls back to the description so a card is never blank.
 */
function summarizePrice(category: Category, pulse: Pulse): string {
  const details = pulse.details || {};

  if (category === 'pos' && typeof details.feePer5000 === 'number') {
    return `N${details.feePer5000} per N5,000`;
  }
  if (category === 'gas' && typeof details.pricePerKg === 'number') {
    return `N${details.pricePerKg} per KG`;
  }
  if (category === 'food' && Array.isArray(details.menuItems) && details.menuItems.length > 0) {
    return `${details.menuItems.length} item${details.menuItems.length === 1 ? '' : 's'} on the menu`;
  }
  if (category === 'house' && Array.isArray(details.propertyTypes) && details.propertyTypes.length > 0) {
    return details.propertyTypes.join(', ');
  }

  return pulse.description?.split('\n')[0]?.trim() || 'Contact for details';
}

function toPhotos(pulse: Pulse): ListingPhoto[] | undefined {
  if (!Array.isArray(pulse.images) || pulse.images.length === 0) return undefined;

  // The cover is pinned first so cards and the gallery agree on the lead image.
  const sorted = [...pulse.images].sort((a, b) => Number(Boolean(b.isCover)) - Number(Boolean(a.isCover)));

  const photos = sorted
    .map((image) => ({
      path: image.path,
      url: resolveApiAssetUrl(image.path || ''),
      caption: image.caption?.trim() || undefined,
    }))
    .filter((photo) => Boolean(photo.url));

  return photos.length > 0 ? photos : undefined;
}

export function pulseToListing(pulse: Pulse): Listing | null {
  const category = toCategory(pulse.category);
  if (!category) return null;

  const latitude = pulse.coordinates?.latitude;
  const longitude = pulse.coordinates?.longitude;

  // Captured once so every relative string in this listing is derived from the
  // same instant.
  const lastUpdated = pulse.lastUpdated || pulse.updatedAt || pulse.createdAt;

  // Use server-computed distanceMeters when available (from /nearby endpoint)
  const distance =
    typeof pulse.distanceMeters === 'number'
      ? formatDistance(pulse.distanceMeters)
      : 'Nearby';

  return {
    id: pulse._id,
    category,
    name: pulse.title?.trim() || 'Unnamed provider',
    area: pulse.location || 'Abeokuta',
    state: pulse.state,
    localGovernment: pulse.localGovernment,
    distance,
    status: toAvailability(pulse.status),
    reviewStatus: pulse.reviewStatus,
    reviewNote: pulse.reviewNote,
    updated: formatRelativeTime(lastUpdated),
    updatedAt: lastUpdated,
    trust: typeof pulse.trustScore === 'number' ? pulse.trustScore : 3,
    detail: pulse.description?.split('\n')[0]?.trim() || '',
    price: summarizePrice(category, pulse),
    details: pulse.details,
    photos: toPhotos(pulse),
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
    phone: pulse.contactPhone,
    email: pulse.email,
    whatsapp: pulse.whatsapp,
    address: pulse.address,
    createdAt: pulse.createdAt,
    agentId: typeof pulse.agent === 'string' ? pulse.agent : pulse.agent?._id,
    providerVerified:
      typeof pulse.agent === 'object' && pulse.agent !== null
        ? pulse.agent.isVerified
        : undefined,
  };
}

let inFlight: Promise<Listing[]> | null = null;

/**
 * Pulls live listings from the API and merges them over the seed data.
 *
 * Concurrent callers share one request, so several screens mounting at once
 * cost a single round trip.
 *
 * `force` exists for the one caller that cannot tolerate a shared request: after
 * a provider changes their own listing, the response that matters is the one
 * issued *after* that change, and reusing an in-flight fetch started before it
 * would put stale data back into the cache.
 */
export async function syncListings(options?: { force?: boolean }): Promise<Listing[]> {
  if (MOCK_API) return getAllListings();
  if (inFlight && !options?.force) return inFlight;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const request = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pulses`, { signal: controller.signal });
      const payload = (await response.json().catch(() => null)) as PulsesResponse | null;

      if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
        lastSyncFailure = {
          isOffline: false,
          message: "Couldn't refresh live listings. Showing the listings currently available.",
        };
        return getAllListings();
      }

       const listings = payload.data
         .map(pulseToListing)
         .filter((listing): listing is Listing => listing !== null);

       setRemoteListings(listings);
       void savePublicFeedCache(listings);
       lastSyncFailure = null;
       return getAllListings();
     } catch (error) {
       // Try to serve cached feed before falling back to seed data.
       const cached = await loadPublicFeedCache();
       if (cached && cached.listings.length > 0) {
         setRemoteListings(cached.listings);
         lastSyncFailure = {
           isOffline: true,
           message: "You're offline. Showing cached listings.",
         };
         return getAllListings();
       }
       // The seed data keeps the feed usable when the API is unreachable.
       const isOffline =
         error instanceof TypeError ||
         (error instanceof Error && error.name === 'AbortError');
       lastSyncFailure = {
         isOffline,
         message: isOffline
           ? "You're offline. Live listings may be missing or out of date."
           : "Couldn't refresh live listings. Showing the listings currently available.",
       };
       return getAllListings();
     } finally {
      clearTimeout(timeout);
    }
  })();

  inFlight = request;

  try {
    return await request;
  } finally {
    // Identity-checked: a forced sync may have replaced `inFlight` while this
    // one was still settling, and clearing it unconditionally would drop the
    // newer request and let the next caller start a duplicate fetch.
    if (inFlight === request) inFlight = null;
  }
}

/**
 * Fetches nearby listings from the geospatial endpoint.
 *
 * Unlike syncListings, this does NOT merge with seed data — it returns
 * ONLY the API results (which already have distanceMeters computed).
 * Seed data has no reliable coordinates, so it cannot participate in
 * geospatial queries.
 *
 * @param latitude - Customer GPS latitude
 * @param longitude - Customer GPS longitude
 * @param radiusMeters - Search radius (default 5000)
 * @param category - Optional category filter
 * @param status - Optional status filter (default: Available,Low Supply,Unavailable)
 */
export interface NearbyListingsOptions {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  category?: Category;
  status?: string | string[];
}

export async function fetchNearbyListings(
  options: NearbyListingsOptions
): Promise<Listing[]> {
  if (MOCK_API) return [];

  const { latitude, longitude, radiusMeters = 5000, category, status } = options;

  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radius: String(radiusMeters),
  });
  if (category) params.append('category', category);
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    statuses.forEach((s) => params.append('status', s));
  }

  const response = await requestWithTimeout(
    `${API_BASE_URL}/pulses/nearby?${params}`,
    {},
  );
  const payload = (await response.json().catch(() => null)) as PulsesResponse | null;

  if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
    throw responseError(response, payload?.message, 'Could not refresh nearby listings.');
  }

  // The API already returns distanceMeters; pulseToListing will capture it
  return payload.data
    .map(pulseToListing)
    .filter((listing): listing is Listing => listing !== null);
}

type PulseEnvelope = {
  success?: boolean;
  message?: string;
  data?: Pulse;
};

async function requestWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new ApiError('The request timed out. Check your connection and try again.', {
        isOffline: true,
        isTimeout: true,
      });
    }
    if (error instanceof TypeError) {
      const method = (init.method || 'GET').toUpperCase();
      if (method !== 'GET') {
        const { enqueueRequest } = await import('./offline-queue');
        await enqueueRequest({
          path: url.replace(API_BASE_URL, ''),
          method,
          body: init.body ? JSON.parse(init.body as string) : undefined,
          token: (init.headers as Record<string, string>)?.Authorization?.replace('Bearer ', '') ?? null,
        });
        throw new ApiError('You are offline. This action will be retried when you reconnect.', {
          isOffline: true,
          queued: true,
        });
      }
      throw new ApiError("You're offline. Check your connection and try again.", { isOffline: true });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function responseError(
  response: Response,
  message: string | undefined,
  fallback: string,
): ApiError {
  return new ApiError(
    response.status >= 500
      ? 'The service is temporarily unavailable. Please try again.'
      : message || fallback,
    { status: response.status },
  );
}

function authHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Loads the signed-in provider's own listing from GET /pulses/mine.
 *
 * This is the source of truth for the agent dashboard. The onboarding draft is
 * deliberately not used here: it is cleared on the success screen, its photos are
 * local cache URIs, and it only ever exists on the device that filled it in.
 *
 * Throws on failure so the dashboard can tell the user something went wrong,
 * rather than showing an empty state that looks like "you have no listing".
 */
export async function fetchMyListing(token: string | null): Promise<Listing | null> {
  if (MOCK_API) return null;

  const response = await requestWithTimeout(`${API_BASE_URL}/pulses/mine`, {
    headers: authHeaders(token),
  });

  const payload = (await response.json().catch(() => null)) as
    | (PulsesResponse & { message?: string })
    | null;

  if (!response.ok || !payload?.success) {
    throw responseError(response, payload?.message, 'Unable to load your listing.');
  }

  const pulses = Array.isArray(payload.data) ? payload.data : [];
  if (pulses.length === 0) return null;

  // One listing per provider is enforced server side, so the first entry is the
  // one. Mapping is not expected to fail (the API restricts `category` to the
  // same four values this app knows), but if it ever does it is a bug worth
  // surfacing rather than a reason to pretend the listing does not exist.
  const listing = pulseToListing(pulses[0]);
  if (!listing) {
    throw new Error('Your listing is saved but could not be displayed. Please contact support.');
  }

  // The /pulses/mine endpoint doesn't always return trustScore, causing the
  // provider to see a default 3.0 that disagrees with the 2.0 customers see on
  // the public feed. When the API leaves trustScore absent, fall back to the
  // value already in the store rather than the hardcoded default.
  if (typeof pulses[0].trustScore !== 'number') {
    const cached = getListing(listing.id);
    if (cached) {
      listing.trust = cached.trust;
    }
  }

  return listing;
}

/**
 * Replaces a listing's editable fields via PUT /pulses/:id. Only the fields
 * present on `updates` are sent, so the caller can send a partial patch.
 * Returns the refreshed Listing as the server now sees it.
 */
export async function updatePulse(
  listingId: string,
  updates: EditablePulse,
  token: string | null,
): Promise<Listing> {
  const response = await requestWithTimeout(`${API_BASE_URL}/pulses/${listingId}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(token),
    },
    body: JSON.stringify(updates),
  });

  const payload = (await response.json().catch(() => null)) as PulseEnvelope | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw responseError(response, payload?.message, 'Unable to update your listing.');
  }

  const listing = pulseToListing(payload.data);
  if (!listing) {
    throw new Error('Your listing was updated but could not be displayed.');
  }

  return listing;
}

/**
 * Publishes or unpublishes the signed-in provider's business via
 * PATCH /auth/me/visibility.
 *
 * Unpublishing is reversible: the listing is left untouched on the server and
 * simply stops appearing in the public feed, so publishing again restores every
 * detail and photo immediately. This is deliberately not DELETE /pulses/:id,
 * which destroys the listing and forces a full re-onboarding.
 *
 * Throws with the server's own reason on failure.
 */
export async function setListingVisibility(
  visibility: 'public' | 'private',
  token: string | null,
): Promise<void> {
  const response = await requestWithTimeout(`${API_BASE_URL}/auth/me/visibility`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ businessProfileVisibility: visibility }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string }
    | null;

  if (!response.ok || !payload?.success) {
    throw responseError(response, payload?.message, 'Unable to update your listing visibility.');
  }
}

/**
 * Broadcasts a new availability status via PATCH /pulses/:id/status and returns
 * the listing as the server now sees it — including the refreshed lastUpdated,
 * which is what resets the freshness countdown.
 */
export async function updateListingStatus(
  listingId: string,
  status: Pulse['status'],
  token: string | null,
): Promise<Listing> {
  const response = await requestWithTimeout(`${API_BASE_URL}/pulses/${listingId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });

  const payload = (await response.json().catch(() => null)) as PulseEnvelope | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw responseError(response, payload?.message, 'Unable to update your status.');
  }

  const listing = pulseToListing(payload.data);
  if (!listing) {
    throw new Error('Your status was updated but could not be displayed. Pull to refresh.');
  }

  return listing;
}

export async function resubmitListingForReview(
  listingId: string,
  token: string | null,
): Promise<Listing> {
  const response = await requestWithTimeout(`${API_BASE_URL}/pulses/${listingId}/resubmit`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  const payload = (await response.json().catch(() => null)) as PulseEnvelope | null;
  if (!response.ok || !payload?.success || !payload.data) {
    throw responseError(response, payload?.message, 'Unable to resubmit your listing.');
  }

  const listing = pulseToListing(payload.data);
  if (!listing) {
    throw new Error('Your listing was resubmitted but could not be displayed.');
  }
  return listing;
}
