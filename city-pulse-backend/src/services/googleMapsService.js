const fetch = require("node-fetch");

const { GOOGLE_MAPS_API_KEY, hasGoogleMapsKey, redactKey } = require("../config/google");

/**
 * Google Maps Platform web-service proxy layer.
 *
 * Every call in here runs on the server with a server-side key. The mobile
 * client never sees the key, and never speaks to Google directly for these
 * services.
 *
 * Failures are normalised into `GoogleApiError` so that a caller can tell the
 * difference between "the key is not allowed to do this", "the API is not
 * switched on", "we ran out of quota", "Google timed out" and "the request was
 * malformed" — a distinction the app needs, because each one calls for a
 * different user-facing message and a different recovery action.
 */

const PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";
const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/** Upstream budget. The app waits on these, so they must stay well under the mobile request timeout. */
const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * Stable machine-readable reasons for a Google call that did not succeed.
 *
 * `UNKNOWN` is a last resort; every path we can identify should land on one of
 * the specific reasons so the app can react appropriately.
 */
const GOOGLE_ERROR_REASONS = {
  KEY_RESTRICTED: "KEY_RESTRICTED",
  SERVICE_DISABLED: "SERVICE_DISABLED",
  BILLING_DISABLED: "BILLING_DISABLED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  INVALID_REQUEST: "INVALID_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  TIMEOUT: "TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  UNKNOWN: "UNKNOWN",
};

/** A Google call that did not succeed, with a reason the app can act on. */
class GoogleApiError extends Error {
  constructor(reason, message, options = {}) {
    super(message);
    this.name = "GoogleApiError";
    this.reason = reason;
    this.status = options.status ?? null;
    // The upstream explanation. Never sent to the client — it can name the
    // project, the key restrictions and internal URLs. Logged only, redacted.
    this.upstreamMessage = options.upstreamMessage ?? null;
  }
}

/** Reasons that mean "the request itself was wrong", not "the service is broken". */
function isClientFault(reason) {
  return (
    reason === GOOGLE_ERROR_REASONS.INVALID_REQUEST ||
    reason === GOOGLE_ERROR_REASONS.NOT_FOUND
  );
}

/**
 * Turns Google's `error.details[].reason` into one of our reasons.
 *
 * Google uses a stable machine reason on every error it documents, which is
 * far more reliable to branch on than the human-readable message.
 */
function classifyGooglePayload(status, payload) {
  const details = Array.isArray(payload?.error?.details) ? payload.error.details : [];
  const reasons = details.map((detail) => detail?.reason).filter(Boolean);
  const message = payload?.error?.message || "";

  if (reasons.includes("API_KEY_SERVICE_BLOCKED") || reasons.includes("SERVICE_DISABLED")) {
    return GOOGLE_ERROR_REASONS.SERVICE_DISABLED;
  }
  if (
    reasons.includes("API_KEY_ANDROID_APP_BLOCKED") ||
    reasons.includes("API_KEY_HTTP_REFERRER_BLOCKED") ||
    reasons.includes("API_KEY_IP_ADDRESS_BLOCKED") ||
    reasons.includes("API_KEY_INVALID") ||
    reasons.includes("API_KEY_EXPIRED")
  ) {
    return GOOGLE_ERROR_REASONS.KEY_RESTRICTED;
  }
  if (reasons.includes("API_PROJECT_BLOCKED") || reasons.includes("BILLING_NOT_ENABLED")) {
    return GOOGLE_ERROR_REASONS.BILLING_DISABLED;
  }
  if (reasons.includes("RATE_LIMIT_EXCEEDED") || status === 429) {
    return GOOGLE_ERROR_REASONS.QUOTA_EXCEEDED;
  }
  if (status === 404) {
    return GOOGLE_ERROR_REASONS.NOT_FOUND;
  }
  if (status === 400) {
    return GOOGLE_ERROR_REASONS.INVALID_REQUEST;
  }
  if (status >= 500) {
    return GOOGLE_ERROR_REASONS.UPSTREAM_ERROR;
  }
  if (status === 401 || status === 403) {
    // Permission denied without a documented reason. Treat as a key problem:
    // the key is the only thing that can be wrong at this point.
    return GOOGLE_ERROR_REASONS.KEY_RESTRICTED;
  }
  if (/not activated|has not been used|is disabled/i.test(message)) {
    return GOOGLE_ERROR_REASONS.SERVICE_DISABLED;
  }
  return GOOGLE_ERROR_REASONS.UNKNOWN;
}

