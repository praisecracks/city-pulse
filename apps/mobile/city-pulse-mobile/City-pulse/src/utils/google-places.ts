import { ApiError, apiRequest } from './api-client';

/**
 * Location services for the app, proxied through the City Pulse backend.
 *
 * The app does not call Google's web services directly. It cannot: the Google
 * key it ships with is restricted to Android applications, and Google rejects
 * web-service calls that carry no Android application identity with
 * `API_KEY_ANDROID_APP_BLOCKED`. The backend holds a separate server-side key
 * and proxies the four calls the app actually needs.
 *
 * The other reason to proxy is honesty about failure. These helpers either
 * return a real answer or throw a `LocationServiceError` that says which kind
 * of failure it was. A search that matches nothing returns an empty array; a
 * search that could not be performed throws. The two are never confused, which
 * is what previously made a broken key look like an empty result set.
 */

export interface PlacePrediction {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  /** Null when Google has no location for the place. Never a substitute coordinate. */
  latitude: number | null;
  longitude: number | null;
  addressComponents: Record<string, string>;
  name: string;
}

export interface DirectionsResponse {
  routes: {
    legs: {
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      startAddress: string;
      endAddress: string;
      steps: {
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        htmlInstructions: string;
        startLocation: { lat: number; lng: number };
        endLocation: { lat: number; lng: number };
        travelMode: string;
        maneuver?: string;
      }[];
    }[];
    overviewPolyline: { points: string };
  }[];
  status: string;
}

/**
 * Why a location request could not be completed.
 *
 * Each one calls for a different thing to happen next: `offline` wants the
 * user to check their connection, `invalid_request` wants them to fix what
 * they typed, `service_misconfigured` is ours to fix and should be reported
 * rather than retried in a loop, and `quota` wants a short wait.
 */
export type LocationErrorReason =
  | 'offline'
  | 'timeout'
  | 'service_unavailable'
  | 'service_misconfigured'
  | 'quota'
  | 'invalid_request'
  | 'not_found'
  | 'unknown';

/** A location request that failed, with a reason the UI can act on. */
export class LocationServiceError extends Error {
  readonly reason: LocationErrorReason;
  readonly status: number | null;
  /** True when trying the same request again later could plausibly work. */
  readonly isRetryable: boolean;

