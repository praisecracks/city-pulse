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

## API

Base URL: `/api/v1`. Every endpoint below `auth` requires
`Authorization: Bearer <token>`.

### Auth — `/auth`

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/send-otp`         | Request a login OTP            |
| POST   | `/verify-otp`       | Verify OTP, returns a JWT      |
| GET    | `/me`               | Current user                   |
| DELETE | `/delete-account`   | Delete the account             |
| PATCH  | `/me/visibility`    | Public / private business profile |
| GET    | `/me/favorites`     | Saved listings, fully resolved |
| POST   | `/me/favorites`     | Save a listing                 |
| DELETE | `/me/favorites/:id` | Unsave a listing               |

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
