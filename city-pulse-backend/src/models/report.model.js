const mongoose = require("mongoose");

/**
 * A report is the only customer-originating input to the trust score.
 *
 * Reports are confidential to the provider: the reporter's identity is retained
 * here for anti-abuse and moderation, but it is never projected into any
 * client-facing response (see REPORT_PUBLIC_FIELDS in the controller). User-facing
 * copy must therefore say "confidential", never "anonymous" — the identity is
 * kept.
 *
 * The reason enum and its severity mapping are the single source of truth for
 * F8. They live here rather than in the client so a report's severity can never
 * be set by the caller.
 */
const REPORT_REASONS = [
  "not_available",
  "price_mismatch",
  "unsafe_or_dishonest",
  "closed",
  "other",
];

const REASON_SEVERITY = {
  not_available: "low",
  price_mismatch: "low",
  closed: "low",
  unsafe_or_dishonest: "high",
  other: "low",
};

const reportSchema = new mongoose.Schema(
  {
    pulse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pulse",
      required: [true, "A report must target a listing"],
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A report must have a reporter"],
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: [true, "A report must have a reason"],
    },
    // Derived from `reason` on the server. Never accepted from the client.
    severity: {
      type: String,
      enum: ["low", "high"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [280, "A report note can be at most 280 characters"],
      default: "",
    },
    // UTC calendar day (YYYY-MM-DD) the report was filed on, stamped server-side
    // from the same instant as createdAt. PRD F8 allows one report per customer
    // per listing per day; storing the day as its own field lets that be a
    // unique index (see below) instead of a read-then-write check that two
    // concurrent submissions could both pass.
    //
    // Not a TTL index. A TTL would delete the report after 24h, discarding
    // exactly the records moderation needs to see. The rate limit bounds how
    // fast someone can report; it must not decide how long evidence survives.
    reportDay: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
  },
  { timestamps: true },
);

// PRD F8: one report per customer per listing per day. Enforced in the database
// rather than in a check-then-write, so two simultaneous submissions cannot
// both observe "no report today" and both insert.
reportSchema.index({ pulse: 1, reporter: 1, reportDay: 1 }, { unique: true });

// The trust recalculation reads a provider's recent reports by agent, newest
// first, inside a 7-day window.
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
module.exports.REASON_SEVERITY = REASON_SEVERITY;
