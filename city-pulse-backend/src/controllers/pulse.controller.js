const Pulse = require("../models/pulse.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const { recalculateTrustForPulse, STARTING_TRUST } = require("../services/trustScoreService");
const { notifyStatusUpdated } = require("../services/notificationService");

/**
 * ObjectIds of providers who have set their business profile to private.
 *
 * Visibility lives on the User rather than the Pulse because it describes the
 * account, and a provider only ever has one listing. Read once per request and
 * passed into the queries that must honour it.
 */
async function getPrivateAgentIds() {
  return User.find({ businessProfileVisibility: "private" }).distinct("_id");
}

// @desc    Get all pulses
// @route   GET /api/v1/pulses
exports.getPulses = asyncHandler(async (req, res) => {
  // A provider who has hidden their listing is removed from the public feed
  // entirely, not greyed out: hiding means customers must not be able to find
  // them. The listing itself is untouched, so un-hiding is instant.
  const privateAgentIds = await getPrivateAgentIds();
  const query = privateAgentIds.length ? { agent: { $nin: privateAgentIds } } : {};

  const pulses = await Pulse.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: pulses.length, data: pulses });
});

const CREATE_FIELDS = [
  "title",
  "description",
  "location",
  "category",
  "contactPhone",
  "email",
  "whatsapp",
  "address",
  "details",
  "images",
];

/**
 * Fields a provider may set once, at publish, and never change afterwards.
 *
 * These are the listing's identity and the place that identity belongs to:
 *
 *   - `title` — the business name. It is the provider's reputation label and the
 *     thing customers report against by name, so changing it lets a badly
 *     reported provider shed the reputation under a new name.
 *   - `location` / `address` / coordinates — where the service actually is.
 *     Trust is earned from the neighbours who actually used the provider, so a
 *     moved listing carrying its old score would apply a Surulere reputation to
 *     a Yaba business and make the score meaningless. It also blocks the
 *     obvious abuse of registering once per neighbourhood to farm fresh trust.
 *
 * Everything else stays editable, including the contact numbers: a provider
 * changing their phone is normal, and the one-listing-per-account rule plus the
 * trust floor bound the damage a determined provider could do.
 *
 * Enforced here rather than only in the app, because a client-side lock is only
 * a suggestion — `PUT /pulses/:id` is a public authenticated route, and a
 * request built by hand would otherwise change any of these.
 */
const IMMUTABLE_AFTER_PUBLISH = ["title", "location", "address", "category"];

const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => !IMMUTABLE_AFTER_PUBLISH.includes(field));

const LOCKED_FIELD_LABELS = {
  title: "business name",
  location: "area / neighborhood",
  address: "street address",
  category: "category",
};

const ALLOWED_CATEGORIES = ["pos", "food", "gas", "house"];

const MAX_IMAGES = 4;
const MAX_CAPTION_LENGTH = 120;

// Read straight off the schema so the valid set for the status endpoint can
// never drift from the enum the model will actually enforce.
const PULSE_STATUSES = Pulse.schema.path("status").enumValues;

const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;

// Photos are only trusted if they were produced by POST /api/v1/uploads/images,
// so only this API's own upload path is accepted. Anything else (a remote URL a
// client made up, a data: URI, a path traversal attempt) is rejected rather
// than stored. Absolute URLs are reduced to their path so a listing keeps
// working if the API later moves to another host or behind a CDN.
const UPLOAD_PATH_PATTERN = /^\/uploads\/[A-Za-z0-9._-]+$/;

function normalizeImagePath(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (UPLOAD_PATH_PATTERN.test(trimmed)) return trimmed;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return UPLOAD_PATH_PATTERN.test(parsed.pathname) ? parsed.pathname : null;
}

function validateImages(images) {
  if (images === undefined) {
    return { images: undefined };
  }

  if (!Array.isArray(images)) {
    return { error: "Photos must be sent as an array" };
  }

  if (images.length > MAX_IMAGES) {
    return { error: `A listing can have at most ${MAX_IMAGES} photos` };
  }

  const cleaned = [];
  for (const image of images) {
    if (!image || typeof image !== "object") {
      return { error: "Every photo needs a path" };
    }

    const path = normalizeImagePath(image.path ?? image.url);
    if (!path) {
      return { error: "Photo paths must reference an uploaded image" };
    }

    cleaned.push({
      path,
      caption: typeof image.caption === "string" ? image.caption.trim().slice(0, MAX_CAPTION_LENGTH) : "",
      isCover: Boolean(image.isCover),
    });
  }

  // Exactly one cover: honour the client's choice, otherwise default to the
  // first photo so cards always have something to render.
  if (cleaned.length > 0) {
    const requestedCover = cleaned.findIndex((image) => image.isCover);
    const coverIndex = requestedCover === -1 ? 0 : requestedCover;
    cleaned.forEach((image, index) => {
      image.isCover = index === coverIndex;
    });
  }

  return { images: cleaned };
}

