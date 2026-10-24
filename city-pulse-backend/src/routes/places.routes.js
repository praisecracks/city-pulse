const express = require("express");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const optionalAuth = require("../middlewares/optionalAuth");
const {
  autocompletePlaces,
  getDirections,
  getPlaceDetails,
  reverseGeocodeAddress,
} = require("../controllers/places.controller");

const router = express.Router();

/**
 * Google Maps Platform proxy routes.
 *
 * Access policy
 * -------------
 * These endpoints are public, because the onboarding flow asks the user to set
 * a location before they have an account. Requiring a token there would break
 * a legitimate path through the app. `optionalAuth` identifies a signed-in
 * caller when a token happens to be present, purely so they get their own
 * rate-limit bucket instead of sharing one with everyone behind the same IP.
 *
 * Rate limiting
 * -------------
 * Every limit is per caller. The autocomplete limit is the generous one
 * because the app searches as the user types, debounced, and a single
 * sentence of typing is a dozen requests.
 */

/**
 * Keys a signed-in caller by their user id and everyone else by IP.
 *
 * `ipKeyGenerator` is used rather than a bare `req.ip` because express-rate-limit
 * requires IPv6 addresses to be grouped into a subnet, otherwise a single
 * client can rotate through its address space to bypass the limit.
 */
function callerKey(req, res) {
  if (req.userId) return `u:${req.userId}`;
  return `ip:${ipKeyGenerator(req.ip)}`;
}

/** One shared limiter configuration, with the per-endpoint budget applied below. */
function limitFor(windowMinutes, max) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: callerKey,
    message: {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many location requests. Please wait a moment and try again.",
    },
  });
}

const autocompleteLimiter = limitFor(1, 120);
const detailLimiter = limitFor(1, 90);
const directionsLimiter = limitFor(1, 60);
const reverseGeocodeLimiter = limitFor(1, 120);

// @desc    Search for place suggestions
// @route   GET /api/v1/places/autocomplete?input=&regionCode=
// @access  Public (rate limited)
router.get("/autocomplete", optionalAuth, autocompleteLimiter, autocompletePlaces);

// @desc    Resolve a place to its coordinates and address
// @route   GET /api/v1/places/detail?placeId=
// @access  Public (rate limited)
router.get("/detail", optionalAuth, detailLimiter, getPlaceDetails);

// @desc    Directions between two coordinates
// @route   GET /api/v1/places/directions?originLat=&originLng=&destinationLat=&destinationLng=&mode=
// @access  Public (rate limited)
router.get("/directions", optionalAuth, directionsLimiter, getDirections);

// @desc    Reverse geocode a coordinate into an address
// @route   GET /api/v1/places/reverse?lat=&lng=
// @access  Public (rate limited)
router.get("/reverse", optionalAuth, reverseGeocodeLimiter, reverseGeocodeAddress);

module.exports = router;
