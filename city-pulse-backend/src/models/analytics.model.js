const mongoose = require("mongoose");

/**
 * Lightweight event store for the public marketing site.
 *
 * Two kinds of record:
 *   - pageview: someone loaded a route on apps/web
 *   - event:   an interaction (form start, form submit, button click)
 *
 * Deliberately minimal. No PII is stored — the frontend sends no user data,
 * only an event name, optional metadata, and a session id so the same person
 * starting two forms counts as two starts rather than one.
 */
const analyticsSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["pageview", "event"],
      required: true,
      index: true,
    },
    path: {
      type: String,
      trim: true,
      index: true,
    },
    event: {
      type: String,
      trim: true,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    sessionId: {
      type: String,
      trim: true,
      index: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// TTL: keep 90 days of events, then drop them automatically.
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Analytics", analyticsSchema);