function validateCoordinates(latitude, longitude) {
  if (latitude === undefined && longitude === undefined) {
    return null;
  }
  if (latitude === undefined || longitude === undefined) {
    return "Both latitude and longitude must be provided together";
  }
  if (latitude === null || longitude === null) {
    return "Both latitude and longitude must be provided together";
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "Latitude and longitude must be valid numbers";
  }
  if (lat < MIN_LAT || lat > MAX_LAT) {
    return "Latitude must be between -90 and 90";
  }
  if (lng < MIN_LNG || lng > MAX_LNG) {
    return "Longitude must be between -180 and 180";
  }
  return null;
}

function validateDetails(category, details) {
  if (!ALLOWED_CATEGORIES.includes(category) || !details || typeof details !== "object") {
    return "A valid category and category-specific details are required";
  }
  if (category === "pos" && (!details.feePer5000 || !Array.isArray(details.acceptedCardBrands))) {
    return "POS listings require withdrawal fees and accepted card brands";
  }
  if (category === "food" && (!Array.isArray(details.menuItems) || details.menuItems.length === 0)) {
    return "Food listings require at least one menu item";
  }
  if (category === "gas" && !details.pricePerKg) {
    return "Gas listings require a price per KG";
  }
  if (category === "house" && (!Array.isArray(details.propertyTypes) || !Array.isArray(details.coveredAreas))) {
    return "House listings require property types and covered areas";
  }
  return null;
}

// @desc    Get the signed-in provider's own listing(s)
// @route   GET /api/v1/pulses/mine
// @access  Private
exports.getMyPulses = asyncHandler(async (req, res) => {
  const pulses = await Pulse.find({ agent: req.user._id }).sort({ createdAt: -1 });

  // Deliberately an array even though the schema now allows only one listing
  // per provider. If a legacy duplicate survives a dedupe, or the one-listing
  // rule is ever relaxed, the client shape does not have to change.
  res.status(200).json({ success: true, count: pulses.length, data: pulses });
});

// @desc    Get single pulse
// @route   GET /api/v1/pulses/:id
exports.getPulseById = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);

  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }

  res.status(200).json({ success: true, data: pulse });
});

// @desc    Create a pulse
// @route   POST /api/v1/pulses
exports.createPulse = asyncHandler(async (req, res) => {
  const body = {};
  for (const field of CREATE_FIELDS) {
    if (req.body[field]) body[field] = req.body[field];
  }

  const detailsError = validateDetails(body.category, body.details);
  if (detailsError) {
    return res.status(400).json({ success: false, message: detailsError });
  }

  if (req.body.images !== undefined) {
    const { images, error } = validateImages(req.body.images);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    body.images = images;
  }

  if (Number.isFinite(Number(req.body.latitude)) || Number.isFinite(Number(req.body.longitude))) {
    const coordError = validateCoordinates(req.body.latitude, req.body.longitude);
    if (coordError) {
      return res.status(400).json({ success: false, message: coordError });
    }
    body.coordinates = {
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      accuracy: req.body.accuracy ? Number(req.body.accuracy) : undefined,
      source: req.body.source || "manual",
    };
  }

  body.agent = req.user._id;
  body.status = "Unconfirmed";
  // Every provider starts at exactly 3.0 (trustScoreService.STARTING_TRUST).
  // It is never higher and never lower at publish time; only reports move it,
  // and only downwards.
  body.trustScore = STARTING_TRUST;
  body.lastUpdated = new Date();

  let pulse;
  try {
    pulse = await Pulse.create(body);
  } catch (err) {
    // The unique index on `agent` is the last line of defence against a
    // provider publishing twice, which is reachable whenever the app dies
    // between this call succeeding and the client recording the response.
    if (err && err.code === 11000) {
      // `roles` is included because this response is also where the client
      // learns its registration is already complete. Without it the app keeps
      // treating a finished provider as an in-progress applicant.
      return res.status(409).json({
        success: false,
        message: "You already have a published listing. Open your dashboard to update it.",
        roles: req.user.roles,
        code: "LISTING_ALREADY_EXISTS",
      });
    }
    throw err;
  }

  // Publishing a listing is what makes someone a provider, so this is the one
  // place the "agent" role is granted. Until now they are only a customer with
  // agentIntent set, which is what keeps a half-finished registration from
  // being treated as a live provider account.
  if (!req.user.roles.includes("agent")) {
    req.user.roles.push("agent");
    await req.user.save();
  }

  // No trust recalculation here: a brand new listing has no reports, so the
  // score is already STARTING_TRUST.

  // roles is returned because the client's cached copy predates this grant, and
  // the token's own roles claim was signed at login.
  res.status(201).json({ success: true, data: pulse, roles: req.user.roles });
});

