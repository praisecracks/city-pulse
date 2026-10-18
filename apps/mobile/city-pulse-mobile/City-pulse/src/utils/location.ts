import * as Location from 'expo-location';

import type { CustomerLocation, GPSLocation, ResolvedAddress, ServiceArea } from '@/state/app-state';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_API_KEY_ANDROID } from './api-config';
import { Platform } from 'react-native';

const EARTH_RADIUS_METERS = 6371000;
const LOCATION_TIMEOUT_MS = 15000;

interface GoogleGeocodeResult {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
    location_type: string;
  };
  place_id: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[];
  status: string;
}

function parseGoogleAddressComponents(components: GoogleGeocodeResult['address_components']) {
  const result: Record<string, string> = {};
  for (const component of components) {
    for (const type of component.types) {
      // Keep the most specific (longest) value for each type
      if (!result[type] || component.long_name.length > result[type].length) {
        result[type] = component.long_name;
      }
    }
  }
  return result;
}

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

export async function getAutomaticLocation(): Promise<CustomerLocation> {
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

  // Get detailed address from Google Geocoding (or fallback)
  const detailed = await getDetailedAddress(latitude, longitude);

  // Determine service area from GPS (prefer Google result, then city)
  let serviceAreaName = detailed.area || detailed.locality || detailed.city || 'Unknown area';
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
  };
}

// New function to get detailed address components for form fields
export async function getDetailedAddress(latitude: number, longitude: number): Promise<{
  area: string;
  streetName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  components: Record<string, string>;
  locality?: string;
}> {
  const apiKey = Platform.OS === 'android' ? GOOGLE_MAPS_API_KEY_ANDROID : GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      area: '',
      streetName: '',
      streetAddress: '',
      city: '',
      state: '',
      country: '',
      formattedAddress: '',
      components: {},
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en&region=ng`;
    const response = await fetch(url);
    const data: GoogleGeocodeResponse = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
      return {
        area: '',
        streetName: '',
        streetAddress: '',
        city: '',
        state: '',
        country: '',
        formattedAddress: '',
        components: {},
      };
    }

    // Search ALL results for most granular community
    let bestResult = data.results[0];
    let bestCommunity = '';

    for (const result of data.results) {
      const components = parseGoogleAddressComponents(result.address_components);
      const foundCommunity = extractMostSpecificCommunity(components);
      if (foundCommunity && foundCommunity.length > bestCommunity.length) {
        bestResult = result;
        bestCommunity = foundCommunity;
      }
    }

    const components = parseGoogleAddressComponents(bestResult.address_components);

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
      formattedAddress: bestResult.formatted_address,
      components,
      locality: components.locality,
    };
  } catch (e) {
    console.warn('[Location] Detailed address fetch failed:', e);
    return {
      area: '',
      streetName: '',
      streetAddress: '',
      city: '',
      state: '',
      country: '',
      formattedAddress: '',
      components: {},
    };
  }
}

export function createManualLocation(input: {
  label: string;
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
      confidence: 'medium',
    },
    label: name,
    mode: 'manual',
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
