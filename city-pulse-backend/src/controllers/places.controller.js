const asyncHandler = require("../utils/asyncHandler");
const {
  GOOGLE_ERROR_REASONS,
  GoogleApiError,
  computeRoutes,
  fetchPlaceDetails,
  fetchPlacePredictions,
  reverseGeocode,
} = require("../services/googleMapsService");

/**
 * Google Maps Platform proxy endpoints.
 *
 * These are deliberately narrow: each one maps to exactly one Google call with
 * a fixed set of parameters. The client cannot choose the upstream URL, the
 * method, or the field mask, so there is no way to use this endpoint as an
 * open proxy against the server's Google key.
 *
 * Access policy: public but rate limited. The onboarding flow asks for a
 * location before the user has an account, so requiring a token would break a
 * legitimate path through the app. A signed-in caller is identified by
 * `optionalAuth` and gets their own rate-limit bucket.
 */

const TRAVEL_MODES = ["walking", "driving", "bicycling", "transit"];

/** Place IDs are opaque Google identifiers. Keep the accepted shape narrow. */
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
const REGION_CODE_PATTERN = /^[A-Za-z]{2}$/;

/** Bounds Google's address search stays inside. */
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 200;

/**
 * How each upstream failure is reported to the client.
 *
 * `code` is a stable machine token the app branches on. `message` is written
 * for a person and deliberately says nothing about keys, projects, quotas or
 * internal URLs — the diagnostic detail stays in the server log.
 */
const ERROR_RESPONSES = {
  [GOOGLE_ERROR_REASONS.KEY_RESTRICTED]: {
    status: 503,
    code: "LOCATION_SERVICE_MISCONFIGURED",
    message: "Location search is temporarily unavailable. Please try again shortly.",
  },
  [GOOGLE_ERROR_REASONS.SERVICE_DISABLED]: {
    status: 503,
    code: "LOCATION_SERVICE_MISCONFIGURED",
    message: "Location search is temporarily unavailable. Please try again shortly.",
  },
  [GOOGLE_ERROR_REASONS.BILLING_DISABLED]: {
    status: 503,
    code: "LOCATION_SERVICE_MISCONFIGURED",
    message: "Location search is temporarily unavailable. Please try again shortly.",
  },
  [GOOGLE_ERROR_REASONS.NOT_CONFIGURED]: {
    status: 503,
    code: "LOCATION_SERVICE_MISCONFIGURED",
    message: "Location search is temporarily unavailable. Please try again shortly.",
  },
  [GOOGLE_ERROR_REASONS.QUOTA_EXCEEDED]: {
    status: 429,
    code: "LOCATION_QUOTA_EXCEEDED",
    message: "Location search is busy right now. Please try again in a moment.",
  },
  [GOOGLE_ERROR_REASONS.TIMEOUT]: {
    status: 504,
    code: "LOCATION_SERVICE_TIMEOUT",
    message: "Location search took too long to respond. Please try again.",
  },
  [GOOGLE_ERROR_REASONS.NETWORK_ERROR]: {
    status: 502,
    code: "LOCATION_SERVICE_UNAVAILABLE",
    message: "Location search is temporarily unavailable. Please try again.",
  },
  [GOOGLE_ERROR_REASONS.UPSTREAM_ERROR]: {
    status: 502,
    code: "LOCATION_SERVICE_UNAVAILABLE",
    message: "Location search is temporarily unavailable. Please try again.",
  },
  [GOOGLE_ERROR_REASONS.INVALID_REQUEST]: {
    status: 400,
    code: "INVALID_REQUEST",
    message: "That search could not be understood. Please check the address and try again.",
  },
  [GOOGLE_ERROR_REASONS.NOT_FOUND]: {
    status: 404,
    code: "PLACE_NOT_FOUND",
    message: "That place could not be found.",
  },
  [GOOGLE_ERROR_REASONS.UNKNOWN]: {
    status: 502,
    code: "LOCATION_SERVICE_UNAVAILABLE",
    message: "Location search is temporarily unavailable. Please try again.",
  },
};

const FALLBACK_ERROR = {
  status: 502,
  code: "LOCATION_SERVICE_UNAVAILABLE",
  message: "Location search is temporarily unavailable. Please try again.",
};

/**
 * Translates a Google failure into a client response.
 *
 * The upstream explanation is logged in full (with the key redacted) and is
 * never included in the response body.
 */
function respondWithGoogleError(res, error) {
  const mapped = ERROR_RESPONSES[error.reason] || FALLBACK_ERROR;

  console.error(
    `[places] upstream failure reason=${error.reason} status=${error.status ?? "n/a"} detail=${error.upstreamMessage || error.message}`
  );

  return res.status(mapped.status).json({
    success: false,
    code: mapped.code,
    message: mapped.message,
  });
}