// @desc    Update a pulse
// @route   PUT /api/v1/pulses/:id
exports.updatePulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);
  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  if (String(pulse.agent) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "You can only edit your own listings" });
  }

  // Locked fields are rejected rather than silently ignored. Silently dropping
  // them would let the app keep sending them on every save, so the write would
  // appear to succeed while the provider watched their edit do nothing. Naming
  // the field turns a confusing no-op into a legible error.
  const attempted = IMMUTABLE_AFTER_PUBLISH.filter((field) => req.body[field] !== undefined);
  if (attempted.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Your ${attempted.map((f) => LOCKED_FIELD_LABELS[f]).join(", ")} cannot be changed after publishing.`,
      code: "LISTING_FIELDS_IMMUTABLE",
      fields: attempted,
    });
  }

  // Coordinates are the listing's location just as much as the area and address
  // are, so they are locked on the same terms.
  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    return res.status(400).json({
      success: false,
      message: "Your listing location cannot be changed after publishing.",
      code: "LISTING_FIELDS_IMMUTABLE",
      fields: ["latitude", "longitude"],
    });
  }

  const body = {};
  for (const field of UPDATE_FIELDS) {
    if (req.body[field] !== undefined) body[field] = req.body[field];
  }

  if (body.details) {
    const detailsError = validateDetails(pulse.category, body.details);
    if (detailsError) {
      return res.status(400).json({ success: false, message: detailsError });
    }
  }

  if (req.body.images !== undefined) {
    const { images, error } = validateImages(req.body.images);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }
    body.images = images;
  }

  body.lastUpdated = new Date();

  Object.assign(pulse, body);
  await pulse.save();

  // Trust does not depend on any editable field, so this is normally a no-op.
  // Run anyway: the write is cheap and it keeps the User.trustScore mirror in
  // step if a report landed concurrently.
  await recalculateTrustForPulse(pulse);

  res.status(200).json({ success: true, data: pulse });
});

// @desc    Update a pulse's availability status
// @route   PATCH /api/v1/pulses/:id/status
// @access  Private (owner only)
//
// Separate from PUT /pulses/:id because toggling "Available" is the most
// frequent write a provider makes. Keeping it on its own route keeps the generic
// write surface small, and makes a status change an explicit action rather than
// a field riding along with an unrelated edit.
exports.updatePulseStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!PULSE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${PULSE_STATUSES.join(", ")}`,
    });
  }

  const pulse = await Pulse.findById(req.params.id);
  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  if (String(pulse.agent) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "You can only update your own listings" });
  }

  // Captured before the write so a real transition can be distinguished from a
  // provider re-confirming the status they already had. Re-saving "Available"
  // must not generate a notification; the dashboard already shows that state.
  const previousStatus = pulse.status;

  pulse.status = status;
  // A status change is a claim about right now, so it counts as a freshness
  // signal and must refresh the countdown the public listing advertises.
  pulse.lastUpdated = new Date();
  await pulse.save();

  if (previousStatus !== status) {
    await notifyStatusUpdated({ pulse, from: previousStatus, to: status });
  }

  res.status(200).json({ success: true, data: pulse });
});

// @desc    Delete a pulse
// @route   DELETE /api/v1/pulses/:id
exports.deletePulse = asyncHandler(async (req, res) => {
  const pulse = await Pulse.findById(req.params.id);

  if (!pulse) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  if (String(pulse.agent) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "You can only delete your own listings" });
  }

  await pulse.deleteOne();

  // No trust recalculation: the listing is gone and there is nothing left for a
  // score to attach to.

  res.status(200).json({ success: true, data: {} });
});
