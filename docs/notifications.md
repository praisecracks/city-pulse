# Notifications — Backend Rules

The Activity tab was removed and replaced by a single **Notifications** feed
(`/agent-notifications`, tab label "Alerts"). It is the only place the app
surfaces alerts and events to a provider.

There is deliberately **no activity log**. Anything a provider did themselves is
visible on the listing or the dashboard; a feed of "you edited your listing"
tells them nothing they cannot already see.

---

## What is NOT a notification

Two of these were proposed and are not implemented, deliberately:

| Proposed | Why not |
|---|---|
| "Refresh your trust score" | Trust is server-computed from reports and is drop-only by design. There is no refresh action for the provider to take. They are *notified* when it changes, which is the only meaningful signal. |
| "Refresh the 3-hour freshness rule" | Same shape. The provider cannot extend their status. What they get instead is a warning *before* it lapses, and confirmation once it has. |

---

## Types

`Notification.type` is a closed enum in `src/models/notification.model.js`.

| Type | Raised when | Trigger |
|---|---|---|
| `report_filed` | A customer reports one of the provider's listings | `report.controller.js` |
| `trust_changed` | The score actually moves | `trustScoreService.js` |
| `listing_lapsed` | Status is about to lapse | `freshnessService.js` |
| `listing_lapsed_final` | Status has lapsed | `freshnessService.js` |
| `status_updated` | The provider changes their own status | `pulse.controller.js` |
| `profile_milestone` | Views hit 10 / 50 / 100 | Needs view tracking |
| `account_status` | Account locked / disabled / restored | Needs a staff action surface |
| `system` | Anything else | Escape hatch |

`profile_milestone` and `account_status` are defined but have no emitter yet, so
they will never appear until view tracking and a staff action surface exist.
Everything else is live and verified by `scripts/audit-notification-triggers.js`.

---

## The lapse warning window

The freshness rule is 3 hours. "About to lapse" opens a window at the start of
it:

| Constant | Value |
|---|---|
| `FRESHNESS_WINDOW_MS` | 3 hours |
| `LAPSE_WARNING_MS` | 30 minutes |

**Why 30 minutes:** it is the scheduler's own resolution. The rule runs every 30
minutes, so a wider window is still only sampled at 30-minute granularity and
buys nothing, while a narrower one could fall entirely between two ticks and
never be delivered. The window must never be shorter than the interval.

The warning pass is bounded below by `lapseCutoff`, so a listing that has
already lapsed is never warned about something that is no longer avoidable.
Boundary behaviour is pinned by `scripts/verify-lapse-window.js`, which asserts
each side of both thresholds — these cases are invisible in normal use and only
show up as warnings that never arrive.

---

## `status_updated` is deliberately quiet

This is the trigger most at risk of being noise: confirming a status is the most
likely action in the app, and the dashboard already displays the result. Two
guards keep it from flooding the feed:

1. It fires **only on a real transition**. Re-saving the status you already have
   changes `lastUpdated` but emits nothing.
2. `dedupeKey` is `status_updated:<pulse>:<status>:<utcDay>`, so flipping back
   and forth is bounded to one per status per day.

The copy does not claim the change improved the provider's ranking — a change to
`Unavailable` is a downgrade, and copy that only congratulates would be wrong
half the time. It restates the one real consequence: the 3-hour clock restarted.

If this still proves noisy in use, deleting the `notifyStatusUpdated` call in
`pulse.controller.js` removes it without touching anything else.

---

## Spam control is the load-bearing part

A notification system that fires reliably but noisily gets muted, and a muted
feed is worse than no feed. Two mechanisms:

**1. `dedupeKey`, backed by a unique index on `{ user, dedupeKey }`.**

Every emitter supplies one. Re-running an emitter is idempotent: the second
attempt hits a `11000` and `notificationService.notify` returns `null` rather
than duplicating. Callers can tell "created" from "already had this one".

**2. Cadence-limited emitters, because some events recur by nature.**

| Emitter | Key | Effect |
|---|---|---|
| `notifyListingLapsing` | `listing_lapsing:<pulse>:<utcDay>` | At most 1/day, not 8 |
| `notifyListingLapsed` | `listing_lapsed:<pulse>:<utcDay>` | At most 1/day |
| `notifyStatusUpdated` | `status_updated:<pulse>:<status>:<utcDay>` | 1 per status per day |
| `notifyReportFiled` | `report_filed:<reportId>` | Naturally 1:1 |
| `notifyTrustChanged` | `trust_changed:<pulse>:<to>` | 1 per distinct new score |
| `notifyProfileMilestone` | `profile_milestone:<pulse>:<count>` | 1 per milestone |

