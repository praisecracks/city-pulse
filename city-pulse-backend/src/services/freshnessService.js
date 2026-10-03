const Pulse = require("../models/pulse.model");
const { notifyListingLapsing, notifyListingLapsed } = require("./notificationService");

const FRESHNESS_WINDOW_MS = 3 * 60 * 60 * 1000;

/**
 * How long before expiry a provider is warned.
 *
 * Equal to the scheduler's own interval: the rule only runs every 30 minutes,
 * so a wider warning window would still be sampled at 30-minute granularity and
 * buy nothing, while a narrower one could fall between two ticks entirely.
 */
const LAPSE_WARNING_MS = 30 * 60 * 1000;

/**
 * Applies the 3-hour freshness rule and tells affected providers.
 *
 * Two passes, because "about to lapse" and "has lapsed" are different events
 * with different urgency, and collapsing them into one means either warning
 * someone about something that already happened, or staying silent about
 * something still preventable.
 *
 * The status write stays a single bulk `updateMany` even though the
 * notifications need per-listing rows. The documents are read first, the write
 * is still one query, and only the notification fan-out is per-listing — so the
 * query count does not scale with the number of stale listings.
 */
async function applyFreshnessRule() {
  const now = Date.now();
  const lapseCutoff = new Date(now - FRESHNESS_WINDOW_MS);
  const warnCutoff = new Date(now - (FRESHNESS_WINDOW_MS - LAPSE_WARNING_MS));

  // --- Pass 1: warn, while the provider can still prevent the lapse ----------
  // Bounded below by `lapseCutoff` so a listing already past its window is not
  // warned about something that is no longer avoidable.
  const expiring = await Pulse.find({
    lastUpdated: { $lt: warnCutoff, $gte: lapseCutoff },
    status: { $ne: "Unconfirmed" },
  }).select("title agent lastUpdated");

  for (const pulse of expiring) {
    const minutesRemaining = Math.max(
      0,
      Math.round(
        (FRESHNESS_WINDOW_MS - (now - pulse.lastUpdated.getTime())) / (60 * 1000),
      ),
    );
    await notifyListingLapsing({ pulse, minutesRemaining });
  }

  // --- Pass 2: lapse, for anything past the window -------------------------
  const lapsing = await Pulse.find({
    lastUpdated: { $lt: lapseCutoff },
    status: { $ne: "Unconfirmed" },
  }).select("title agent");

  if (lapsing.length > 0) {
    await Pulse.updateMany(
      { _id: { $in: lapsing.map((p) => p._id) } },
      { $set: { status: "Unconfirmed" } },
    );

    for (const pulse of lapsing) {
      // The in-memory document still carries the pre-lapse status, which is what
      // the message needs to describe the transition.
      await notifyListingLapsed({ pulse });
    }

    console.log(`Freshness rule: ${lapsing.length} listing(s) set to Unconfirmed`);
  }

  return {
    warned: expiring.length,
    lapsed: lapsing.length,
  };
}

module.exports = {
  applyFreshnessRule,
  FRESHNESS_WINDOW_MS,
  LAPSE_WARNING_MS,
};
