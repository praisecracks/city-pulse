import { getDistanceMeters } from '@/utils/location';

export type RoutePoint = { latitude: number; longitude: number };

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
};

export type Route = {
  origin: RoutePoint & { label?: string };
  destination: RoutePoint & { label?: string };
  steps: RouteStep[];
  totalDistanceMeters: number;
};

export type TravelMode = 'walking' | 'driving' | 'bicycling' | 'transit';

const COMPASS_DIRECTIONS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

const SPEEDS_MPS: Record<TravelMode, number> = {
  walking: 1.4,
  driving: 13.9,
  bicycling: 4.2,
  transit: 6.0,
};

export function formatStepDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) {
    return 'Now';
  }

  const kilometers = meters / 1000;
  return kilometers >= 1
    ? `${kilometers.toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

export function formatDuration(meters: number, mode: TravelMode): string {
  if (!Number.isFinite(meters) || meters <= 0) {
    return '0 min';
  }

  const seconds = meters / SPEEDS_MPS[mode];
  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hr${minutes ? ` ${minutes} min` : ''}`;
}

export function bearingDegrees(origin: RoutePoint, destination: RoutePoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const delta = toRadians(destination.longitude - origin.longitude);

  const y = Math.sin(delta) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(delta);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function compassDirection(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % COMPASS_DIRECTIONS.length;
  return COMPASS_DIRECTIONS[index];
}

export function generateRoute(
  origin: RoutePoint & { label?: string },
  destination: RoutePoint & { label?: string },
  mode: TravelMode = 'walking',
  stepDistance = 250,
): Route {
  const total = getDistanceMeters(origin, destination);
  const destinationLabel = destination.label || 'your destination';
  const steps: RouteStep[] = [];

  if (total < 10) {
    steps.push({
      instruction: `You have arrived at ${destinationLabel}`,
      distanceMeters: Math.round(total),
    });
    return { origin, destination, steps, totalDistanceMeters: total };
  }

  const direction = compassDirection(bearingDegrees(origin, destination));
  let remaining = total;
  let first = true;

  while (remaining > stepDistance) {
    if (first) {
      steps.push({
        instruction: `Head ${direction} toward ${destinationLabel}`,
        distanceMeters: stepDistance,
      });
      first = false;
    } else {
      steps.push({ instruction: 'Continue', distanceMeters: stepDistance });
    }
    remaining -= stepDistance;
  }

  if (remaining > 0) {
    steps.push({
      instruction: first
        ? `Head ${direction} toward ${destinationLabel}`
        : 'Continue',
      distanceMeters: Math.round(remaining),
    });
    first = false;
  }

  if (mode !== 'walking') {
    steps.push({ instruction: `Continue ${mode === 'driving' ? 'by car' : mode === 'bicycling' ? 'by bike' : 'via transit'}`, distanceMeters: 0 });
  }

  steps.push({ instruction: `Turn toward ${destinationLabel}`, distanceMeters: 0 });
  steps.push({ instruction: `You have arrived at ${destinationLabel}`, distanceMeters: 0 });

  return { origin, destination, steps, totalDistanceMeters: total };
}
