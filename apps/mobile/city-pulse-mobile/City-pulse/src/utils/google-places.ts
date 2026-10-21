import { getGoogleMapsApiKey } from './api-config';

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
  latitude: number;
  longitude: number;
  addressComponents: Record<string, string>;
  name: string;
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      startAddress: string;
      endAddress: string;
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        htmlInstructions: string;
        startLocation: { lat: number; lng: number };
        endLocation: { lat: number; lng: number };
        travelMode: string;
        maneuver?: string;
      }>;
    }>;
    overviewPolyline: { points: string };
  }>;
  status: string;
}

const PLACES_AUTOCOMPLETE_BASE = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACES_DETAILS_BASE = 'https://places.googleapis.com/v1/places';
const DIRECTIONS_BASE = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/**
 * Fetches address predictions for autocomplete.
 *
 * Uses the Places API (New) rather than the legacy Autocomplete endpoint. The
 * legacy API is not enabled for this project and returns REQUEST_DENIED, so
 * the New endpoint is the only one that works here. It requires a POST body
 * and an `X-Goog-FieldMask` header instead of query params.
 */
export async function fetchPlacePredictions(
  input: string,
  options?: { country?: string; types?: string }
): Promise<PlacePrediction[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return [];

  const body: Record<string, unknown> = { input, languageCode: 'en' };

  if (options?.types) {
    // New API takes an array of types, e.g. ["locality","establishment"].
    body.types = options.types.split(',').map((t) => t.trim()).filter(Boolean);
  }

  if (options?.country) {
    // The New Places API scopes results by ISO 3166-1 alpha-2 country code via
    // `regionCode`, not the legacy `country` query parameter. Without this the
    // caller's Nigeria restriction was silently discarded.
    body.regionCode = options.country;
  }

  try {
    const response = await fetch(PLACES_AUTOCOMPLETE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Only the fields the client reads; keeps the response small.
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormatting,suggestions.placePrediction.description',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn('[Places] Autocomplete error:', data.error?.message || response.status);
      return [];
    }

    return ((data.suggestions as any[]) || []).map((s: any) => {
      const prediction = s.placePrediction || {};
      return {
        placeId: prediction.placeId || '',
        description: prediction.description || prediction.text?.text || '',
        structuredFormatting: {
          mainText: prediction.structuredFormatting?.mainText?.text || prediction.description || '',
          secondaryText: prediction.structuredFormatting?.secondaryText?.text || '',
        },
      };
    }).filter((p) => p.placeId);
  } catch (e) {
    console.warn('[Places] Autocomplete fetch failed:', e);
    return [];
  }
}

/**
 * Fetches detailed place information including coordinates.
 *
 * Uses the Places API (New) GET endpoint with a field mask.
 */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${PLACES_DETAILS_BASE}/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'id,formattedAddress,location,addressComponents,displayName',
      },
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn('[Places] Details error:', data.error?.message || response.status);
      return null;
    }

    const result = data;
    const components: Record<string, string> = {};
    for (const comp of result.addressComponents || []) {
      for (const type of comp.types || []) {
        if (!components[type] || comp.longName.length > components[type].length) {
          components[type] = comp.longName;
        }
      }
    }

    return {
      placeId: result.id || placeId,
      formattedAddress: result.formattedAddress || '',
      latitude: result.location?.latitude ?? 0,
      longitude: result.location?.longitude ?? 0,
      addressComponents: components,
      name: result.displayName?.text || result.formattedAddress || '',
    };
  } catch (e) {
    console.warn('[Places] Details fetch failed:', e);
    return null;
  }
}

/**
 * Fetches real road directions from Google Routes API (new).
 */
export async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  travelMode: 'walking' | 'driving' | 'bicycling' | 'transit' = 'walking'
): Promise<DirectionsResponse | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  // Map travel mode to Routes API format
  const modeMap: Record<string, string> = {
    walking: 'WALK',
    driving: 'DRIVE',
    bicycling: 'BICYCLE',
    transit: 'TRANSIT',
  };

  const body = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode: modeMap[travelMode],
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: 'en',
    regionCode: 'ng',
    units: 'METRIC',
  };

  try {
    const androidCert = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_CERT_SHA1;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.endLocation',
    };

    // Identify this Android app to Google so an API key restricted to
    // "Android apps" accepts the request instead of returning
    // "Requests from this Android client application <empty> are blocked."
    if (androidCert) {
      headers['X-Android-Package'] = 'com.citypulse.app';
      headers['X-Android-Cert'] = androidCert;
    }

    const response = await fetch(DIRECTIONS_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.warn('[Directions] Error:', data.error.message);
      return null;
    }

    // Transform Routes API response to match legacy DirectionsResponse format
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs?.[0];
      
      if (!leg) return null;

      // Build steps array in legacy format
      const steps = (leg.steps || []).map((step: any) => ({
        htmlInstructions: step.navigationInstruction?.instructions || '',
        distance: { text: `${step.distanceMeters} m`, value: step.distanceMeters },
        duration: { text: step.staticDuration, value: parseDuration(step.staticDuration) },
        startLocation: step.startLocation?.latLng ? {
          lat: step.startLocation.latLng.latitude,
          lng: step.startLocation.latLng.longitude,
        } : { lat: origin.latitude, lng: origin.longitude },
        endLocation: step.endLocation?.latLng ? {
          lat: step.endLocation.latLng.latitude,
          lng: step.endLocation.latLng.longitude,
        } : { lat: destination.latitude, lng: destination.longitude },
        travelMode: travelMode,
      }));

      return {
        routes: [{
          legs: [{
            distance: { text: `${leg.distanceMeters} m`, value: leg.distanceMeters },
            duration: { text: leg.duration, value: parseDuration(leg.duration) },
            startAddress: '',
            endAddress: '',
            steps,
          }],
          overviewPolyline: { points: route.polyline?.encodedPolyline || '' },
        }],
        status: 'OK',
      };
    }

    return null;
  } catch (e) {
    console.warn('[Directions] Fetch failed:', e);
    return null;
  }
}

function parseDuration(durationStr: string): number {
  // Parse ISO 8601 duration (e.g., "120s", "2m30s") to seconds
  const match = durationStr.match(/(\d+)h?|(\d+)m?|(\d+)s/);
  if (!match) return 0;
  
  let seconds = 0;
  if (match[1]) seconds += parseInt(match[1]) * 3600;
  if (match[2]) seconds += parseInt(match[2]) * 60;
  if (match[3]) seconds += parseInt(match[3]);
  return seconds;
}

/**
 * Decodes a Google encoded polyline string to an array of {lat, lng} coordinates.
 */
export function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = [];
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