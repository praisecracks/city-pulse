import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { hasGoogleMapsKey } from '@/utils/api-config';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getListing, STATUS_META } from '@/data/product';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/state/app-state';
import {
  decodePolyline,
  fetchDirections,
  toLocationError,
} from '@/utils/google-places';

const BRAND_TEAL = '#129E9E';
const COLOR_DESTINATION = '#F43F5E';
const COLOR_WHITE = '#FFFFFF';
const MAP_HEIGHT = 440;

type Theme = ReturnType<typeof useTheme>;

type TravelMode = 'walking' | 'driving' | 'bicycling' | 'transit';

interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

interface RouteResult {
  origin: { latitude: number; longitude: number; label: string };
  destination: { latitude: number; longitude: number; label: string };
  steps: RouteStep[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polyline: { latitude: number; longitude: number }[];
}

export default function SmoothDirectionsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const listing = getListing(id || 'adebayo-pos');
  const { token } = useAppState();

  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; label: string } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const currentOrigin = await getCurrentDeviceOrigin();
        if (!isActive) return;

        setOrigin(currentOrigin);

        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000,
            distanceInterval: 3,
          },
          (update) => {
            const nextOrigin = {
              latitude: update.coords.latitude,
              longitude: update.coords.longitude,
              label: 'Current Location',
            };
            if (hasValidCoordinates(nextOrigin)) setOrigin(nextOrigin);
          },
        );

        if (isActive) {
          subscription = nextSubscription;
        } else {
          nextSubscription.remove();
        }
      } catch (error) {
        console.warn('[Directions] Failed to get current location:', error);
        if (isActive) {
          setRouteError(
            'Your location could not be tracked. The provider is still shown on the map. Check location access, retry, or open directions in Maps.',
          );
        }
      }
    };

    void startLocationTracking();

    return () => {
      isActive = false;
      subscription?.remove();
    };
  }, []);

  // Fetch real directions from Google Directions API
  const loadDirections = useCallback(async () => {
    if (!listing) {
      setRoute(null);
      setRouteError('This provider could not be found. Return to the listings and choose another provider.');
      return;
    }

    if (!hasValidCoordinates(listing)) {
      setRoute(null);
      setRouteError('This provider does not have a resolvable map location. You can try finding the address in Maps.');
      return;
    }

    if (!origin) {
      setRoute(null);
      setRouteError(
        'Turn-by-turn directions need your location. Allow location access or set your area, then retry.',
      );
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      // Directions are proxied through the backend, so this no longer depends
      // on the app's own Google key. The key that ships with the app is
      // restricted to Android applications and cannot be used for web
      // services, which is why the lookup used to fail on every device.
      const directions = await fetchDirections(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: listing.latitude, longitude: listing.longitude },
        travelMode,
        { token },
      );

      if (!directions || directions.routes.length === 0) {
        setRoute(null);
        setRouteError(
          'No road route was found between you and this provider. The provider is still shown on the map. Open directions in Maps or try another travel mode.',
        );
        return;
      }

      const leg = directions.routes[0].legs[0];
      const polyline = decodePolyline(directions.routes[0].overviewPolyline.points);

      const steps: RouteStep[] = leg.steps.map((step) => ({
        instruction: step.htmlInstructions.replace(/<[^>]*>/g, ''),
        distanceMeters: step.distance.value,
        durationSeconds: step.duration.value,
        startLocation: step.startLocation,
        endLocation: step.endLocation,
      }));

      setRoute({
        origin,
        destination: { latitude: listing.latitude, longitude: listing.longitude, label: listing.name },
        steps,
        totalDistanceMeters: leg.distance.value,
        totalDurationSeconds: leg.duration.value,
        polyline,
      });
      setCurrentStepIndex(0);
    } catch (error) {
      const failure = toLocationError(error);
      console.warn(
        `[directions] route lookup failed reason=${failure.reason} status=${failure.status ?? 'n/a'}`,
      );
      setRoute(null);
      setRouteError(
        failure.reason === 'offline'
          ? "You're offline. Reconnect and retry for turn-by-turn directions."
          : failure.reason === 'timeout'
            ? 'Directions took too long to load. The provider is still shown on the map. Retry.'
            : 'Turn-by-turn directions are unavailable right now. The provider is still shown on the map. Open directions in Maps or retry.',
      );
    } finally {
      setIsLoadingRoute(false);
    }
  }, [listing, origin, travelMode, token]);

  useEffect(() => {
    // Route state reflects the current device origin, provider, and travel mode.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDirections();
  }, [loadDirections]);

  // Keep the map centered on the device's live location while navigation is active.
  useEffect(() => {
    if (!isFollowingUser || !origin || !mapRef.current) return;
    const targetZoom = travelMode === 'driving' ? 16 : 17;
    const targetPitch = travelMode === 'driving' ? 50 : 0;

    mapRef.current.animateCamera(
      {
        center: { latitude: origin.latitude, longitude: origin.longitude },
        zoom: targetZoom,
        pitch: targetPitch,
      },
      { duration: 1000 },
    );
  }, [isFollowingUser, origin, travelMode]);

  useEffect(() => {
    if (isNavigating) Haptics.selectionAsync();
  }, [isNavigating, origin]);

  const activeStep = route?.steps[currentStepIndex] || route?.steps[0];
  const totalDistanceText = route
    ? `${(route.totalDistanceMeters / 1000).toFixed(1)} km`
    : '—';
  const durationText = route
    ? formatDuration(route.totalDurationSeconds)
    : '';

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setIsFollowingUser(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (activeStep) {
      Speech.speak(`Starting navigation. ${activeStep.instruction}`, { language: 'en', rate: 1.0 });
    }
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    Speech.speak('Navigation ended.', { language: 'en' });
  };

  const handleToggleTravelMode = (mode: TravelMode) => {
    setTravelMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mapRef.current && origin) {
      mapRef.current.animateCamera({
        center: { latitude: origin.latitude, longitude: origin.longitude },
        zoom: mode === 'driving' ? 16 : 17,
        pitch: mode === 'driving' ? 50 : 0,
      });
    }
  };

  const handleOpenInMaps = useCallback(async () => {
    if (!listing) return;

    const destination = hasValidCoordinates(listing)
      ? `${listing.latitude},${listing.longitude}`
      : listing.address?.trim() || `${listing.name}, ${listing.area}`;
    const originParameter = origin
      ? `&origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}`
      : '';
    const mode = travelMode === 'bicycling' ? 'bicycling' : travelMode;
    const url =
      `https://www.google.com/maps/dir/?api=1${originParameter}` +
      `&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('[Directions] Failed to open external maps:', error);
      setRouteError('Could not open Maps. Check that a maps app or browser is available, then try again.');
    }
  }, [listing, origin, travelMode]);

  const handleRetry = useCallback(async () => {
    if (origin) {
      await loadDirections();
      return;
    }

    setRouteError(null);
    try {
      setOrigin(await getCurrentDeviceOrigin());
    } catch (error) {
      console.warn('[Directions] Retry failed to get current location:', error);
      setRouteError(
        'Your location could not be tracked. The provider is still shown on the map. Check location access, retry, or open directions in Maps.',
      );
    }
  }, [loadDirections, origin]);

  if (!listing) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.appBar}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color={theme.textBody} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Navigation</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const status = STATUS_META[listing.status] || {
    label: listing.status.toUpperCase(),
    background: theme.backgroundHover,
    color: theme.textSecondary,
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Active Navigation HUD Banner */}
        {isNavigating && activeStep && (
          <View style={styles.hudBanner}>
            <View style={styles.hudIconContainer}>
              <Ionicons name="navigate-circle" size={32} color={COLOR_WHITE} />
            </View>
            <View style={styles.hudContent}>
              <ThemedText style={styles.hudDistanceText}>
                {(activeStep.distanceMeters / 1000).toFixed(1)} km
              </ThemedText>
              <ThemedText style={styles.hudInstructionText} numberOfLines={2}>
                {activeStep.instruction}
              </ThemedText>
            </View>
            <Pressable onPress={handleStopNavigation} style={styles.hudExitBtn}>
              <Ionicons name="close" size={20} color={COLOR_WHITE} />
            </Pressable>
          </View>
        )}

        {/* Standard App Bar */}
        {!isNavigating && (
          <View style={styles.appBar}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color={theme.textBody} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Navigation</ThemedText>

            {/* Travel Mode Selector Pills */}
            <View style={styles.modeSelector}>
              {(['walking', 'driving', 'bicycling'] as TravelMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => handleToggleTravelMode(mode)}
                  style={[styles.modeBtn, travelMode === mode && styles.modeBtnActive]}
                >
                  <Ionicons
                    name={mode === 'walking' ? 'walk' : mode === 'driving' ? 'car' : 'bicycle'}
                    size={16}
                    color={travelMode === mode ? COLOR_WHITE : theme.textSecondary}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Map with Real Route */}
        {hasValidCoordinates(listing) ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={hasGoogleMapsKey() ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: origin?.latitude ?? listing.latitude,
                longitude: origin?.longitude ?? listing.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={Boolean(origin)}
              showsCompass={true}
              rotateEnabled={true}
              pitchEnabled={true}
              onPanDrag={() => setIsFollowingUser(false)}
            >
              <Marker
                key={`destination-${listing.id}`}
                coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
                title={listing.name}
              >
                <View style={styles.destinationMarker}>
                  <Ionicons name="flag" size={16} color={COLOR_WHITE} />
                </View>
              </Marker>

              {route?.polyline && (
                <Polyline
                  key="route"
                  coordinates={route.polyline}
                  strokeColor={BRAND_TEAL}
                  strokeWidth={5}
                  geodesic={true}
                />
              )}
            </MapView>

            {isLoadingRoute && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={BRAND_TEAL} />
              </View>
            )}

            {/* Recenter Floating Button */}
            <View style={styles.mapOverlayControls}>
              <Pressable
                onPress={() => {
                  setIsFollowingUser(true);
                  if (mapRef.current) {
                    mapRef.current.animateCamera({
                      center: {
                        latitude: origin?.latitude ?? listing.latitude,
                        longitude: origin?.longitude ?? listing.longitude,
                      },
                      zoom: travelMode === 'driving' ? 16 : 17,
                      pitch: travelMode === 'driving' ? 50 : 0,
                    });
                  }
                }}
                style={styles.overlayBtn}
              >
                <Ionicons name="compass" size={22} color={isFollowingUser ? BRAND_TEAL : theme.textTertiary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location-outline" size={36} color={theme.textTertiary} />
            <ThemedText style={styles.mapPlaceholderText}>
              Provider location isn&apos;t available on the map yet.
            </ThemedText>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Telemetry Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.destinationBadge}>
                <Ionicons name="business" size={14} color={BRAND_TEAL} />
                <ThemedText style={styles.destinationLabel} numberOfLines={1}>{listing.name}</ThemedText>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status.background }]}>
                <ThemedText style={[styles.statusLabel, { color: status.color }]}>{status.label}</ThemedText>
              </View>
            </View>

            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <ThemedText style={styles.telemetryValue}>{totalDistanceText}</ThemedText>
                <ThemedText style={styles.telemetryLabel}>Distance</ThemedText>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <ThemedText style={styles.telemetryValue}>{durationText || '—'}</ThemedText>
                <ThemedText style={styles.telemetryLabel}>ETA ({travelMode})</ThemedText>
              </View>
            </View>

            {!isNavigating ? (
              <Pressable onPress={handleStartNavigation} style={styles.actionBtn} disabled={!route || isLoadingRoute}>
                <Ionicons name="play" size={18} color={COLOR_WHITE} />
                <ThemedText style={styles.actionBtnText}>
                  {isLoadingRoute ? 'Loading route...' : 'Start Live Navigation'}
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable onPress={handleStopNavigation} style={[styles.actionBtn, styles.actionBtnActive]}>
                <Ionicons name="stop" size={18} color={COLOR_WHITE} />
                <ThemedText style={styles.actionBtnText}>End Navigation</ThemedText>
              </Pressable>
            )}
          </View>

          {/* Turn-by-Turn Maneuver List */}
          {route && (
            <View style={styles.stepsSection}>
              <ThemedText style={styles.stepsTitle}>Turn-by-Turn Guide</ThemedText>
              <FlatList
                data={route.steps}
                keyExtractor={(_, index) => `step-${index}`}
                renderItem={({ item, index }) => {
                  const isCurrent = index === currentStepIndex && isNavigating;
                  const isLast = index === route.steps.length - 1;
                  return (
                    <Pressable
                      onPress={() => setCurrentStepIndex(index)}
                      style={[styles.stepItem, isCurrent && styles.stepItemActive]}
                    >
                      <View style={[styles.stepIcon, { backgroundColor: isLast ? COLOR_DESTINATION : BRAND_TEAL }]}>
                        <Ionicons name={isLast ? 'flag' : 'arrow-up'} size={14} color={COLOR_WHITE} />
                      </View>
                      <View style={styles.stepContent}>
                        <ThemedText style={[styles.stepInstruction, isCurrent && styles.stepInstructionActive]}>
                          {item.instruction}
                        </ThemedText>
                        <ThemedText style={styles.stepDistance}>
                          {(item.distanceMeters / 1000).toFixed(2)} km · {formatDuration(item.durationSeconds)}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                }}
                scrollEnabled={false}
              />
            </View>
          )}

          {routeError && !route && (
            <View style={styles.errorCard}>
              <Ionicons name="information-circle" size={24} color={BRAND_TEAL} />
              <ThemedText style={styles.errorCardText}>{routeError}</ThemedText>
              {listing && (
                <>
                  <Pressable onPress={handleOpenInMaps} style={styles.fallbackBtn}>
                    <ThemedText style={styles.retryText}>Open directions in Maps</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => void handleRetry()} style={styles.retryBtn}>
                    <ThemedText style={styles.retryGhostText}>Retry in City Pulse</ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

async function getCurrentDeviceOrigin(): Promise<{
  latitude: number;
  longitude: number;
  label: string;
}> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to calculate directions.');
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Location services are turned off. Enable them to calculate directions.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  const origin = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    label: 'Current Location',
  };
  if (!hasValidCoordinates(origin)) {
    throw new Error('Your current location could not be resolved. Try again.');
  }

  return origin;
}

function hasValidCoordinates(
  location: { latitude?: number; longitude?: number } | null | undefined,
): location is { latitude: number; longitude: number } {
  if (!location) return false;

  const { latitude, longitude } = location;
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    safeArea: { flex: 1 },
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.textBody },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 2,
      gap: 2,
    },
    modeBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    modeBtnActive: { backgroundColor: BRAND_TEAL },
    hudBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: BRAND_TEAL,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    hudIconContainer: { justifyContent: 'center', alignItems: 'center' },
    hudContent: { flex: 1 },
    hudDistanceText: { fontSize: 18, fontWeight: '900', color: COLOR_WHITE },
    hudInstructionText: { fontSize: 13, fontWeight: '600', color: COLOR_WHITE },
    hudExitBtn: { padding: 6 },
    mapContainer: { height: MAP_HEIGHT, width: '100%', position: 'relative' },
    map: { flex: 1 },
    mapOverlayControls: { position: 'absolute', right: 16, top: 16, zIndex: 11 },
    overlayBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.backgroundElement,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    destinationMarker: {
      backgroundColor: COLOR_DESTINATION,
      padding: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: COLOR_WHITE,
    },
    mapPlaceholder: { height: MAP_HEIGHT, justifyContent: 'center', alignItems: 'center', gap: 8 },
    mapPlaceholderText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 10,
    },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    summaryCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 16,
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    destinationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${BRAND_TEAL}15`,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
      flex: 1,
      marginRight: 8,
    },
    destinationLabel: { fontSize: 13, fontWeight: '700', color: BRAND_TEAL },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusLabel: { fontSize: 10, fontWeight: '800' },
    telemetryGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundHover,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    telemetryItem: { flex: 1, alignItems: 'center' },
    telemetryDivider: { width: 1, height: 28, backgroundColor: theme.border },
    telemetryValue: { fontSize: 16, fontWeight: '800', color: theme.textBody },
    telemetryLabel: { fontSize: 10, fontWeight: '600', color: theme.textSecondary, marginTop: 2 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: BRAND_TEAL,
      borderRadius: 14,
      paddingVertical: 14,
      gap: 8,
    },
    actionBtnActive: { backgroundColor: COLOR_DESTINATION },
    actionBtnText: { fontSize: 15, fontWeight: '800', color: COLOR_WHITE },
    stepsSection: { gap: 8 },
    stepsTitle: { fontSize: 13, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.4 },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 10,
      borderRadius: 12,
    },
    stepItemActive: { backgroundColor: theme.backgroundSelected, borderWidth: 1, borderColor: BRAND_TEAL },
    stepIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    stepContent: { flex: 1 },
    stepInstruction: { fontSize: 14, fontWeight: '600', color: theme.textBody },
    stepInstructionActive: { fontWeight: '800' },
    stepDistance: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginTop: 2 },
    errorCard: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      gap: 10,
    },
    errorCardText: { fontSize: 14, color: theme.textBody, fontWeight: '600', textAlign: 'center' },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: BRAND_TEAL,
      borderRadius: 10,
    },
    fallbackBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: BRAND_TEAL,
      borderRadius: 10,
    },
    retryText: { color: '#FFFFFF', fontWeight: '700' },
    retryGhostText: { color: BRAND_TEAL, fontWeight: '700' },
  });