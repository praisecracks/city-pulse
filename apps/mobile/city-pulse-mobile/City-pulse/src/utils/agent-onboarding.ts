import type { AgentDraft, ProviderPhoto } from '@/state/app-state';

/**
 * The agent registration is a 6-step flow the user can walk away from at any
 * point, so "where should they be right now?" is a real concern rather than an
 * edge case. It lives here instead of inside the root layout so the tab bar,
 * the dashboard guard and the redirect logic all agree on the answer.
 */

export const AGENT_ONBOARDING_ROUTES = [
  '/agent-registration-1',
  '/agent-provider-info-2',
  '/agent-location-3',
  '/agent-details-4',
  '/agent-photos-5',
  '/agent-review-6',
] as const;

export const AGENT_SUCCESS_ROUTE = '/agent-success';

export const OGUN_LOCAL_GOVERNMENTS = [
  'Abeokuta North',
  'Abeokuta South',
  'Ado-Odo/Ota',
  'Yewa North',
  'Yewa South',
  'Ewekoro',
  'Ifo',
  'Ijebu East',
  'Ijebu North',
  'Ijebu North East',
  'Ijebu Ode',
  'Ikenne',
  'Imeko Afon',
  'Ipokia',
  'Obafemi Owode',
  'Odeda',
  'Odogbolu',
  'Ogun Waterside',
  'Remo North',
  'Sagamu',
] as const;

/**
 * Draft fields safe to write to disk.
 */
const PERSISTED_FIELDS = [
  'category',
  'businessName',
  'phone',
  'email',
  'whatsapp',
  'localGovernment',
  'area',
  'address',
  'latitude',
  'longitude',
  'accuracy',
  'source',
  'serviceDetails',
  'photos',
] as const satisfies readonly (keyof AgentDraft)[];

export function toPersistedDraft(draft: AgentDraft): Partial<AgentDraft> {
  const persisted: Partial<AgentDraft> = {};
  for (const field of PERSISTED_FIELDS) {
    const value = draft[field];
    if (value !== undefined) {
      // Safe because the field type is narrowed to the AgentDraft value type.
      (persisted as Record<string, unknown>)[field] = value;
    }
  }
  return persisted;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidCoordinate(
  value: unknown,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Rebuilds a draft from untrusted persisted JSON. Anything malformed is
 * dropped rather than trusted, so a corrupted or hand-edited value can never
 * make the app believe a step is complete when it is not.
 */
export function sanitizePersistedDraft(raw: unknown): AgentDraft {
  if (!raw || typeof raw !== 'object') return {};

  const source = raw as Record<string, unknown>;
  const draft: AgentDraft = {};

  if (typeof source.category === 'string') draft.category = source.category as AgentDraft['category'];
  for (const field of ['businessName', 'phone', 'email', 'area', 'address'] as const) {
    if (isText(source[field])) draft[field] = source[field];
  }
  if (
    typeof source.localGovernment === 'string' &&
    OGUN_LOCAL_GOVERNMENTS.some((localGovernment) => localGovernment === source.localGovernment)
  ) {
    draft.localGovernment = source.localGovernment;
  }

  if (isValidCoordinate(source.latitude, -90, 90)) draft.latitude = source.latitude;
  if (isValidCoordinate(source.longitude, -180, 180)) draft.longitude = source.longitude;
  if (typeof source.accuracy === 'number' && Number.isFinite(source.accuracy) && source.accuracy >= 0) {
    draft.accuracy = source.accuracy;
  }
  if (source.source === 'gps' || source.source === 'manual') draft.source = source.source;

  if (source.serviceDetails && typeof source.serviceDetails === 'object') {
    draft.serviceDetails = source.serviceDetails as AgentDraft['serviceDetails'];
  }

  if (Array.isArray(source.photos)) {
    const valid: ProviderPhoto[] = [];
    for (const candidate of source.photos) {
      if (
        candidate &&
        typeof candidate === 'object' &&
        typeof candidate.id === 'string' &&
        typeof candidate.uri === 'string' &&
        typeof candidate.caption === 'string'
      ) {
        valid.push({ id: candidate.id, uri: candidate.uri, caption: candidate.caption, ...(candidate.url ? { url: candidate.url } : {}) });
      }
    }
    if (valid.length > 0) draft.photos = valid;
  }

  return draft;
}

/**
 * The first step whose requirements are not yet met, or null when the draft is
 * complete. Half-written coordinates are treated as absent so a bad GPS fix
 * sends the user back to the location step rather than forward.
 */
export function getAgentResumePath(draft: AgentDraft | null | undefined): string | null {
  // A missing draft is "nothing filled in", not "nothing to do" — returning null
  // here would let a nullish draft read as a finished registration.
  if (!draft) return '/agent-registration-1';
  if (!draft.category) return '/agent-registration-1';
  if (!isText(draft.businessName) || !isText(draft.phone)) return '/agent-provider-info-2';
  if (
    !draft.localGovernment ||
    !OGUN_LOCAL_GOVERNMENTS.some((localGovernment) => localGovernment === draft.localGovernment) ||
    !isText(draft.area) ||
    !isText(draft.address)
  ) {
    return '/agent-location-3';
  }

  if (draft.latitude !== undefined || draft.longitude !== undefined) {
    if (!isValidCoordinate(draft.latitude, -90, 90) || !isValidCoordinate(draft.longitude, -180, 180)) {
      return '/agent-location-3';
    }
  }

  if (!draft.serviceDetails) return '/agent-details-4';

  // Photos are persisted alongside the other draft fields, so a restored draft
  // carries them. If they are genuinely absent the user is sent to the photos
  // step to attach at least one before submitting.
  if (!Array.isArray(draft.photos) || draft.photos.length === 0) return '/agent-photos-5';

  return null;
}

export function isAgentOnboardingComplete(draft: AgentDraft | null | undefined): boolean {
  return getAgentResumePath(draft) === null && Boolean(draft?.category);
}

export function isAgentOnboardingRoute(path: string): boolean {
  return (
    (AGENT_ONBOARDING_ROUTES as readonly string[]).some(
      (route) => path === route || path.startsWith(route + '?') || path.startsWith(route + '/')
    ) || path === AGENT_SUCCESS_ROUTE || path.startsWith(AGENT_SUCCESS_ROUTE + '?')
  );
}
