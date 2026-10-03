const Notification = require("../models/notification.model");

/**
 * Creates a notification unless an identical one already exists.
 *
 * Every function in this file is safe to call repeatedly. Events that fire on a
 * schedule (the freshness lapse) or that several code paths can trigger (trust
 * moving as a side effect of a report) all pass a `dedupeKey`, backed by a
 * unique index. The second attempt is a no-op rather than a duplicate.
 *
 * Returns null when it was suppressed, so callers can tell the difference
 * between "created" and "already had this one".
 */
async function notify({ user, type, title, body = "", action = "", data = {}, dedupeKey = "" }) {
  try {
    return await Notification.create({
      user,
      type,
      title,
      body,
      action,
      data,
      dedupeKey,
    });
  } catch (err) {
    // 11000 is the unique-index violation from dedupeKey. Anything else is a
    // real failure and should surface rather than being silently swallowed.
    if (err && err.code === 11000) {
      return null;
    }
    throw err;
  }
}

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Fired when a report lands against a provider's listing.
 *
 * The reporter is deliberately not referenced anywhere in the payload. PRD F8
 * requires the reporter's identity to never reach the reported agent on any
 * client-facing surface, and the copy says "confidential" rather than
 * "anonymous" because the identity IS retained on the server.
 */
async function notifyReportFiled({ pulse, report }) {
  return notify({
    user: pulse.agent,
    type: "report_filed",
    title: "A customer reported your listing",
    body:
      report.note && report.note.trim()
        ? `They wrote: "${report.note.trim()}"`
        : "Open it to see what they reported.",
    // The dashboard, not a dedicated reports screen: no such route exists yet,
    // and an action pointing at a missing route dead-ends on tap. The note
    // above already carries what the provider needs to act on.
    action: "/agent-dashboard",
    data: {
      pulseId: String(pulse._id),
      reportId: String(report._id),
      reason: report.reason,
      severity: report.severity,
    },
    // Keyed on the report id, so a retried send cannot double-notify.
    dedupeKey: `report_filed:${report._id}`,
  });
}

/**
 * Fired when a provider's trust score actually moves.
 *
 * Skipped entirely when `from` and `to` are equal, which happens constantly
 * because the trust service is recomputed on every listing write. Only a real
 * change is worth telling anyone about.
 */
async function notifyTrustChanged({ pulse, from, to }) {
  if (typeof from !== "number" || typeof to !== "number" || from === to) {
    return null;
  }

  // Trust only ever falls, so this is always a drop.
  return notify({
    user: pulse.agent,
    type: "trust_changed",
    title: `Your trust score changed to ${to.toFixed(1)}`,
    body:
      to < from
        ? `It fell from ${from.toFixed(1)} because of reports from customers. Trust only ever goes down, and it is not editable.`
        : `It is now ${to.toFixed(1)}.`,
    action: "/agent-dashboard",
    data: { pulseId: String(pulse._id), from, to },
    // Keyed on the new value so a second drop to the same score is still
    // delivered, while recomputing the same score is not.
    dedupeKey: `trust_changed:${pulse._id}:${to}`,
  });
}

/**
 * Warned once per day that a listing is about to lapse.
 *
 * This is the one notification that would otherwise be pure noise: the 3-hour
 * rule means a dormant provider lapses eight times a day. Dedupe to one per
 * pulse per day, and only when they're actually going stale — an agent who
 * keeps updating never sees this at all.
 */
async function notifyListingLapsing({ pulse, minutesRemaining }) {
  const when = minutesRemaining <= 30 ? "soon" : `in ${Math.round(minutesRemaining)} minutes`;

  return notify({
    user: pulse.agent,
    type: "listing_lapsed",
    title: "Your status will lapse soon",
    body: `Your "${pulse.title}" status expires ${when} and will show as Unconfirmed, which lowers you in search results.`,
    action: "/agent-dashboard",
    data: { pulseId: String(pulse._id), minutesRemaining },
    dedupeKey: `listing_lapsing:${pulse._id}:${utcDay()}`,
  });
}

/**
 * Confirms a listing has actually lapsed. Keyed per pulse per day for the same
 * reason — a provider who never updates would otherwise collect one of these
 * every 3 hours indefinitely.
 */
async function notifyListingLapsed({ pulse }) {
  return notify({
    user: pulse.agent,
    type: "listing_lapsed_final",
    title: "Your listing is now Unconfirmed",
    body: `"${pulse.title}" has shown no update for 3 hours, so customers see it as Unconfirmed. Update your status to get ranked again.`,
    action: "/agent-dashboard",
    data: { pulseId: String(pulse._id) },
    dedupeKey: `listing_lapsed:${pulse._id}:${utcDay()}`,
  });
}

/**
 * Fired at 10 / 50 / 100 cumulative profile views.
 *
 * Milestones rather than every view: "you were viewed 11 times" is not
 * actionable, but "10 people looked at you today" is the only real evidence a
 * provider has that their listing is being found. Requires view tracking, which
 * is the one dependency this notification type has.
 */
const MILESTONES = [10, 50, 100];

async function notifyProfileMilestone({ pulse, count }) {
  if (!MILESTONES.includes(count)) {
    return null;
  }

  return notify({
    user: pulse.agent,
    type: "profile_milestone",
    title: `${count} people have viewed your listing`,
    body: `Your listing "${pulse.title}" has been viewed ${count} times. Keep your status current to convert those views into customers.`,
    action: "/agent-dashboard",
    data: { pulseId: String(pulse._id), count },
    dedupeKey: `profile_milestone:${pulse._id}:${count}`,
  });
}

/**
 * Fired when a provider actually changes their listing's status.
 *
 * Note the "actually": this only fires on a real transition, not on every tap
 * that re-saves the same status. A provider confirming "Available" is the most
 * likely action in the app, and notifying on every press would fill the feed
 * with something the dashboard already shows on screen.
 *
 * Dedupe is per pulse + status + day, so flipping back and forth is bounded to
 * one notification per status per day even in the worst case.
 */
async function notifyStatusUpdated({ pulse, from, to }) {
  return notify({
    user: pulse.agent,
    type: "status_updated",
    title: `Your listing is now ${to}`,
    // Deliberately does not claim this improved their ranking. A change to
    // "Unavailable" is a downgrade, and copy that only congratulates the
    // provider would be wrong half the time. The real consequence — the 3-hour
    // freshness clock restarting — is the part worth restating.
    body: `"${pulse.title}" changed from ${from} to ${to}. Your 3-hour freshness clock has restarted.`,
    action: "/agent-dashboard",
    data: { pulseId: String(pulse._id), from, to },
    dedupeKey: `status_updated:${pulse._id}:${to}:${utcDay()}`,
  });
}

/**
 * Account-level events (locked, disabled, restored). Always one-off — never
 * deduped, because each is a discrete action by the team.
 */
async function notifyAccountStatus({ user, title, body }) {
  return notify({
    user,
    type: "account_status",
    title,
    body,
    action: "/profile",
  });
}

module.exports = {
  notify,
  notifyReportFiled,
  notifyTrustChanged,
  notifyListingLapsing,
  notifyListingLapsed,
  notifyStatusUpdated,
  notifyProfileMilestone,
  notifyAccountStatus,
  utcDay,
};