/**
 * Classifies the legacy Geocoding API, which reports failures through a
 * `status` string and an `error_message` rather than an `error` object.
 */
function classifyLegacyGeocodeStatus(status, errorMessage) {
  const message = (errorMessage || "").toLowerCase();

  if (status === "OVER_QUERY_LIMIT") {
    return GOOGLE_ERROR_REASONS.QUOTA_EXCEEDED;
  }
  if (status === "REQUEST_DENIED") {
    if (message.includes("not activated") || message.includes("has not been used")) {
      return GOOGLE_ERROR_REASONS.SERVICE_DISABLED;
    }
    return GOOGLE_ERROR_REASONS.KEY_RESTRICTED;
  }
  if (status === "INVALID_REQUEST") {
    return GOOGLE_ERROR_REASONS.INVALID_REQUEST;
  }
  if (status === "UNKNOWN_ERROR") {
    return GOOGLE_ERROR_REASONS.UPSTREAM_ERROR;
  }
  return GOOGLE_ERROR_REASONS.UNKNOWN;
}

/**
 * Performs a Google web-service request and returns the parsed JSON body.
 *
 * Throws `GoogleApiError` for every failure mode so that no caller can
 * accidentally treat a failed request as an empty result.
 */
async function googleRequest(url, options = {}) {
  if (!hasGoogleMapsKey()) {
    throw new GoogleApiError(
      GOOGLE_ERROR_REASONS.NOT_CONFIGURED,
      "The server-side Google Maps key is not configured.",
    );
  }

  const { method = "GET", body, fieldMask } = options;

  const headers = {
    "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
  };
  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
  if (body) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timeout: UPSTREAM_TIMEOUT_MS,
    });
  } catch (error) {
    const timedOut = error?.type === "request-timeout" || error?.name === "AbortError";
    if (timedOut) {
      throw new GoogleApiError(
        GOOGLE_ERROR_REASONS.TIMEOUT,
        `Google did not respond within ${UPSTREAM_TIMEOUT_MS}ms.`,
      );
    }
    throw new GoogleApiError(
      GOOGLE_ERROR_REASONS.NETWORK_ERROR,
      "Could not reach Google Maps Platform.",
      { upstreamMessage: redactKey(error?.message) },
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const reason = classifyGooglePayload(response.status, payload);
    throw new GoogleApiError(reason, `Google responded with HTTP ${response.status}.`, {
      status: response.status,
      upstreamMessage: redactKey(payload?.error?.message || ""),
    });
  }

  return payload;
}

/**
 * Flattens Google's `address_components` array into a `{ type: longName }`
 * map, keeping the most specific value for each type.
 */
function flattenAddressComponents(components) {
  const flattened = {};
  for (const component of Array.isArray(components) ? components : []) {
    const longName = component?.longText || component?.long_name || "";
    for (const type of component?.types || []) {
      if (!flattened[type] || longName.length > flattened[type].length) {
        flattened[type] = longName;
      }
    }
  }
  return flattened;
}

/**
 * Places API (New) autocomplete.
 *
 * Returns the suggestions Google offered, already reduced to the fields the
 * app renders. A search that legitimately matches nothing returns an empty
 * array — that is a success, not an error.
 */
