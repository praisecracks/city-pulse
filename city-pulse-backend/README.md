# City Pulse — Backend

Node.js + Express API for City Pulse, a live local visibility platform.

## Structure

```text
city-pulse-backend/
├── src/
│   ├── config/          # DB connection, env-based config
│   ├── controllers/     # Route handler logic
│   ├── middlewares/     # Error handling, 404s, auth (later)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # Shared helpers (e.g. asyncHandler)
│   ├── app.js           # Express app setup (middleware + routes)
│   └── server.js        # Entry point — connects DB, starts server
├── .env.example
├── .gitignore
└── package.json
```

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
4. Or run normally:
   ```bash
   npm start
   ```

## API

Base URL: `/api/v1`

| Method | Endpoint          | Description       |
|--------|-------------------|--------------------|
| GET    | `/pulses`         | List all pulses    |
| GET    | `/pulses/:id`     | Get a single pulse |
| POST   | `/pulses`         | Create a pulse     |
| PUT    | `/pulses/:id`     | Update a pulse     |
| DELETE | `/pulses/:id`     | Delete a pulse     |

`Pulse` is a starter/example resource — rename or extend it once the real
data model for City Pulse is defined (e.g. venues, events, local updates).