`notifyTrustChanged` keys on the **new value**, not on "changed". Trust is
recomputed on every listing write, so keying on the change itself would emit
constantly; keying on the new value means a recomputation landing on the same
score is silent, while a genuine second drop to a previously-seen score still
gets through.

Milestones are thresholds (10/50/100), not totals. "You were viewed 11 times"
is not actionable; "10 people looked at you today" is the only real evidence a
provider has that they are being found.

---

## The scheduler

`freshnessService.applyFreshnessRule` is what raises both lapse types, and it is
scheduled in `server.js`. Two properties matter:

- **Chained, not `setInterval`.** The run makes several queries and fans out
  notifications, so a run that outlasted the interval would have the next one
  queued behind it and several lapses landing together. The timer re-arms in a
  `finally`, so exactly one sweep is ever in flight and a failure does not kill
  the timer.
- **The status write stays a single bulk `updateMany`.** Notifications need
  per-listing rows, so the affected documents are read first — but the write is
  still one query, and only the notification fan-out scales with the number of
  stale listings.

**Test gotcha, not an app bug:** the rule writes through a bulk update that
bypasses any Mongoose document, so a reused in-memory copy silently disagrees
with the database. Because Mongoose only persists *modified* paths, re-assigning
a field the stale document already holds is a no-op and leaves the old value in
the database. Always reload before asserting on state the rule changed.

---

## Reporter anonymity

`notifyReportFiled` never references the reporter in any field. The body says
"confidential", **not** "anonymous" — the identity is retained on the server
per PRD F8 and must never reach the reported agent on any client-facing surface.

The note is passed through, because the provider has to be able to fix the
listing. It is truncated to 280 characters server-side.

---

## API

All routes are `auth`-required and scoped to `req.user._id`, so an id belonging
to another account is a `404`, not a silent success.

| Route | Purpose |
|---|---|
| `GET /api/v1/notifications` | Feed, newest first, + `unreadCount` |
| `GET /api/v1/notifications/unread-count` | Badge only, no documents |
| `PATCH /api/v1/notifications/:id/read` | Mark one read |
| `POST /api/v1/notifications/read-all` | Mark all read |

> `notification.routes.js` is mounted at `/api/v1/notifications` by
> `routes/index.js`, so the paths inside it are **relative** (`/`, `/unread-count`,
> `/:id/read`, `/read-all`). Repeating the prefix puts the real endpoints at
> `/api/v1/notifications/notifications` and leaves the client 404ing — which is
> exactly what happened, and is covered by `scripts/verify-notifications.js`.

`readAt` is `null` when unread, a `Date` when read. Re-opening an already-read
notification preserves the original timestamp.

`action` is a client route. It must point at a screen that exists — an action
aimed at a missing route dead-ends on tap, so notifications currently target
`/agent-dashboard` rather than a reports screen that has not been built.

---

## Offline behaviour

The feed is cached per user id in AsyncStorage and resolved during render
(server → disk → memory), so the tab paints from cache and reconciles in the
background. See `docs/mobile-data-architecture.md`.

- Offline with cache → content plus a "showing your saved alerts" banner.
- Offline without cache → "You are offline", pull to retry.
- Reads marked while offline are queued and replayed **before** the next fetch,
  so a notification dismissed on a train does not reappear as unread.


---

## Adding a type

1. Add to `NOTIFICATION_TYPES` in the model.
2. Add an emitter in `notificationService.js` **with a `dedupeKey`**.
3. Add to `NOTIFICATION_TYPES` and `TYPE_STYLES` in `src/utils/notification-api.ts`
   and `agent-notifications.tsx`.
4. Decide the cadence. If the trigger can fire more than once a day for the same
   underlying fact, the key needs a day or value component.

An unknown type from a newer backend degrades to `system` rather than being
dropped, so a deploy cannot silently hide a message from a user.

---

## Verification

Three scripts, all runnable against a live server with a seeded database:

| Script | Proves |
|---|---|
| `scripts/audit-notification-triggers.js` | Each of the five triggers actually fires, and that re-confirming a status stays silent |
| `scripts/verify-lapse-window.js` | The warning window behaves on both sides of each threshold |
| `scripts/verify-notifications.js` | The full HTTP surface, plus that the reporter's identity never reaches the reported agent |
| `scripts/preview-notification-copy.js` | Prints the exact copy a provider sees, for review without the app |

Prefer asserting on behaviour over reading the code: an emitter being *called*
is a different claim from a notification actually being *created*, and a wrong
green is worse than a red.
