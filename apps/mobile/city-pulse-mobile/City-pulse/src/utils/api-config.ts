import { Platform } from 'react-native';
import Constants from 'expo-constants';

const EMULATOR_HOST = 'http://10.0.2.2:5000/api/v1';
const LOCALHOST_HOST = 'http://localhost:5000/api/v1';

/**
 * In development with Expo Go, auto-derives the backend URL from the dev
 * server's host URI (e.g. "10.123.250.174:8081" → "http://10.123.250.174:5000/api/v1").
 * This avoids hard-coding a LAN IP that changes on every network.
 */
function devServerApiUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  // "localhost" inside an Android emulator refers to the emulator itself,
  // not the dev machine — fall back to the emulator loopback.
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return null;
  }
  return `http://${host}:5000/api/v1`;
}

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  devServerApiUrl() ||
  (Platform.OS === 'android' ? EMULATOR_HOST : LOCALHOST_HOST);

export const API_TIMEOUT_MS = 15000;

export const MOCK_API = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

/**
 * Google Maps / Places API keys.
 *
 * These are read from Expo's extra config (app.json) which in turn pulls from
 * process.env at build time. In Expo Go / development builds, they come from
 * EAS secrets or local .env. In production builds, they're embedded.
 *
 * Keys are platform-specific because Google Cloud recommends separate keys
 * with different restriction policies for Android, iOS, and web/backend.
 */
export const GOOGLE_MAPS_API_KEY: string | undefined =
  Constants.expoConfig?.extra?.googleMapsApiKey ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const GOOGLE_MAPS_API_KEY_ANDROID: string | undefined =
  Constants.expoConfig?.extra?.googleMapsApiKeyAndroid ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID;

export const GOOGLE_MAPS_API_KEY_IOS: string | undefined =
  Constants.expoConfig?.extra?.googleMapsApiKeyIos ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS;

/**
 * True when a usable Google Maps key is available for the current platform.
 * Used to gate features that require the Maps/Places APIs.
 *
 * Shares the same normalization as `getGoogleMapsApiKey` so the two can never
 * disagree: a placeholder iOS key must not enable Google Maps on iOS while
 * simultaneously being rejected by every Places call.
 */
export const hasGoogleMapsKey = (): boolean => Boolean(getGoogleMapsApiKey());

/**
 * Returns the platform-appropriate Google Maps API key for the native MapView.
 *
 * This key is only for the native map. It must never be used for the Places,
 * Routes or Geocoding web services: Google rejects those calls with
 * `API_KEY_ANDROID_APP_BLOCKED` because a request from the app carries no
 * Android application identity. Those services are proxied through the backend
 * instead — see `src/utils/google-places.ts`.
 *
 * The iOS key is intentionally left as a placeholder in `.env.local`, so on
 * iOS this returns undefined and the native map degrades to the default
 * provider rather than sending a fake key to Google.
 */
export function getGoogleMapsApiKey(): string | undefined {
  return normalizeApiKey(
    Platform.OS === 'android' ? GOOGLE_MAPS_API_KEY_ANDROID : GOOGLE_MAPS_API_KEY_IOS,
  );
}

/** Treats empty strings and placeholder values as "no key configured". */
function normalizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^(your[_-]?api[_-]?key[_-]?here|replace[_-]?me|todo|xxx|placeholder)$/i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Turns a host-independent asset path returned by the API (e.g.
 * "/uploads/ab12.jpg") into something the image loader can fetch. Keeping the
 * stored value relative is what lets a listing survive the API moving to a
 * different host or a CDN.
 */
export function resolveApiAssetUrl(path: string): string {
  if (!path) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
