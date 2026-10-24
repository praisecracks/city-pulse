# City Pulse — Backend

Node.js + Express + MongoDB API for City Pulse, a live local visibility platform.

A **Pulse** is a live business listing (a Pulse is the *information* about a
business, not the business or the location itself). Providers publish and update
their listing; customers browse it. Listings go `Unconfirmed` automatically 3
hours after their last update, so a stale listing never reads as live.

## Structure

```text
city-pulse-backend/
├── src/
│   ├── config/          # db, jwt, uploads
│   ├── controllers/     # Route handler logic
│   ├── middlewares/     # auth, requireRole, upload, errorHandler, notFound
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # Business logic: trust score, freshness, notifications
│   ├── utils/           # asyncHandler
│   ├── app.js           # Express app setup (middleware + routes)
│   └── server.js        # Entry point — connects DB, starts server
├── scripts/             # Manual verification scripts (see below)
├── .env.example
└── package.json
```

`app.js` builds the Express app and `server.js` starts it. Keeping them apart is
what lets the verification scripts mount the real app on an ephemeral port.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env example and fill in your own values:
   ```bash
   cp .env.example .env
   ```
3. Run in development (auto-restarts on file changes):
   ```bash
   npm run dev
   ```

`JWT_SECRET` is required when `NODE_ENV=production` — the server refuses to boot
without it rather than falling back to a known secret.

Password reset emails require `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM`; set
`SMTP_USER` and `SMTP_PASS` together when your provider requires authentication.
Use `SMTP_SECURE=true` for implicit TLS (usually port 465), or `false` for
STARTTLS (usually port 587). `PASSWORD_RESET_URL` defaults to
`citypulse://reset-password`, which opens the mobile app when installed. Set it
to an HTTPS universal/app link if one is configured for your deployment. Reset
links expire after 15 minutes and are stored as hashes.

## API

Base URL: `/api/v1`. Every endpoint below `auth` requires
`Authorization: Bearer <token>`.

### Auth — `/auth`

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/send-otp`         | Request a login OTP            |
| POST   | `/verify-otp`       | Verify OTP, returns a JWT      |
| POST   | `/forgot-password`  | Email a one-time password reset link |
| POST   | `/reset-password`   | Set a password using the reset token |
| GET    | `/me`               | Current user                   |
| DELETE | `/delete-account`   | Delete the account             |
| PATCH  | `/me/visibility`    | Public / private business profile |
| GET    | `/me/favorites`     | Saved listings, fully resolved |
| POST   | `/me/favorites`     | Save a listing                 |
| DELETE | `/me/favorites/:id` | Unsave a listing               |

Admin listing moderation endpoints live under `/api/v1/admin-pulse` and require
an admin bearer token: `GET /listings` returns paginated pending submissions,
and `PATCH /listings/:id/review` accepts `{ "reviewStatus": "approved" }` or
`{ "reviewStatus": "rejected", "note": "..." }`. Rejection notes are required
and shown to providers so they can update and resubmit their listing.

### Pulses — `/pulses`

| Method | Endpoint        | Description                       |
|--------|-----------------|-----------------------------------|
| GET    | `/`             | Public feed (hides private profiles) |
| GET    | `/mine`         | Signed-in provider's own listing  |
| GET    | `/:id`          | Single listing                    |
| POST   | `/`             | Publish a listing (grants `agent`) |
| PUT    | `/:id`          | Edit a listing                    |
| PATCH  | `/:id/status`   | One-tap availability update       |
| DELETE | `/:id`          | Delete a listing                  |
| POST   | `/:id/reports`  | File a report (customer)          |
| GET    | `/:id/reports`  | Reports on a listing (owner only) |

### Uploads — `/uploads`

| Method | Endpoint   | Description                     |
|--------|------------|---------------------------------|
| POST   | `/images`  | Upload up to 4 listing photos   |

Photos are uploaded before the listing is created, and the returned URLs are
referenced from `POST /pulses`. Bytes are sniffed before the file is accepted —
the declared `Content-Type` is not trusted.

### Notifications — `/notifications`

| Method | Endpoint        | Description                |
|--------|-----------------|----------------------------|
| GET    | `/`             | List notifications         |
| GET    | `/unread-count` | Unread badge count         |
| PATCH  | `/:id/read`     | Mark one read              |
| POST   | `/read-all`     | Mark all read              |

### Places — `/places`

Proxies the Google Maps Platform web services. The app cannot call them
itself: the Google key it ships with is restricted to Android applications,
and Google rejects web-service calls that carry no Android application
identity with `API_KEY_ANDROID_APP_BLOCKED`. The backend holds a separate
server-side key (`GOOGLE_MAPS_API_KEY`) so the key that can spend Google
quota never ships in the client bundle.

| Method | Endpoint        | Description                                        |
|--------|-----------------|----------------------------------------------------|
| GET    | `/autocomplete` | Place suggestions for a search string               |
| GET    | `/detail`       | Resolve a place to its coordinates and address      |
| GET    | `/directions`   | Road directions between two coordinates             |
| GET    | `/reverse`      | Reverse geocode a coordinate into an address        |

**Access:** public but rate limited. The onboarding flow asks for a location
before the user has an account, so requiring a token would break a legitimate
path through the app. A signed-in caller is identified by the `optionalAuth`
middleware and gets their own rate-limit bucket.

**Query parameters**

| Endpoint        | Parameters                                                       |
|-----------------|------------------------------------------------------------------|
| `/autocomplete` | `input` (required, 2–200 chars), `regionCode` (optional, 2 chars) |
| `/detail`       | `placeId` (required)                                             |
| `/directions`   | `originLat`, `originLng`, `destinationLat`, `destinationLng` (required), `mode` (`walking` \| `driving` \| `bicycling` \| `transit`) |
| `/reverse`      | `lat`, `lng` (required)                                          |

**Response shapes**

```jsonc
// GET /places/autocomplete
{ "success": true, "data": { "predictions": [
  { "placeId": "ChIJ…", "description": "Ibara, Abeokuta, Nigeria",
    "structuredFormatting": { "mainText": "Ibara", "secondaryText": "Abeokuta, Nigeria" } }
] } }

