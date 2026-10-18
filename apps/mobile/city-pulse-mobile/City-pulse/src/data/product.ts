export const CATEGORIES = ['pos', 'food', 'gas', 'house'] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_BASELINES: Record<Category, number> = {
  pos: 54,
  food: 42,
  gas: 38,
  house: 61,
};
export type Availability = 'available' | 'low_supply' | 'unavailable' | 'unconfirmed';
export type ListingReviewStatus = 'pending_review' | 'approved' | 'rejected';

/** A photo a provider uploaded, mirroring the Pulse model's `images` entries. */
export type ListingPhoto = {
  url: string;
  /**
   * Host-independent path exactly as stored on the Pulse, e.g. "/uploads/ab12.jpg".
   * Screens that write a listing back to the API must send this rather than
   * `url`, because the API only accepts paths that its own upload route issued.
   */
  path?: string;
  caption?: string;
};

export type Listing = {
  id: string;
  category: Category;
  name: string;
  area: string;
  distance: string;
  status: Availability;
  /** Moderation state, separate from customer-facing availability. Missing on legacy listings. */
  reviewStatus?: ListingReviewStatus;
  reviewNote?: string;
  providerVerified?: boolean;
  state?: string;
  localGovernment?: string;
  updated: string;
  /** ISO timestamp behind `updated`, so countdowns can be computed rather than shown as a frozen string. Only present on listings that came from the API. */
  updatedAt?: string;
  trust: number;
  detail: string;
  price: string;
  image?: number;
  /** Category-specific fields the API requires (POS fee, gas price per KG, menu items…). Carried through so an edit screen can show and change them. */
  details?: Record<string, unknown>;
  /** Uploaded photos shown as a swipeable gallery. The first is the cover. */
  photos?: ListingPhoto[];
  latitude?: number;
  longitude?: number;
  /** Distance from query point in meters (set by /nearby endpoint). */
  distanceMeters?: number;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  createdAt?: string;
  /**
   * The provider who owns this listing, as the id the API uses.
   *
   * This exists so a client can tell "my listing" from "someone else's" and
   * refuse to offer an action that would be self-serving — reporting yourself,
   * favouriting yourself. The server rejects those too, but a control the user
   * can see and understand beats an error they have to trigger to discover.
   * Only present on listings that came from the API.
   */
  agentId?: string;
};

export const CATEGORY_META: Record<Category, { label: string; shortLabel: string; icon: string }> = {
  pos: { label: 'POS / Cash', shortLabel: 'POS Cash', icon: '▣' },
  food: { label: 'Food Spots', shortLabel: 'Food', icon: '♜' },
  gas: { label: 'Cooking Gas', shortLabel: 'Gas', icon: '×' },
  house: { label: 'House Agents', shortLabel: 'House', icon: '⌂' },
};

/**
 * Seed listings.
 *
 * These are the providers a visitor sees before any provider has registered.
 * They are real, browsable entries — not placeholder text — so the Discover
 * grid shows live counts, the map has markers to pin, and directions has a
 * destination to route to on first open. A provider's own published listing
 * is merged on top of these at sync time, so seed entries never overwrite
 * real ones.
 *
 * Coordinates are real Abeokuta locations so the nearby query and the map can
 * actually do something with them.
 */
export const LISTINGS: Listing[] = [
  {
    id: 'seed-adebayo-pos',
    category: 'pos',
    name: 'Adebayo POS & Cash Services',
    area: 'Abeokuta',
    distance: '0.4 km',
    status: 'available',
    updated: 'just now',
    trust: 4.2,
    detail: 'Instant cash withdrawal and deposit, no queue.',
    price: 'N200 per N5,000',
    latitude: 7.1475,
    longitude: 3.3619,
    phone: '+234-802-555-0147',
    address: 'Abeokuta, Ogun State',
  },
  {
    id: 'seed-oluwaseun-food',
    category: 'food',
    name: 'Oluwaseun Food Spot',
    area: 'Abeokuta',
    distance: '0.6 km',
    status: 'available',
    updated: '5 min ago',
    trust: 4.5,
    detail: 'Fresh meals served all day, local recipes.',
    price: '3 items on the menu',
    latitude: 7.1492,
    longitude: 3.3641,
    phone: '+234-803-442-9180',
    address: 'Abeokuta, Ogun State',
  },
  {
    id: 'seed-gas-ogun',
    category: 'gas',
    name: 'Ogun Gas & Cooking Supply',
    area: 'Abeokuta',
    distance: '0.9 km',
    status: 'low_supply',
    updated: '12 min ago',
    trust: 4.0,
    detail: '12.5kg and 6kg cylinders, home delivery.',
    price: 'N9,800 per KG',
    latitude: 7.151,
    longitude: 3.358,
    phone: '+234-805-661-2233',
    address: 'Abeokuta, Ogun State',
  },
  {
    id: 'seed-house-ogun',
    category: 'house',
    name: 'Ogun House Agents',
    area: 'Abeokuta',
    distance: '1.2 km',
    status: 'available',
    updated: '30 min ago',
    trust: 3.8,
    detail: 'Residential and commercial property, all areas.',
    price: 'Residential, Commercial',
    latitude: 7.144,
    longitude: 3.3665,
    phone: '+234-807-778-4455',
    address: 'Abeokuta, Ogun State',
  },
];

export const STATUS_META: Record<Availability, { label: string; color: string; background: string }> = {
  available: { label: 'Available', color: '#287b5f', background: '#d8f4e9' },
  low_supply: { label: 'Low Supply', color: '#9a6500', background: '#fff0c7' },
  unavailable: { label: 'Unavailable', color: '#b4232c', background: '#ffe1e3' },
  unconfirmed: { label: 'Unconfirmed', color: '#65706a', background: '#e8ece9' },
};

export function getListings(category: Category) {
  return getAllListings().filter((listing) => listing.category === category);
}

export function getListing(id: string) {
  return getAllListings().find((listing) => listing.id === id);
}

// --- Live listings overlay ---
//
// The seed array above keeps the app browsable offline, but a provider who just
// registered must be able to see their own listing straight away. Listings
// fetched from GET /pulses are therefore merged on top of the seed data rather
// than replacing it, and every existing getListing/getListings caller picks
// them up without change.
//
// This is a read-mostly cache with explicit invalidation, so the derived array
// is memoised and only rebuilt when a sync actually changes something.

let remoteListings: Listing[] = [];
let cache: Listing[] | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Replaces the live overlay and notifies subscribers if anything changed. */
export function setRemoteListings(listings: Listing[]): void {
  const changed =
    listings.length !== remoteListings.length ||
    listings.some((listing, index) => listing !== remoteListings[index]);

  if (!changed) return;

  remoteListings = listings;
  cache = null;
  listeners.forEach((listener) => listener());
}

export function subscribeToListings(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable array identity between syncs, as useSyncExternalStore requires. */
export function getAllListings(): Listing[] {
  if (!cache) cache = [...LISTINGS, ...remoteListings];
  return cache;
}
