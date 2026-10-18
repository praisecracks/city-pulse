import { apiRequest } from './api-client';
import { MOCK_API } from './api-config';

/**
 * Report reasons, mirroring the backend's REPORT_REASONS enum.
 *
 * The backend also derives `severity` from the reason, so a client can never
 * declare its own report high-severity. The `id` values below are the wire
 * format; the label is presentation only.
 */
export const REPORT_REASONS = [
  { id: 'not_available', label: "Marked available but wasn't" },
  { id: 'price_mismatch', label: 'Price / rate did not match' },
  { id: 'unsafe_or_dishonest', label: 'Unsafe or dishonest interaction' },
  { id: 'closed', label: 'Provider is currently closed' },
  { id: 'other', label: 'Other' },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

export const REPORT_REASON_IDS = REPORT_REASONS.map((reason) => reason.id) as ReportReasonId[];

export function isReportReasonId(value: unknown): value is ReportReasonId {
  return typeof value === 'string' && (REPORT_REASON_IDS as string[]).includes(value);
}

const MAX_NOTE_LENGTH = 280;

export type SubmitReportResult = {
  /** The report's trust score after this report was recorded, so the detail screen can update without a refetch. */
  trustScore?: number;
};

/**
 * Files a report against a listing via POST /pulses/:id/reports.
 *
 * Rejects with the server's own message so the UI can distinguish the cases that
 * matter to a customer: reporting yourself, and having already reported this
 * listing today.
 */
export async function submitReport(
  listingId: string,
  reason: ReportReasonId,
  note: string,
  token: string | null,
): Promise<SubmitReportResult> {
  if (MOCK_API) {
    // No backend in mock mode, so there is nothing truthful to confirm. The
    // caller surfaces this as "reports are unavailable right now" rather than
    // faking a success the user would rely on.
    throw new Error('Reporting is unavailable in this build.');
  }

  if (!token) {
    throw new Error('You need to be signed in to file a report.');
  }

  const payload = await apiRequest<{ trustScore?: number }>(
    `/pulses/${listingId}/reports`,
    {
      method: 'POST',
      token,
      body: {
        reason,
        note: note.trim().slice(0, MAX_NOTE_LENGTH),
      },
    },
  );

  return { trustScore: payload?.trustScore };
}
