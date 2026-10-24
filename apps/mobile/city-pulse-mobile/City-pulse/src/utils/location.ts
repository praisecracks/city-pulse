import * as Location from 'expo-location';

import type {
  CustomerLocation,
  GPSLocation,
  LocationVerification,
  ResolvedAddress,
  ServiceArea,
} from '@/state/app-state';
import { apiRequest } from './api-client';
import { type LocationServiceError, toLocationError } from './google-places';

const EARTH_RADIUS_METERS = 6371000;
const LOCATION_TIMEOUT_MS = 15000;

/** A single reverse-geocoding candidate, normalised by the backend. */
type ReverseGeocodeResult = {
  formattedAddress: string;
  addressComponents: Record<string, string>;
  latitude: number | null;
  longitude: number | null;
};

/** The address fields the app needs, once a coordinate has been resolved. */
export type ResolvedAddressDetails = {
  area: string;
  streetName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  components: Record<string, string>;
  locality?: string;
};

/**
 * The outcome of resolving a coordinate into an address.
 *
 * `unresolved` and `failed` are kept apart on purpose. The first means Google
 * looked and had nothing; the second means the lookup never happened. The
 * first is a fact about the world, the second is a fact about the service, and
 * only one of them is worth retrying.
 */
export type AddressResolution =
  | { status: 'resolved'; address: ResolvedAddressDetails }
  | { status: 'unresolved' }
  | { status: 'failed'; error: LocationServiceError };

/** The address details used when a lookup produced nothing usable. */
const EMPTY_ADDRESS: ResolvedAddressDetails = {
  area: '',
  streetName: '',
  streetAddress: '',
  city: '',
  state: '',
  country: '',
  formattedAddress: '',
  components: {},
};

// Ordered from most specific to least specific community-level component.
// Returns the first match, which is the most granular community/neighborhood name.
const COMMUNITY_COMPONENT_ORDER = [
  'neighborhood',
  'sublocality_level_3',
  'sublocality_level_2',
  'sublocality_level_1',
  'sublocality',
  'locality',
  'postal_city',
  'administrative_area_level_2',
  'administrative_area_level_1',
  'district',
] as const;

export function extractMostSpecificCommunity(components: Record<string, string>): string {
  for (const type of COMMUNITY_COMPONENT_ORDER) {
    const value = components[type];
    if (value && value.length > 0) return value;
  }
  return '';
}

export function getStreetName(components: Record<string, string>): string {
  const parts = [components.street_number, components.route].filter(Boolean);
  return parts.join(' ');
}

export interface GPSResult extends CustomerLocation {
  source: 'gps';
}

/**
 * True when the location was resolved to real coordinates.
 *
 * Locations stored before the verification field existed have no marker, so
 * they fall back to "has coordinates means verified". A location can only be
 * unverified when it explicitly says so, which is what keeps a typed address
 * from being presented as a real place.
 */
export function isLocationVerified(
  location: CustomerLocation | null | undefined,
): location is CustomerLocation & { verification: 'verified' } {
  if (!location) return false;
  if (location.verification) return location.verification === 'verified';
  return location.gps !== null;
}

/**
 * Reverse geocodes a coordinate into an address, through the backend proxy.
 *
 * The app cannot call the Geocoding API itself: the Google key it ships with
 * is restricted to Android applications, and Google rejects web-service calls
 * from it. The backend holds a server-side key and proxies the call.
 */
export async function resolveAddress(
  latitude: number,
  longitude: number,
  options: { token?: string | null } = {},
): Promise<AddressResolution> {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
    });

    const response = await apiRequest<{
      success: true;
      data: { results: ReverseGeocodeResult[] };
    }>(`/places/reverse?${params.toString()}`, {
      token: options.token ?? null,
    });

    const results = response?.data?.results ?? [];
    if (results.length === 0) {
      return { status: 'unresolved' };
    }

    return { status: 'resolved', address: pickMostSpecificAddress(results) };
  } catch (error) {
    return { status: 'failed', error: toLocationError(error) };
  }
}

