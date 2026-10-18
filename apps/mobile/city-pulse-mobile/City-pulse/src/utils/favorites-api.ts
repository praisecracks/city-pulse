import { apiRequest } from './api-client';
import { MOCK_API } from './api-config';
import { type Pulse, pulseToListing } from './listing-sync';
import type { Listing } from '@/data/product';

/**
 * Saved listings are account-scoped so they follow a person to a new phone.
 *
 * The API is the source of truth. The app still keeps a local cache so the
 * Saved tab renders instantly on a cold start, but that cache is reconciled
 * against the server on sign-in and on every mutation — it is never the place
 * where a favourite actually lives.
 */

type FavoritesRequest = {
  method?: string;
  /** Passed through to `apiRequest`, which stringifies it once. */
  body?: unknown;
};

async function requestFavorites(
  path: string,
  init: FavoritesRequest,
  token: string | null,
): Promise<string[]> {
  const payload = await apiRequest<{ favorites?: string[] }>(path, {
    method: init.method ?? 'GET',
    body: init.body,
    token,
  });

  return Array.isArray(payload?.favorites) ? payload.favorites : [];
}

/** The account's saved listing ids. */
export async function fetchFavoriteIds(token: string | null): Promise<string[]> {
  if (MOCK_API) return [];
  return requestFavorites('/auth/me/favorites', { method: 'GET' }, token);
}

/** The account's saved listings, resolved. */
export async function fetchFavoriteListings(token: string | null): Promise<Listing[]> {
  if (MOCK_API) return [];

  try {
    const payload = await apiRequest<{ data?: Pulse[] }>('/auth/me/favorites', { token });
    const rows = Array.isArray(payload?.data) ? payload.data : [];

    return rows
      .map(pulseToListing)
      .filter((listing): listing is Listing => listing !== null);
  } catch {
    // A network failure must not empty the Saved tab — the caller falls back to
    // whatever the local cache already holds.
    return [];
  }
}

export async function addFavoriteRemote(pulseId: string, token: string | null): Promise<string[]> {
  if (MOCK_API) return [];
  return requestFavorites('/auth/me/favorites', {
    method: 'POST',
    // Raw object: `apiRequest` stringifies it. Stringifying here too
    // would double-encode it and the server would read no pulseId.
    body: { pulseId },
  }, token);
}

export async function removeFavoriteRemote(pulseId: string, token: string | null): Promise<string[]> {
  if (MOCK_API) return [];
  return requestFavorites(`/auth/me/favorites/${encodeURIComponent(pulseId)}`, {
    method: 'DELETE',
  }, token);
}
