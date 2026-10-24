/**
 * Server-side Google Maps Platform credentials.
 *
 * The mobile app keeps its own Android-restricted key for the native MapView,
 * because the native SDK needs a key that is bound to the app's package name
 * and signing certificate. That key cannot be used for the Places/Routes/Geocoding
 * web services: Google rejects those calls with
 * `API_KEY_ANDROID_APP_BLOCKED` because a plain HTTPS request carries no
 * Android app identity.
 *
 * Web-service calls are therefore proxied through this backend, and the key that
 * can spend Google quota never ships inside the client bundle.
 *
 * This value must only ever come from the backend's own environment (Render
 * dashboard or a local .env). It must never be exposed through an
 * `EXPO_PUBLIC_*` variable, committed, or logged.
 */
const GOOGLE_MAPS_API_KEY = (process.env.GOOGLE_MAPS_API_KEY || "").trim();

/** True when a usable server-side Google key is configured. */
function hasGoogleMapsKey() {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

/**
 * Removes the API key from any string before it reaches a log.
 *
 * Google error payloads do not normally echo the key, but a proxy error can
 * surface the request URL, and the key is a query parameter on the legacy
 * Geocoding endpoint. Redacting defensively costs nothing.
 */
function redactKey(value) {
  if (!value) return value;
  if (!GOOGLE_MAPS_API_KEY) return String(value);
  return String(value).split(GOOGLE_MAPS_API_KEY).join("[REDACTED]");
}

module.exports = { GOOGLE_MAPS_API_KEY, hasGoogleMapsKey, redactKey };
