const Pulse = require("../models/pulse.model");
const User = require("../models/user.model");
const Report = require("../models/report.model");
const { notifyTrustChanged } = require("./notificationService");

/**
 * Trust score constants.
 *
 * Trust starts at 3.0, is read-only (never set by the provider, no customer
 * rating input), and only ever drops. The 1.0 floor is reachable: with only the
 * first three thresholds the worst possible score would be 1.5, which would make
 * MIN_TRUST unreachable and therefore meaningless.
 *
 * Thresholds are per-severity counts inside a 7-day window, each worth -0.5 and
 * additive. They are deliberately slow, because a report is cheap to file and
 * the rate limit is per-day rather than per-lifetime: one report must never be
 * able to destroy a provider.
 *
 * Full rules, rationale and the superseded PRD 13.3 model: docs/trust-and-reporting.md
 */
const STARTING_TRUST = 3;
const MIN_TRUST = 1;

const LOW_SEVERITY_DROP_THRESHOLD = 3;
const LOW_SEVERITY_HEAVY_THRESHOLD = 10;
const HIGH_SEVERITY_DROP_THRESHOLD = 1;
const HIGH_SEVERITY_HEAVY_THRESHOLD = 3;
const HIGH_SEVERITY_CRITICAL_THRESHOLD = 6;

const STEP = 0.5;

const TRUST_WINDOW_DAYS = 7;

/**
 * Reports filed against a provider's listing inside the scoring window.
 *
 * Looked up through the listing rather than by a denormalised agent field on
 * Report, so a report is always attributed through the listing it was filed
 * against and cannot drift if ownership ever changes.
 */
async function countRecentReports(agentId, since) {
  const listingIds = await Pulse.find({ agent: agentId }).distinct("_id");
  if (listingIds.length === 0) {
    return { low: 0, high: 0 };
  }

  const reports = await Report.find({
    pulse: { $in: listingIds },
    createdAt: { $gte: since },
  }).select("severity");

  return {
    low: reports.filter((report) => report.severity === "low").length,
    high: reports.filter((report) => report.severity === "high").length,
  };
}

/**
 * Derive a score from a report count. Pure, so it is testable and so the
 * clamping rule lives in exactly one place.
 */
function scoreFromReportCounts(low, high) {
  let score = STARTING_TRUST;

  if (low >= LOW_SEVERITY_DROP_THRESHOLD) {
    score -= STEP;
  }

  if (low >= LOW_SEVERITY_HEAVY_THRESHOLD) {
    score -= STEP;
  }

  if (high >= HIGH_SEVERITY_DROP_THRESHOLD) {
    score -= STEP;
  }

  if (high >= HIGH_SEVERITY_HEAVY_THRESHOLD) {
    score -= STEP;
  }

  if (high >= HIGH_SEVERITY_CRITICAL_THRESHOLD) {
    score -= STEP;
  }

  // Rounded to one decimal so a score never displays as 2.4999999 from
  // repeated float subtraction.
  return Math.max(MIN_TRUST, Math.round(score * 10) / 10);
}

async function calculateTrustScore(agentId) {
  const since = new Date(Date.now() - TRUST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const { low, high } = await countRecentReports(agentId, since);
  return scoreFromReportCounts(low, high);
}

/**
 * Recompute and persist trust for the provider who owns `pulse`.
 *
 * Returns the score that is now stored on the listing.
 *
 * Two invariants this function exists to hold:
 *
 * 1. The score is written to the PULSE, not only to the user. Every
 *    customer-facing surface reads listing.trustScore, so a User-only write
 *    leaves the number customers see frozen. User.trustScore is a mirror; the
 *    Pulse is the source of truth.
 *
 * 2. The write is MONOTONIC — a recomputation only ever lowers the score.
 *    Otherwise an unrelated write (a status toggle, an edit) would recompute
 *    from a report window that has since emptied and silently restore the
 *    provider to 3.0, which is the recovery path the drop-only rule exists to
 *    prevent.
 */
async function recalculateTrustForPulse(pulse) {
  const computed = await calculateTrustScore(pulse.agent);
  const current = typeof pulse.trustScore === "number" ? pulse.trustScore : STARTING_TRUST;
  const score = Math.min(current, computed);

  if (pulse.trustScore !== score) {
    pulse.trustScore = score;
    await pulse.save();
  }

  if (current !== score) {
    await User.findByIdAndUpdate(pulse.agent, { trustScore: score });

    // Tell the provider their trust moved. This is the only signal that reaches
    // them about a report they never see directly, and it is deduped on the new
    // value so a recomputation that lands on the same score is silent.
    await notifyTrustChanged({ pulse, from: current, to: score });
  }

  return score;
}

module.exports = {
  calculateTrustScore,
  recalculateTrustForPulse,
  scoreFromReportCounts,
  STARTING_TRUST,
  MIN_TRUST,
  TRUST_WINDOW_DAYS,
};