/**
 * Picks the candidate with the most granular community name.
 *
 * Google returns several candidates for a coordinate, and the most specific
 * one ("Jesutedo") is the neighbourhood the user recognises, while the least
 * specific is just the city.
 */
function pickMostSpecificAddress(results: ReverseGeocodeResult[]): ResolvedAddressDetails {
  let bestResult = results[0];
  let bestCommunity = '';

  for (const result of results) {
    const foundCommunity = extractMostSpecificCommunity(result.addressComponents ?? {});
    if (foundCommunity && foundCommunity.length > bestCommunity.length) {
      bestResult = result;
      bestCommunity = foundCommunity;
    }
  }

  const components = bestResult.addressComponents ?? {};
  const community = extractMostSpecificCommunity(components);
  const streetName = getStreetName(components);
  const streetNumber = components.street_number || '';
  const route = components.route || '';

  // Build street address (number + route)
  const streetAddress = [streetNumber, route].filter(Boolean).join(' ') || streetName || route || '';

  return {
    area: community,
    streetName,
    streetAddress,
    city: components.city || components.locality || '',
    state: components.administrative_area_level_1 || '',
    country: components.country || '',
    formattedAddress: bestResult.formattedAddress || '',
    components,
    locality: components.locality,
  };
}

export async function getAutomaticLocation(
  options: { token?: string | null } = {},
): Promise<CustomerLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Location permission was not granted');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
  if (!servicesEnabled) {
    throw new Error('Location services are disabled');
  }

  const position =
    (await Location.getLastKnownPositionAsync({
      maxAge: 120000,
      requiredAccuracy: 500,
    }).catch(() => null)) ??
    (await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out')), LOCATION_TIMEOUT_MS),
      ),
    ]));

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy ?? undefined;
  const timestamp = Date.now();

  // Resolve the address for the coordinates. A failure here does not
  // invalidate the fix: the coordinates are real, so the location stays
  // verified and only the human-readable address is missing.
  const resolution = await resolveAddress(latitude, longitude, options);
  const detailed = resolution.status === 'resolved' ? resolution.address : EMPTY_ADDRESS;

  // Determine service area from GPS (prefer Google result, then city)
  const serviceAreaName = detailed.area || detailed.locality || detailed.city || 'Unknown area';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (detailed.area) {
    confidence = 'high';
  } else if (detailed.locality || detailed.city) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const gps: GPSLocation = { latitude, longitude, accuracy, timestamp };
  const address: ResolvedAddress = {
    streetName: detailed.streetName,
    community: detailed.area,
    locality: detailed.locality || detailed.city,
    administrativeArea: detailed.state,
    country: detailed.country,
    formattedAddress: detailed.formattedAddress,
    components: detailed.components,
  };
  const serviceArea: ServiceArea = {
    name: serviceAreaName,
    source: 'gps',
    confidence,
  };

  // Label for backward compatibility: prefer street+community, then community, then formatted
  const label = detailed.streetName && detailed.area
    ? `${detailed.streetName}, ${detailed.area}`
    : detailed.area || detailed.formattedAddress || serviceAreaName;

  return {
    gps,
    address,
    serviceArea,
    label,
    mode: 'automatic',
    // The GPS fix is the location. It is verified whatever the address lookup
    // returned.
    verification: 'verified',
  };
}

/**
 * Builds a location from an address the user typed that could not be
 * resolved.
 *
 * The result carries no coordinates, and says so. That is the whole point:
 * an unverified location cannot support nearby search or directions, and
 * presenting it as though it could would send the user looking for services
 * that the app has no way to locate.
 */
export function createManualLocation(input: {
  label: string;
  verification?: LocationVerification;
}): CustomerLocation {
  if (!input.label.trim()) {
    throw new Error('Manual location is incomplete');
  }

  const name = input.label.trim();

  return {
    gps: null,
    address: null,
    serviceArea: {
      name,
      source: 'manual',
      // No coordinates means no confidence in the area, whatever the text says.
      confidence: 'low',
    },
    label: name,
    mode: 'manual',
    verification: input.verification ?? 'unverified',
  };
}

export function getDistanceMeters(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return '';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const kilometers = meters / 1000;
  return `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`;
}
