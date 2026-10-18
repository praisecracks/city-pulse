import { API_BASE_URL, MOCK_API } from './api-config';
import { fetchMyListing } from './listing-sync';

const REQUEST_TIMEOUT_MS = 10_000;

export type ReportEntry = {
  _id: string;
  reason: string;
  severity: 'low' | 'high';
  note: string;
  createdAt: string;
};

type ReportsResponse = {
  success?: boolean;
  count?: number;
  data?: ReportEntry[];
  message?: string;
};

/**
 * Loads the reports filed against the signed-in provider's own listing.
 *
 * The listing id is resolved first because the reports endpoint is scoped to
 * a pulse. Reporter identity is withheld by the server — the agent sees that
 * a report exists and what was said, never who said it.
 *
 * Throws on failure so the caller can show a retry rather than an empty list
 * that looks like "nobody has reported you".
 */
export async function fetchReportsForPulse(
  pulseId: string,
  token: string | null,
): Promise<ReportEntry[]> {
  if (MOCK_API) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/pulses/${encodeURIComponent(pulseId)}/reports`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      },
    );

    const payload = (await response.json().catch(() => null)) as ReportsResponse | null;

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Could not load your report history.');
    }

    return Array.isArray(payload.data) ? payload.data : [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolves the provider's own listing id, then loads its reports. Used by the
 * notifications tab so it does not have to know about the listing fetch.
 */
export async function fetchMyReports(token: string | null): Promise<ReportEntry[]> {
  const listing = await fetchMyListing(token);
  if (!listing) return [];
  return fetchReportsForPulse(listing.id, token);
}