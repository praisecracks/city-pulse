/**
 * Picks a usable area label from a list of candidates, skipping placeholder
 * values.
 *
 * When a reverse-geocode fails the API returns "Unknown area", and every
 * derived label and card then shows that broken string. This helper treats
 * such values as absent so the UI falls through to a real area or a sensible
 * default instead of advertising a failed lookup to the user.
 *
 * It is deliberately a pure function with no store dependency: the insight
 * card and the area pill must keep rendering regardless of whether location
 * resolved, because a missing card reads as a broken app, not as "no data".
 */
const UNKNOWN_AREA_TOKENS = new Set([
  'unknown area',
  'unknown',
  'unknown-area',
  '',
]);

export function resolveDisplayArea(
  ...candidates: Array<string | undefined | null>
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (UNKNOWN_AREA_TOKENS.has(trimmed.toLowerCase())) continue;
    return trimmed;
  }
  return 'Your Area';
}