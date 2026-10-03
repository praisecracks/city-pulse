const mongoose = require("mongoose");

/**
 * Notification types.
 *
 * Kept as a closed enum so a screen can switch exhaustively on type and fail
 * loudly if a new one is added without UI, rather than rendering an unknown
 * notification as a blank row.
 */
const NOTIFICATION_TYPES = [
  "report_filed", // A customer reported your listing
  "trust_changed", // Your trust score moved
  "listing_lapsed", // Your status is about to lapse to Unconfirmed
  "listing_lapsed_final", // Your status has lapsed
  "status_updated", // Your listing changed availability
  "profile_milestone", // N customers viewed your listing
  "account_status", // Account locked / disabled / restored
  "system", // Anything else the team needs to surface
];

/**
 * One notification for one user.
 *
 * `dedupeKey` is what keeps a repeating event from becoming spam. The freshness
 * rule, for example, would otherwise fire every 3 hours forever; keyed as
 * `listing_lapsed:<pulseId>:<utcDay>`, the provider gets at most one per day,
 * and a genuinely new lapse the next day still gets through.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    // Screen to open when tapped, plus any params. Stored as a path rather than
    // a component so the backend never has to know the client's route names.
    action: {
      type: String,
      trim: true,
      default: "",
    },
    // Type-specific context (report id, pulse id, counts). Never contains
    // anything the recipient should not see.
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Null means "not yet loaded for this user"; a Date means read at that time.
    readAt: {
      type: Date,
      default: null,
    },
    dedupeKey: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

// The feed is read newest-first, scoped to one user.
notificationSchema.index({ user: 1, createdAt: -1 });

// Unread badge count is queried on nearly every app open.
notificationSchema.index({ user: 1, readAt: 1 });

// At most one notification per dedupeKey per user, ever. This is what makes a
// recurring event safe to emit: re-running the generator is idempotent.
notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
