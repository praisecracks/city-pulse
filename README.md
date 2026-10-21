# City Pulse

City Pulse is a live local visibility platform designed to help people discover what is active, available, and trustworthy near them right now.

The project is starting with a focused pilot in Abeokuta South and is designed to scale to other communities, cities, and regions over time.

## Repository Structure

```text
city-pulse/
│
├── apps/
│   ├── mobile/             # Mobile application
│   └── web/                # Web application
│
├── city-pulse-backend/     # Shared backend/API
│
├── packages/
│   ├── constants/          # Shared constants
│   └── types/              # Shared types and interfaces
│
└── docs/                   # PRDs and project documentation
```

## Location and directions

People can save a typed address even when autocomplete finds no match. Such an
address is stored without coordinates and is never treated as a GPS position.
Directions use the device's current location and a resolvable provider location;
when City Pulse cannot calculate a route, it explains the issue and offers to
open the destination in Maps.