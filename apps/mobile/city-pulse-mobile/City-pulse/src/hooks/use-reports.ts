import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchMyListing } from '@/utils/listing-sync';
import { fetchReportsForPulse } from '@/utils/reports-api';

export type ReportEntry = {
  _id: string;
  reason: string;
  severity: 'low' | 'high';
  note: string;
  createdAt: string;
};

export type ReportsState = {
  reports: ReportEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Owns the report history for the signed-in provider's own listing.
 *
 * Reports are the only customer-originating input to trust, and the provider
 * has no other way to learn that one was filed. This hook loads the listing
 * first (to get its id) and then the reports against it, refetching on focus
 * so a report filed while the agent was elsewhere shows up when they return.
 *
 * Reporter identity is deliberately withheld by the API — the agent sees that
 * a report exists and what was said, never who said it.
 */
export function useReports(token: string | null | undefined): ReportsState {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      const listing = await fetchMyListing(token);
      if (!listing) {
        setReports([]);
        setError(null);
        return;
      }

      const result = await fetchReportsForPulse(listing.id, token);
      setReports(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your report history.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  return { reports, isLoading, error, refresh };
}