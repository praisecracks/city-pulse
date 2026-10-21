# Mobile data architecture — local vs cloud

The rule the whole app now follows: **the cloud is the source of truth, the
device is a cache, and the UI must never be blocked by either.**

This document exists because the failure mode it prevents is not subtle but it
is total: an unreachable backend used to leave the app unusable rather than
merely degraded.

---

## The bug that motivated this

`/auth/me` was fetched with a bare `fetch`, which in React Native has **no
default timeout**. Two things depended on it:

1. `isSessionReady` gated the launch redirect.
2. The splash was dismissed on an independent 1200 ms timer.

With the backend down, the request never settled, so the redirect never ran,
while the splash hid on schedule anyway. A signed-in provider got: splash →
whatever route the app cold-started on (often `/terms`) → no dashboard until
they tapped a tab themselves.

Two rules came out of it, and both are now enforced:

- **No request is unbounded.** Everything goes through `src/utils/api-client.ts`,
  which attaches an `AbortController` to every call.
- **No screen may show a raw transport failure.** Offline is a state with its
  own UI, not an error string.

---

## The three layers

| Layer | Holds | Lifetime |
|---|---|---|
| Server | Truth: accounts, listings, reports, notifications | — |
| AsyncStorage | Durable cache: account, listing, favourites, alerts, onboarding flags | Across launches |
| Memory | Warm copy, read synchronously during render | Session |

Reads resolve best-source-first, and the resolution happens **during render**
rather than being copied into state by an effect. That is what lets a warm cache
paint in the first frame instead of a frame later, and it is why the cache
modules expose a synchronous accessor (`getCachedListingSync`,
`getCachedNotificationsSync`) alongside the async loader.

Pattern, following `listing-cache`:

```
loadCachedX()      // hydrate memory from disk, once
getCachedXSync()   // read memory during render
saveCachedX()      // write both, best effort
```

---

## Writes

Optimistic, then reconciled:

1. Apply the change in memory and to disk **immediately** — the UI must feel instant.
2. Send it to the server.
3. On failure, decide per action:
   - **Roll back** (favourites). A heart that lies about saved state is worse than a delay.
   - **Queue** (notification read-state). Rolling back would make the unread dot reappear over something the user deliberately dismissed, then vanish minutes later. The queued write is replayed before the next fetch.

Both live in the same file and are individually commented, because the difference
is a product judgement, not a technical one.

---

## Offline is a first-class state

`apiRequest` throws `ApiError` with `isOffline`. A transport failure (DNS,
refused, dead host) is *offline*; a 5xx is *a server problem*. They need
different copy and different recovery:

| Situation | UI |
|---|---|
| Offline **with** cached content | Content, plus a quiet "showing your saved alerts" banner |
| Offline **without** cache | "You are offline", plus pull-to-retry |
| Server error | "Could not load…", plus a retry button |

A 5xx is deliberately **not** reported as offline — telling someone they are
offline when the server is down sends them to troubleshoot their own wifi.

---

## Routing is offline-capable

Routing derives from the **cached** account, which is on disk, so it works with
no network at all. The server reconciliation is a background correction, not a
gate:

- **Launch redirect** — fires as soon as hydration completes, from cached roles.
- **Corrective redirect** — fires once, after the server confirms, and only if
  the account's home actually changed. This covers a provider who published on
  another device.

The splash is dismissed when the routing decision has been **applied**, not on a
timer. A timer races the redirect and produces exactly the flash this replaced.

Two guards worth keeping:

- A user sitting on a registration step is never redirected away from it.
- The corrective redirect only runs while the user is on a tab screen, so it
  cannot yank someone off a page mid-session.

---

## Account scoping

Anything cached is keyed by user id and cleared on sign-out. A report
notification is sensitive — it tells one provider that a specific person
complained about them — so leaving it on disk would expose that to the next
person to use the device.

---

## Adding a new cached service

1. Transport through `apiRequest`. Do not hand-roll `fetch` + `AbortController`.
2. Mirror `notification-cache.ts` for the cache module.
3. Resolve server → disk → memory **during render**, not in an effect.
4. Decide the offline failure behaviour: roll back, or queue.
5. Scope the cache to the user id and clear it on sign-out.