async function fetchPlacePredictions(input, options = {}) {
  const { regionCode } = options;

  const body = { input, languageCode: "en" };
  if (regionCode) body.regionCode = regionCode;

  const payload = await googleRequest(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    body,
    fieldMask:
      "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
  });

  const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];

  return suggestions
    .map((suggestion) => {
      const prediction = suggestion?.placePrediction || {};
      // Places API (New) calls this `structuredFormat`. The older
      // `structuredFormatting` spelling is accepted too so a response shaped by
      // either generation still renders.
      const structured = prediction?.structuredFormat || prediction?.structuredFormatting || {};
      const mainText = structured?.mainText?.text || prediction?.text?.text || "";
      const secondaryText = structured?.secondaryText?.text || "";
      return {
        placeId: prediction?.placeId || "",
        description: prediction?.text?.text || mainText,
        structuredFormatting: { mainText, secondaryText },
      };
    })
    .filter((prediction) => prediction.placeId.length > 0);
}

/**
 * Places API (New) place details, used to turn a selected suggestion into
 * real coordinates.
 *
 * When Google does not return a location for a place, `latitude` and
 * `longitude` come back as `null`. They are never defaulted to `0`: a
 * fabricated coordinate would silently point the user at the Gulf of Guinea.
 */
async function fetchPlaceDetails(placeId) {
  const payload = await googleRequest(
    `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      fieldMask: "id,formattedAddress,location,addressComponents,displayName",
    },
  );

  const latitude = payload?.location?.latitude;
  const longitude = payload?.location?.longitude;

  return {
    placeId: payload?.id || placeId,
    formattedAddress: payload?.formattedAddress || "",
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    addressComponents: flattenAddressComponents(payload?.addressComponents),
    name: payload?.displayName?.text || payload?.formattedAddress || "",
  };
}

/**
 * Parses a duration into seconds.
 *
 * Routes v2 returns plain seconds ("600s"), and the full ISO 8601 form
 * ("PT1H30M") is accepted too.
 *
 * The obvious regex — `/(\d+)h?|(\d+)m?|(\d+)s/` — is wrong here. Every
 * alternative is optional, so on "120s" it matches the digits as the *hours*
 * group and the hours branch wins, turning a two-minute step into twelve
 * hours. The groups have to be matched in order and anchored instead.
 */
function parseDuration(durationString) {
  const raw = String(durationString || "").trim();
  if (!raw) return 0;

  const secondsOnly = raw.match(/^(\d+(?:\.\d+)?)s$/i);
  if (secondsOnly) {
    return Math.round(parseFloat(secondsOnly[1]));
  }

  const iso = raw.match(
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i,
  );
  if (iso) {
    const [, days, hours, minutes, seconds] = iso;
    return Math.round(
      (days ? parseFloat(days) * 86400 : 0) +
        (hours ? parseFloat(hours) * 3600 : 0) +
        (minutes ? parseFloat(minutes) * 60 : 0) +
        (seconds ? parseFloat(seconds) : 0),
    );
  }

  return 0;
}

/**
 * Routes API v2 directions, normalised into the shape the app's directions
 * screen already consumes.
 *
 * A route that does not exist is reported as an empty `routes` array rather
 * than an error, so the app can say "no route" instead of "the service broke".
 */
async function computeRoutes(origin, destination, travelMode = "walking") {
  const modeMap = {
    walking: "WALK",
    driving: "DRIVE",
    bicycling: "BICYCLE",
    transit: "TRANSIT",
  };

  const body = {
    origin: {
      location: {
        latLng: { latitude: origin.latitude, longitude: origin.longitude },
      },
    },
    destination: {
      location: {
        latLng: { latitude: destination.latitude, longitude: destination.longitude },
      },
    },
    travelMode: modeMap[travelMode] || "WALK",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: "en",
    regionCode: "ng",
    units: "METRIC",
  };

  const payload = await googleRequest(ROUTES_URL, {
    method: "POST",
    body,
    fieldMask:
      "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.endLocation",
  });

  const routes = Array.isArray(payload?.routes) ? payload.routes : [];
  if (routes.length === 0) {
    return { routes: [], status: "ZERO_RESULTS" };
  }

  const route = routes[0];
  const leg = route?.legs?.[0];
  if (!leg) {
    return { routes: [], status: "ZERO_RESULTS" };
  }

  const steps = (leg.steps || []).map((step) => ({
    htmlInstructions: step?.navigationInstruction?.instructions || "",
    distance: { text: `${step?.distanceMeters ?? 0} m`, value: step?.distanceMeters ?? 0 },
    duration: { text: step?.staticDuration || "", value: parseDuration(step?.staticDuration) },
    startLocation: step?.startLocation?.latLng
      ? {
          lat: step.startLocation.latLng.latitude,
          lng: step.startLocation.latLng.longitude,
        }
      : { lat: origin.latitude, lng: origin.longitude },
    endLocation: step?.endLocation?.latLng
      ? {
          lat: step.endLocation.latLng.latitude,
          lng: step.endLocation.latLng.longitude,
        }
      : { lat: destination.latitude, lng: destination.longitude },
    travelMode,
  }));

  return {
    routes: [
      {
        legs: [
          {
            distance: { text: `${leg.distanceMeters ?? 0} m`, value: leg.distanceMeters ?? 0 },
            duration: { text: leg.duration || "", value: parseDuration(leg.duration) },
            startAddress: "",
            endAddress: "",
            steps,
          },
        ],
        overviewPolyline: { points: route?.polyline?.encodedPolyline || "" },
      },
    ],
    status: "OK",
  };
}

/**
 * Reverse geocodes a coordinate into an address.
 *
 * All of Google's candidate results are returned, normalised, so the app can
 * pick the most granular community the same way it always has. A coordinate
 * with no address returns an empty list — a success, not an error.
 */
async function reverseGeocode(latitude, longitude) {
  const url =
    `${GEOCODE_URL}?latlng=${latitude},${longitude}` +
    `&language=en&region=ng&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

  let response;
  try {
    response = await fetch(url, { method: "GET", timeout: UPSTREAM_TIMEOUT_MS });
  } catch (error) {
    const timedOut = error?.type === "request-timeout" || error?.name === "AbortError";
    if (timedOut) {
      throw new GoogleApiError(
        GOOGLE_ERROR_REASONS.TIMEOUT,
        `Google did not respond within ${UPSTREAM_TIMEOUT_MS}ms.`,
      );
    }
    throw new GoogleApiError(
      GOOGLE_ERROR_REASONS.NETWORK_ERROR,
      "Could not reach Google Maps Platform.",
      { upstreamMessage: redactKey(error?.message) },
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const status = payload?.status || (response.ok ? "OK" : "UNKNOWN_ERROR");

  if (status !== "OK") {
    if (status === "ZERO_RESULTS") {
      return { results: [] };
    }
    const reason = classifyLegacyGeocodeStatus(status, payload?.error_message);
    throw new GoogleApiError(reason, `Google Geocoding responded with ${status}.`, {
      status: response.status,
      upstreamMessage: redactKey(payload?.error_message || ""),
    });
  }

  const results = (Array.isArray(payload?.results) ? payload.results : []).map((result) => ({
    formattedAddress: result?.formatted_address || "",
    addressComponents: flattenAddressComponents(result?.address_components),
    latitude: typeof result?.geometry?.location?.lat === "number" ? result.geometry.location.lat : null,
    longitude: typeof result?.geometry?.location?.lng === "number" ? result.geometry.location.lng : null,
  }));

  return { results };
}

module.exports = {
  GOOGLE_ERROR_REASONS,
  GoogleApiError,
  isClientFault,
  computeRoutes,
  fetchPlaceDetails,
  fetchPlacePredictions,
  parseDuration,
  reverseGeocode,
};