  constructor(
    reason: LocationErrorReason,
    message: string,
    options: { status?: number | null; isRetryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'LocationServiceError';
    this.reason = reason;
    this.status = options.status ?? null;
    this.isRetryable = options.isRetryable ?? false;
  }
}

/** The server's machine codes mapped onto the reasons the app understands. */
const CODE_TO_REASON: Record<string, LocationErrorReason> = {
  LOCATION_SERVICE_MISCONFIGURED: 'service_misconfigured',
  LOCATION_SERVICE_UNAVAILABLE: 'service_unavailable',
  LOCATION_SERVICE_TIMEOUT: 'timeout',
  LOCATION_QUOTA_EXCEEDED: 'quota',
  RATE_LIMITED: 'quota',
  INVALID_REQUEST: 'invalid_request',
  PLACE_NOT_FOUND: 'not_found',
};

const RETRYABLE_REASONS: LocationErrorReason[] = [
  'offline',
  'timeout',
  'service_unavailable',
  'quota',
  'unknown',
];

/**
 * Normalises anything that was thrown into a `LocationServiceError`.
 *
 * The server's own message is kept, because it is written for a person and
 * carries no Google internals. The reason is derived from the machine code.
 */
export function toLocationError(error: unknown): LocationServiceError {
  if (error instanceof LocationServiceError) return error;

  if (error instanceof ApiError) {
    if (error.isTimeout) {
      return new LocationServiceError('timeout', error.message, {
        status: error.status,
        isRetryable: true,
      });
    }

    if (error.isOffline) {
      return new LocationServiceError('offline', error.message, {
        status: error.status,
        isRetryable: true,
      });
    }

    const mapped = error.code ? CODE_TO_REASON[error.code] : undefined;
    if (mapped) {
      return new LocationServiceError(mapped, error.message, {
        status: error.status,
        isRetryable: RETRYABLE_REASONS.includes(mapped),
      });
    }

    // A 5xx without a code is the server having a bad day.
    if (error.status !== null && error.status >= 500) {
      return new LocationServiceError('service_unavailable', error.message, {
        status: error.status,
        isRetryable: true,
      });
    }

    return new LocationServiceError('unknown', error.message, {
      status: error.status,
      isRetryable: true,
    });
  }

  return new LocationServiceError(
    'unknown',
    'Something went wrong while looking up that location.',
    { isRetryable: true },
  );
}

/**
 * A short, friendly sentence for a failed location request.
 *
 * Nothing here names a key, a quota or a project. The technical detail stays
 * in the logs.
 */
export function describeLocationError(error: unknown): string {
  const failure = toLocationError(error);

  switch (failure.reason) {
    case 'offline':
      return "You're offline. Check your connection and try again.";
    case 'timeout':
      return 'That took too long to look up. Please try again.';
    case 'service_misconfigured':
      return 'Location search is temporarily unavailable. Please try again shortly.';
    case 'quota':
      return 'Location search is busy right now. Please try again in a moment.';
    case 'invalid_request':
      return failure.message || 'That search could not be understood. Please try again.';
    case 'not_found':
      return failure.message || 'That place could not be found.';
    case 'service_unavailable':
      return 'Location search is temporarily unavailable. Please try again.';
    default:
      return failure.message || 'Something went wrong while looking up that location.';
  }
}

/** Options every location call accepts. */
export type LocationRequestOptions = {
  /**
   * The signed-in user's token, when there is one.
   *
   * The location endpoints work without a token, because the onboarding flow
   * asks for a location before the user has an account. Passing a token when
   * one exists gives the caller its own rate-limit bucket.
   */
  token?: string | null;
};

/**
 * Fetches address predictions for autocomplete.
 *
 * Resolves with the suggestions Google offered. An empty array means Google
 * found no match for the text, which is a successful search. A failed search
 * throws a `LocationServiceError`.
 */
export async function fetchPlacePredictions(
  input: string,
  options: LocationRequestOptions & { country?: string } = {},
): Promise<PlacePrediction[]> {
  const trimmed = input.trim();

  try {
    const params = new URLSearchParams({ input: trimmed });
    if (options.country) params.set('regionCode', options.country);

    const response = await apiRequest<{
      success: true;
      data: { predictions: PlacePrediction[] };
    }>(`/places/autocomplete?${params.toString()}`, {
      token: options.token ?? null,
    });

    return response?.data?.predictions ?? [];
  } catch (error) {
    throw toLocationError(error);
  }
}

/**
 * Resolves a place to its real coordinates and address.
 *
 * `latitude` and `longitude` come back null when Google has no location for
 * the place. They are never filled in with an approximation, because a wrong
 * coordinate would send the user to the wrong place while looking correct.
 */
export async function fetchPlaceDetails(
  placeId: string,
  options: LocationRequestOptions = {},
): Promise<PlaceDetails> {
  try {
    const params = new URLSearchParams({ placeId: placeId.trim() });

    const response = await apiRequest<{ success: true; data: PlaceDetails }>(
      `/places/detail?${params.toString()}`,
      { token: options.token ?? null },
    );

    return response.data;
  } catch (error) {
    throw toLocationError(error);
  }
}

/**
 * Fetches road directions between two points.
 *
 * Resolves with the route, or with an empty `routes` array when no road route
 * exists between the two points. A failed lookup throws.
 */
export async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  travelMode: 'walking' | 'driving' | 'bicycling' | 'transit' = 'walking',
  options: LocationRequestOptions = {},
): Promise<DirectionsResponse> {
  try {
    const params = new URLSearchParams({
      originLat: String(origin.latitude),
      originLng: String(origin.longitude),
      destinationLat: String(destination.latitude),
      destinationLng: String(destination.longitude),
      mode: travelMode,
    });

    const response = await apiRequest<{ success: true; data: DirectionsResponse }>(
      `/places/directions?${params.toString()}`,
      { token: options.token ?? null },
    );

    return response.data;
  } catch (error) {
    throw toLocationError(error);
  }
}

/**
 * Decodes a Google encoded polyline string to an array of {lat, lng} coordinates.
 */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}