/** Reads a finite number from a query value, or returns null. */
function parseCoordinate(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function isValidLatitude(value) {
  return value !== null && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return value !== null && value >= -180 && value <= 180;
}

/**
 * @desc    Search for place suggestions
 * @route   GET /api/v1/places/autocomplete?input=&regionCode=
 * @access  Public (rate limited)
 *
 * Response: { success: true, data: { predictions: [{ placeId, description,
 * structuredFormatting: { mainText, secondaryText } }] } }
 *
 * An empty `predictions` array means Google found no match. It is a success,
 * not an error.
 */
exports.autocompletePlaces = asyncHandler(async (req, res) => {
  const input = typeof req.query.input === "string" ? req.query.input.trim() : "";

  if (input.length < MIN_SEARCH_LENGTH) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: `Search text must be at least ${MIN_SEARCH_LENGTH} characters.`,
    });
  }

  if (input.length > MAX_SEARCH_LENGTH) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: `Search text must be ${MAX_SEARCH_LENGTH} characters or fewer.`,
    });
  }

  const regionCode = typeof req.query.regionCode === "string" ? req.query.regionCode.trim() : "";
  if (regionCode && !REGION_CODE_PATTERN.test(regionCode)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "regionCode must be a two-letter country code.",
    });
  }

  try {
    const predictions = await fetchPlacePredictions(input, { regionCode: regionCode || undefined });
    res.status(200).json({ success: true, data: { predictions } });
  } catch (error) {
    if (error instanceof GoogleApiError) {
      return respondWithGoogleError(res, error);
    }
    throw error;
  }
});

/**
 * @desc    Resolve a place to its coordinates and address
 * @route   GET /api/v1/places/detail?placeId=
 * @access  Public (rate limited)
 *
 * Response: { success: true, data: { placeId, formattedAddress, latitude,
 * longitude, addressComponents, name } }
 *
 * `latitude` and `longitude` are null when Google has no location for the
 * place. They are never replaced with a substitute coordinate.
 */
exports.getPlaceDetails = asyncHandler(async (req, res) => {
  const placeId = typeof req.query.placeId === "string" ? req.query.placeId.trim() : "";

  if (!placeId) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "A placeId is required.",
    });
  }

  if (!PLACE_ID_PATTERN.test(placeId)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "That place identifier is not valid.",
    });
  }

  try {
    const place = await fetchPlaceDetails(placeId);
    res.status(200).json({ success: true, data: place });
  } catch (error) {
    if (error instanceof GoogleApiError) {
      return respondWithGoogleError(res, error);
    }
    throw error;
  }
});

/**
 * @desc    Directions between two coordinates
 * @route   GET /api/v1/places/directions?originLat=&originLng=&destinationLat=&destinationLng=&mode=
 * @access  Public (rate limited)
 *
 * Response: { success: true, data: { routes: [...], status } }
 *
 * `routes` is empty when no road route exists between the two points. That is
 * a successful answer, distinct from an upstream failure.
 */
exports.getDirections = asyncHandler(async (req, res) => {
  const originLat = parseCoordinate(req.query.originLat);
  const originLng = parseCoordinate(req.query.originLng);
  const destinationLat = parseCoordinate(req.query.destinationLat);
  const destinationLng = parseCoordinate(req.query.destinationLng);

  if (!isValidLatitude(originLat) || !isValidLongitude(originLng)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "A valid origin latitude and longitude are required.",
    });
  }

  if (!isValidLatitude(destinationLat) || !isValidLongitude(destinationLng)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "A valid destination latitude and longitude are required.",
    });
  }

  const mode = typeof req.query.mode === "string" ? req.query.mode.trim() : "walking";
  if (!TRAVEL_MODES.includes(mode)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: `mode must be one of: ${TRAVEL_MODES.join(", ")}.`,
    });
  }

  try {
    const directions = await computeRoutes(
      { latitude: originLat, longitude: originLng },
      { latitude: destinationLat, longitude: destinationLng },
      mode
    );
    res.status(200).json({ success: true, data: directions });
  } catch (error) {
    if (error instanceof GoogleApiError) {
      return respondWithGoogleError(res, error);
    }
    throw error;
  }
});

/**
 * @desc    Reverse geocode a coordinate into an address
 * @route   GET /api/v1/places/reverse?lat=&lng=
 * @access  Public (rate limited)
 *
 * Response: { success: true, data: { results: [{ formattedAddress,
 * addressComponents, latitude, longitude }] } }
 *
 * `results` is empty when Google has no address for the coordinate.
 */
exports.reverseGeocodeAddress = asyncHandler(async (req, res) => {
  const latitude = parseCoordinate(req.query.lat);
  const longitude = parseCoordinate(req.query.lng);

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "A valid latitude and longitude are required.",
    });
  }

  try {
    const result = await reverseGeocode(latitude, longitude);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof GoogleApiError) {
      return respondWithGoogleError(res, error);
    }
    throw error;
  }
});
