const Analytics = require("../models/analytics.model");
const asyncHandler = require("../utils/asyncHandler");

function getClientMeta(req) {
  return {
    ip: req.ip || req.headers["x-forwarded-for"] || "",
    userAgent: req.headers["user-agent"] || "",
  };
}

/**
 * POST /api/v1/analytics/track
 * Body: { kind: "pageview" | "event", path?, event?, meta?, sessionId? }
 * Access: Public (rate-limited by the route definition)
 */
exports.track = asyncHandler(async (req, res) => {
  const { kind, path, event, meta, sessionId } = req.body;

  if (!kind || !["pageview", "event"].includes(kind)) {
    return res.status(400).json({
      success: false,
      message: "kind must be 'pageview' or 'event'",
    });
  }

  const client = getClientMeta(req);
  await Analytics.create({
    kind,
    path: path || "",
    event: event || "",
    meta: meta || null,
    sessionId: sessionId || "",
    ip: client.ip,
    userAgent: client.userAgent,
  });

  res.status(201).json({ success: true });
});