// GET /places/detail
{ "success": true, "data": {
  "placeId": "ChIJ…", "formattedAddress": "Ibara, Abeokuta, …",
  "latitude": 7.1975, "longitude": 3.4363,
  "addressComponents": { "sublocality": "Ibara", "locality": "Abeokuta" },
  "name": "Ibara" } }

// GET /places/directions
{ "success": true, "data": { "status": "OK", "routes": [ { "legs": [ … ], "overviewPolyline": { "points": "…" } } ] } }

// GET /places/reverse
{ "success": true, "data": { "results": [
  { "formattedAddress": "…", "addressComponents": { … }, "latitude": 7.1975, "longitude": 3.4363 }
] } }
```

`latitude` and `longitude` are `null` when Google has no location for a place.
They are never replaced with a substitute coordinate.

**Errors.** A failed lookup is always reported as a failure, never as an empty
result set. An empty `predictions`/`results` array means Google looked and had
no match; a `routes` array that is empty means no road route exists.

```jsonc
{ "success": false, "code": "LOCATION_SERVICE_MISCONFIGURED", "message": "Location search is temporarily unavailable. Please try again shortly." }
```

| `code`                          | HTTP | Meaning                                        |
|---------------------------------|------|------------------------------------------------|
| `INVALID_REQUEST`               | 400  | The request was malformed                      |
| `PLACE_NOT_FOUND`               | 404  | The place does not exist                       |
| `LOCATION_QUOTA_EXCEEDED`       | 429  | Google quota exhausted — retry shortly         |
| `LOCATION_SERVICE_UNAVAILABLE`  | 502  | Google could not be reached                    |
| `LOCATION_SERVICE_TIMEOUT`      | 504  | Google did not respond in time                 |
| `LOCATION_SERVICE_MISCONFIGURED`| 503  | The server-side key is not set up correctly    |

The `code` is stable and safe for a client to branch on. The `message` is
written for a person. Google's own error text is logged on the server with
the key redacted, and is never sent to the client.


## Roles

A new account is a `customer`. Publishing a listing is what grants `agent` — so
the role always means "has a real listing", not "tapped a button". An account can
hold both. Role gates read the live user document rather than the JWT payload,
because the grant happens long after the token was signed.

## Background work

`server.js` runs the freshness rule every 30 minutes, chained rather than on a
`setInterval` so two runs can never overlap. It warns a provider 30 minutes
before a listing lapses, then sets it to `Unconfirmed`.

## Verification scripts

`scripts/` holds manual end-to-end checks. They are not part of the test suite
and are not run in CI:

```bash
npm run verify                  # smoke test the pulse API
node scripts/verify-notifications.js
node scripts/verify-lapse-window.js
```

These create and delete throwaway rows. Point `MONGO_URI` at a scratch database,
never production. `scripts/cleanup-audit-data.js` removes leftovers from the
audit scripts.

## Further reading

Product rules that the code implements but does not define live in `docs/` at the
repository root:

- `docs/trust-and-reporting.md` — trust score formula and reporting rules
- `docs/notifications.md` — when notifications fire and what they say
- `docs/mobile-data-architecture.md` — how the mobile app consumes this API
