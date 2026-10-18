/**
 * How long a provider's status stays credible before customers should be told
 * to double-check it.
 *
 * The window is mirrored on both sides: the API runs applyFreshnessRule() at
 * boot and every 30 minutes, flipping any listing past the window back to
 * "Unconfirmed" (see city-pulse-backend/src/services/freshnessService.js). This
 * module is what tells the provider the clock is running before that happens,
 * and is derived from the server's lastUpdated rather than from a local timer
 * that starts at 175 and counts down.
 *
 * The two copies are deliberately the same number. Changing one without the
 * other means the provider is warned about a deadline the server does not
 * enforce, or is not warned about one it does.
 */
export const FRESHNESS_WINDOW_MS = 3 * 60 * 60 * 1000;

export type Freshness = {
  label: string;
  isExpired: boolean;
  remainingMs: number;
};

/**
 * Describes how much of the freshness window is left, or null when there is no
 * usable timestamp (seed listings, or a listing that has never been updated).
 */
export function getFreshness(updatedAt: string | undefined, now: number): Freshness | null {
  if (!updatedAt) return null;

  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return null;

  const remainingMs = Math.max(0, FRESHNESS_WINDOW_MS - (now - timestamp));
  if (remainingMs <= 0) {
    return { label: 'Expired — update to refresh', isExpired: true, remainingMs: 0 };
  }

  // Round up so a window with 90 seconds left does not read as "0m".
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    label: `Expires in ${hours}h ${minutes}m`,
    isExpired: false,
    remainingMs,
  };
}
