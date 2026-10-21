# Trust Score & Reporting — Backend Rules

Single source of truth for how trust is computed and how reports feed it. The
mobile app never computes a trust score; it only displays what the API returns.

This document supersedes the update-frequency model previously described in
PRD §13.3. That section's "score goes up when the agent updates status
frequently" is **no longer implemented** and the PRD should be amended to match.

---

## Trust score

### Rules

| Rule | Value |
|---|---|
| Starting score | `3.0` for every provider |
| Range | `1.0` – `5.0` |
| Direction | **Downward only.** There is no recovery path. |
| Who can change it | Nobody directly. Not the provider, not a customer. |
| What moves it | Reports filed by other users. |
| Source of truth | `Pulse.trustScore` — this is what every customer-facing surface reads. |

`User.trustScore` is maintained as a mirror for convenience. It is not
authoritative; changing only the User copy leaves the customer-visible number
frozen, which is the bug this model replaced.

### Why drop-only

The score exists to carry the one signal a customer cannot obtain any other way:
a neighbour's direct experience of this provider. Two consequences follow.

1. **A provider's own behaviour is not evidence of honesty.** Updating status
   often says only that someone is diligent about tapping a button. So update
   frequency is deliberately *not* an input.
2. **No recovery path removes the incentive to game the metric.** If a score
   could climb back, a provider could farm favourable signals to offset real
   complaints. Because it cannot, a report is permanent — which is also why the
   thresholds below are deliberately slow to trigger.

### Formula

Computed over a rolling **7-day window** of reports against the provider's
listing(s). Each threshold that is met subtracts `0.5`:

| Condition | Reports in 7 days | Change |
|---|---|---|
| Low severity | ≥ 3 | −0.5 |
| Low severity | ≥ 10 | −0.5 |
| High severity | ≥ 1 | −0.5 |
| High severity | ≥ 3 | −0.5 |
| High severity | ≥ 6 | −0.5 |

Conditions are independent and additive. The result is clamped to a minimum of
`1.0` and rounded to one decimal place.

Worked examples:

| low | high | score |
|---|---|---|
| 0 | 0 | 3.0 |
| 2 | 0 | 3.0 |
| 3 | 0 | 2.5 |
| 0 | 1 | 2.5 |
| 0 | 3 | 2.0 |
| 0 | 6 | 1.5 |
| 3 | 3 | 1.5 |
| 10 | 6 | 1.0 |
| 99 | 99 | 1.0 |

**Why so slow.** Reports are cheap to file and rate-limited per day, not per
lifetime. A threshold that reacted to a single report would let anyone destroy a
provider's reputation with one tap. Reaching the floor takes six high-severity
reports in a week, or four additive steps' worth of evidence.

The write is also **monotonic**: a recalculation only ever lowers the stored
value. Without this, an unrelated write (a status toggle, an edit) would
recompute from a window that has since emptied and silently restore the
provider to 3.0 — reintroducing the recovery path.

### Severity

Severity is derived from the report reason **on the server** and is never read
from the request body. A client cannot declare its own report high-severity.

| Reason | Severity |
|---|---|
| `not_available` | low |
| `price_mismatch` | low |
| `closed` | low |
| `other` | low |
| `unsafe_or_dishonest` | **high** |

---

## Reports

### Model — `src/models/report.model.js`

| Field | Notes |
|---|---|
| `pulse` | Listing reported against. Required. |
| `reporter` | Account that filed it. Required. |
| `reason` | Enum, see above. Required. |
| `severity` | Server-derived. Required. |
| `note` | Free text, max 280 chars. Optional. |
| `reportDay` | `YYYY-MM-DD` UTC, stamped server-side. Required. |

### Endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/pulses/:id/reports` | Private | File a report |
| `GET` | `/api/v1/pulses/:id/reports` | Private (owner) | Own report history |

### Rules enforced server-side

1. **Authentication required.** A report is tied to an identity for anti-abuse
   (PRD F8). A visitor is routed to sign-in and returned to the same listing.
2. **No self-report.** `403` when `pulse.agent === req.user._id`. A provider
   cannot file a report against their own business.
3. **One report per customer per listing per day.** Enforced by a unique index
   on `{ pulse, reporter, reportDay }` rather than a check-then-write, so two
   simultaneous submissions cannot both pass a read and both insert.
4. **Reporter identity is never exposed.** `GET .../reports` projects only
   `_id, reason, severity, note, createdAt`. An owner sees *that* reports exist
   and what was said, never who said it (PRD F8, PRD 15 QA).

### What is deliberately not enforced

- **No role gate on reporting.** An account may hold both `customer` and `agent`
  roles (PRD §6.3), so an agent browsing someone else's listing is a customer
  there and may report it. Only self-report is blocked.
- **No TTL on reports.** A rate limit must not decide how long moderation
  evidence survives; the record is retained.

---

## Migration note

Existing listings were created with `trustScore: 3` and a trust service that
could raise the score to 4. If any listing is currently above 3.0, it should be
normalised to 3.0 on deploy, since a score above 3.0 can no longer be produced
by the current formula and no longer means anything:

```js
db.pulses.updateMany({ trustScore: { $gt: 3 } }, { $set: { trustScore: 3 } });
db.users.updateMany({ trustScore: { $gt: 3 } }, { $set: { trustScore: 3 } });
```

The seed listings in the mobile app's `src/data/product.ts` were carrying
hardcoded scores of 3.8–4.9. These are demo data, not computed values, and the
backend can never produce a score above 3.0 — so they have been normalised to
3.0. A listing's score now only ever looks different once real reports exist.
