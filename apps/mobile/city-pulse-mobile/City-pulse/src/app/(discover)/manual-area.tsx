
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  ListRenderItemInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  useAppState,
  type CustomerLocation,
  type ServiceArea,
} from '@/state/app-state';
import { createManualLocation, getAutomaticLocation } from '@/utils/location';
import {
  fetchPlacePredictions,
  fetchPlaceDetails,
  type PlaceDetails,
} from '@/utils/google-places';

const PRIMARY_COLOR = '#0C8177';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';

function sanitizeInput(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '');
}

function hasValidCoordinates(
  location: { latitude: number; longitude: number } | null | undefined,
): location is { latitude: number; longitude: number } {
  return (
    !!location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

type PlacePrediction = {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
};

type SelectedPlace = PlaceDetails & {
  mainText: string;
  secondaryText: string;
};

export default function ManualAreaScreen() {
  const {
    setSelectedArea,
    setCustomerLocation,
    customerLocation,
  } = useAppState();

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const interactionStartedRef = useRef(false);
  const autoDetectAttemptedRef = useRef(false);
  const predictionRequestIdRef = useRef(0);
  const detailsRequestIdRef = useRef(0);
  const persistedManualAddress =
    !hasInteracted &&
    customerLocation?.mode === 'manual' &&
    customerLocation.gps === null
      ? customerLocation.label
      : null;
  const effectiveManualAddress = manualAddress ?? persistedManualAddress;

  // Keep asynchronous work from updating the screen after it unmounts.
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      // Invalidate any requests that are still in flight.
      predictionRequestIdRef.current += 1;
      detailsRequestIdRef.current += 1;
    };
  }, []);

  // Detect an existing GPS location if permission was previously granted.
  // Detection fills the screen but does not navigate away or bypass confirmation.
  useEffect(() => {
    if (autoDetectAttemptedRef.current) return;

    // Do not silently replace a location the user previously chose manually.
    if (customerLocation?.mode === 'manual') return;

    autoDetectAttemptedRef.current = true;

    const autoDetect = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') return;

        const detected = await getAutomaticLocation();

        if (!isMountedRef.current || interactionStartedRef.current) return;
        if (!hasValidCoordinates(detected.gps)) return;

        const serviceArea = detected.serviceArea ?? null;
        const label =
          serviceArea?.name ||
          detected.label ||
          'Selected area';

        const locationToSave: CustomerLocation = {
          gps: detected.gps,
          address: detected.address ?? null,
          serviceArea,
          label,
          mode: 'automatic',
        };

        if (serviceArea) {
          setSelectedArea(serviceArea.name);
        }

        setCustomerLocation(locationToSave);
        setManualAddress(null);
        setHasAutoDetected(true);
      } catch {
        // Location detection is optional. Manual search remains available.
      }
    };

    void autoDetect();
  }, [
    customerLocation?.mode,
    setCustomerLocation,
    setSelectedArea,
  ]);

  const invalidatePendingSearches = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    predictionRequestIdRef.current += 1;
    detailsRequestIdRef.current += 1;
    setIsLoadingPredictions(false);
    setIsLoadingPlaceDetails(false);
  }, []);

  // Debounced autocomplete with protection against stale responses.
  const handleQueryChange = useCallback(
    (text: string) => {
      interactionStartedRef.current = true;
      setHasInteracted(true);

      const clean = sanitizeInput(text);

      setQuery(clean);
      setSelectedPlace(null);
      setManualAddress(null);
      setHasAutoDetected(false);
      setErrorMessage(null);
      setPredictions([]);
      setIsLoadingPredictions(false);
      setIsLoadingPlaceDetails(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      // Any existing response now belongs to an outdated query.
      detailsRequestIdRef.current += 1;
      const requestId = ++predictionRequestIdRef.current;

      if (clean.trim().length < 2) {
        return;
      }

      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;

        if (
          !isMountedRef.current ||
          requestId !== predictionRequestIdRef.current
        ) {
          return;
        }

        setIsLoadingPredictions(true);

        try {
          // No `types` filter: the New Places API's `address` type matches
          // street-address predictions only and excludes `locality` (cities
          // such as Abeokuta), `sublocality` (neighbourhoods such as Ibara
          // and Onikolobo), and `establishment`/`point_of_interest`
          // (landmarks). Letting the API return its default mix is what
          // makes those queries work. `regionCode` scopes results to
          // Nigeria.
          const results = await fetchPlacePredictions(clean.trim(), {
            country: 'ng',
          });

          if (
            isMountedRef.current &&
            requestId === predictionRequestIdRef.current
          ) {
            setPredictions(results);
          }
        } catch {
          if (
            isMountedRef.current &&
            requestId === predictionRequestIdRef.current
          ) {
            setPredictions([]);
            setErrorMessage(
              'Could not search locations. Please check your connection and try again.',
            );
          }
        } finally {
          if (
            isMountedRef.current &&
            requestId === predictionRequestIdRef.current
          ) {
            setIsLoadingPredictions(false);
          }
        }
      }, 300);
    },
    [],
  );

  // Fetch the coordinates and address components for the selected Place.
  const handleSelectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      interactionStartedRef.current = true;
      setHasInteracted(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      predictionRequestIdRef.current += 1;
      const requestId = ++detailsRequestIdRef.current;

      setQuery(prediction.description);
      setPredictions([]);
      setIsLoadingPredictions(false);
      setSelectedPlace(null);
      setHasAutoDetected(false);
      setErrorMessage(null);
      setIsLoadingPlaceDetails(true);

      try {
        const details = await fetchPlaceDetails(prediction.placeId);

        if (
          !isMountedRef.current ||
          requestId !== detailsRequestIdRef.current
        ) {
          return;
        }

        if (!details || !hasValidCoordinates(details)) {
          setErrorMessage(
            'Could not load valid address coordinates. Please select another result.',
          );
          return;
        }

        const selected: SelectedPlace = {
          ...details,
          mainText: prediction.structuredFormatting.mainText,
          secondaryText: prediction.structuredFormatting.secondaryText,
        };

        setSelectedPlace(selected);
        setManualAddress(null);
      } catch {
        if (
          isMountedRef.current &&
          requestId === detailsRequestIdRef.current
        ) {
          setErrorMessage(
            'Could not load address details. Please try another location.',
          );
        }
      } finally {
        if (
          isMountedRef.current &&
          requestId === detailsRequestIdRef.current
        ) {
          setIsLoadingPlaceDetails(false);
        }
      }
    },
    [],
  );

  const handleContinue = useCallback(() => {
    setHasInteracted(true);
    // A manually selected place must have real coordinates from Place Details.
    if (selectedPlace) {
      if (!hasValidCoordinates(selectedPlace)) {
        setErrorMessage(
          'This address does not have valid coordinates. Please select another result.',
        );
        return;
      }

      const components = selectedPlace.addressComponents;

      const streetName =
        components.route || components.street_number
          ? `${components.street_number || ''} ${components.route || ''}`.trim()
          : selectedPlace.mainText;

      const community =
        components.sublocality_level_1 ||
        components.sublocality ||
        components.neighborhood ||
        components.locality ||
        '';

      const city = components.city || components.locality || '';
      const state = components.administrative_area_level_1 || '';
      const country = components.country || '';

      const serviceAreaName =
        community || city || selectedPlace.mainText;

      const serviceArea: ServiceArea = {
        name: serviceAreaName,
        source: 'manual',
        confidence: 'high',
      };

      const location: CustomerLocation = {
        gps: {
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          // Place Details coordinates are not a GPS accuracy measurement.
          timestamp: Date.now(),
        },
        address: {
          formattedAddress: selectedPlace.formattedAddress,
          streetName: streetName || undefined,
          community: community || undefined,
          locality: city || undefined,
          administrativeArea: state || undefined,
          country: country || undefined,
          components,
        },
        serviceArea,
        label: serviceAreaName,
        mode: 'manual',
      };

      setSelectedArea(serviceAreaName);
      setCustomerLocation(location);

      router.replace(
        `/home-discover?area=${encodeURIComponent(serviceAreaName)}`,
      );
      return;
    }

    // GPS detection also requires an explicit confirmation tap.
    if (hasAutoDetected && customerLocation?.gps) {
      if (!hasValidCoordinates(customerLocation.gps)) {
        setErrorMessage(
          'Your location coordinates are invalid. Please detect your location again or search manually.',
        );
        return;
      }

      router.replace(
        `/home-discover?area=${encodeURIComponent(customerLocation.label)}`,
      );
      return;
    }

    // Manual entry fallback: a typed address with no matching Google suggestion
    // is still confirmable. It carries no coordinates, so Discover will use
    // text-based matching rather than coordinate-based discovery.
    if (effectiveManualAddress) {
      router.replace(`/home-discover?area=${encodeURIComponent(effectiveManualAddress)}`);
      return;
    }

    setErrorMessage('Please select an address or detect your current location.');
  }, [
    selectedPlace,
    effectiveManualAddress,
    hasAutoDetected,
    customerLocation,
    setCustomerLocation,
    setSelectedArea,
  ]);

  const handleUseCurrentLocation = useCallback(async () => {
    interactionStartedRef.current = true;
    setHasInteracted(true);
    invalidatePendingSearches();

    setIsLocating(true);
    setErrorMessage(null);
    setSelectedPlace(null);
    setHasAutoDetected(false);
    setPredictions([]);
    setQuery('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!isMountedRef.current) return;

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'City Pulse needs your location to auto-detect your address. You can also search manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
        return;
      }

      const detected = await getAutomaticLocation();

      if (!isMountedRef.current) return;

      if (!hasValidCoordinates(detected.gps)) {
        setErrorMessage(
          'Unable to get valid location coordinates. Please try again or search manually.',
        );
        return;
      }

      const serviceArea = detected.serviceArea ?? null;
      const label =
        serviceArea?.name ||
        detected.label ||
        'Selected area';

      const locationToSave: CustomerLocation = {
        gps: detected.gps,
        address: detected.address ?? null,
        serviceArea,
        label,
        mode: 'automatic',
      };

      if (serviceArea) {
        setSelectedArea(serviceArea.name);
      }

      setCustomerLocation(locationToSave);
      setManualAddress(null);
      setHasAutoDetected(true);
    } catch (error: unknown) {
      if (!isMountedRef.current) return;

      const message =
        error instanceof Error ? error.message.toLowerCase() : '';

      if (message.includes('permission')) {
        Alert.alert(
          'Location Permission Required',
          'City Pulse needs your location to auto-detect your address. You can also search manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
      } else if (
        message.includes('disabled') ||
        message.includes('unavailable')
      ) {
        Alert.alert(
          'Location Services Unavailable',
          'Your device location could not be accessed. Please enable location services or search manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ],
        );
      } else {
        setErrorMessage(
          'Unable to get your location. Please try again or search manually.',
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLocating(false);
      }
    }
  }, [invalidatePendingSearches, setCustomerLocation, setSelectedArea]);

  /**
   * Tapping the detected-location suggestion beneath the input confirms the
   * already-resolved current location without re-acquiring GPS.
   */
  const confirmAutoDetectedLocation = useCallback(() => {
    if (!customerLocation?.gps || !hasValidCoordinates(customerLocation.gps)) return;

    const resolvedName =
      customerLocation.serviceArea?.name ||
      customerLocation.label ||
      'Current location';

    setHasAutoDetected(true);
    setErrorMessage(null);
    setSelectedArea(resolvedName);
  }, [customerLocation, setSelectedArea]);

  /**
   * Saves a manually typed address that has no matching Google Places
   * suggestion. The address is stored as an *unverified* location: it carries
   * no coordinates and must never trigger coordinate-based discovery or
   * directions. This is the fallback that keeps manual entry from being
   * blocked when autocomplete returns nothing useful.
   */
  const saveManualAddress = useCallback(
    (address: string) => {
      const trimmed = address.trim();
      if (!trimmed) return;

      setHasInteracted(true);
      invalidatePendingSearches();
      setSelectedPlace(null);
      setHasAutoDetected(false);
      setManualAddress(trimmed);
      setErrorMessage(null);

      const locationToSave = createManualLocation({ label: trimmed });
      setCustomerLocation(locationToSave);
      setSelectedArea(trimmed);
    },
    [invalidatePendingSearches, setCustomerLocation, setSelectedArea],
  );

  const clearSelection = useCallback(() => {
    interactionStartedRef.current = true;
    setHasInteracted(true);
    invalidatePendingSearches();

    setSelectedPlace(null);
    setManualAddress(null);
    setHasAutoDetected(false);
    setErrorMessage(null);
    setQuery('');
    setPredictions([]);
  }, [invalidatePendingSearches]);

  // Whether the user has a confirmable selection on screen. A manually typed
  // address with no Google suggestion is confirmable too — it just carries no
  // coordinates, so Discover will fall back to text-based matching.
  const hasSelection =
    !!selectedPlace ||
    !!effectiveManualAddress ||
    (hasAutoDetected && !!customerLocation?.gps);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => {
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={COLOR_TEXT_MAIN}
            />
          </Pressable>

          <ThemedText style={styles.topBarTitle}>
            Set Location
          </ThemedText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preferred-location header */}
            <View style={styles.headerSection}>
              <ThemedText style={styles.title}>
                Save your preferred location
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter an address or landmark, or use your current location.
              </ThemedText>
            </View>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#EF4444"
                />
                <ThemedText style={styles.errorText}>
                  {errorMessage}
                </ThemedText>
              </View>
            )}

            {/* Quick GPS Action Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use my current GPS location"
              disabled={isLocating}
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.pressed,
                isLocating && styles.disabledAction,
              ]}
            >
              <View style={styles.actionIcon}>
                {isLocating ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="navigate"
                    size={22}
                    color="#FFFFFF"
                  />
                )}
              </View>

              <View style={styles.actionText}>
                <ThemedText style={styles.actionTitle}>
                  Use current location
                </ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  {isLocating
                    ? 'Acquiring GPS coordinates...'
                    : 'Fast, accurate auto-detection'}
                </ThemedText>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>
                OR ENTER AN ADDRESS
              </ThemedText>
              <View style={styles.dividerLine} />
            </View>

            {/* Address input */}
            <View style={styles.searchSection}>
              <View style={styles.addressInputBox}>
                <TextInput
                  value={query || effectiveManualAddress || ''}
                  onChangeText={handleQueryChange}
                  placeholder="Enter an address or landmark"
                  placeholderTextColor="#94A3B8"
                  style={styles.addressInput}
                  accessibilityLabel="Preferred address or landmark"
                  autoComplete="off"
                  autoCorrect={false}
                  spellCheck={false}
                />

                {!!(query || effectiveManualAddress) && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear address search"
                    onPress={clearSelection}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLOR_TEXT_MUTED}
                    />
                  </Pressable>
                )}
              </View>

              {isLoadingPredictions && (
                <View style={styles.loadingPredictions}>
                  <ActivityIndicator
                    size="small"
                    color={PRIMARY_COLOR}
                  />
                  <ThemedText style={styles.loadingText}>
                    Searching locations...
                  </ThemedText>
                </View>
              )}

              {isLoadingPlaceDetails && (
                <View style={styles.loadingPredictions}>
                  <ActivityIndicator
                    size="small"
                    color={PRIMARY_COLOR}
                  />
                  <ThemedText style={styles.loadingText}>
                    Loading selected address...
                  </ThemedText>
                </View>
              )}

              {predictions.length > 0 && (
                <View style={styles.predictionsContainer}>
                  <FlatList
                    data={predictions}
                    keyExtractor={(item) => item.placeId}
                    scrollEnabled={false}
                    renderItem={({
                      item,
                    }: ListRenderItemInfo<PlacePrediction>) => (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          void handleSelectPrediction(item);
                        }}
                        style={({ pressed }) => pressed && styles.pressed}
                      >
                        <View style={styles.predictionItemSimple}>
                          <ThemedText style={styles.predictionMain} numberOfLines={1}>
                            {item.structuredFormatting.mainText}
                          </ThemedText>
                          {!!item.structuredFormatting.secondaryText && (
                            <ThemedText
                              style={styles.predictionSecondary}
                              numberOfLines={1}
                            >
                              {item.structuredFormatting.secondaryText}
                            </ThemedText>
                          )}
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              )}

              {query.trim().length >= 2 &&
                !isLoadingPredictions &&
                !isLoadingPlaceDetails &&
                predictions.length === 0 &&
                !selectedPlace &&
                !effectiveManualAddress &&
                !errorMessage && (
                  <View style={styles.noResults}>
                    <ThemedText style={styles.emptySubtitle}>
                      Location not found. You can still save this address.
                    </ThemedText>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Save "${query}" as your location`}
                      onPress={() => saveManualAddress(query)}
                      style={styles.saveAddressBtn}
                    >
                      <Ionicons
                        name="location"
                        size={16}
                        color={PRIMARY_COLOR}
                      />
                      <ThemedText style={styles.saveAddressBtnText}>
                        Use {query.length > 28 ? query.slice(0, 25) + '...' : query}
                      </ThemedText>
                    </Pressable>
                  </View>
                )}

              {/* Saved manual address (no Google suggestion selected) */}
              {effectiveManualAddress && !selectedPlace && (
                <View style={styles.manualAddressCard}>
                  <View style={styles.manualAddressIcon}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={PRIMARY_COLOR}
                    />
                  </View>
                  <View style={styles.manualAddressText}>
                    <ThemedText style={styles.manualAddressLabel}>
                      SAVED ADDRESS
                    </ThemedText>
                    <ThemedText style={styles.manualAddressValue} numberOfLines={2}>
                      {effectiveManualAddress}
                    </ThemedText>
                    <ThemedText style={styles.manualAddressNote}>
                      Saved as typed. No coordinates are attached, so nearby
                      discovery uses text matching.
                    </ThemedText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove saved address"
                    onPress={clearSelection}
                    style={styles.clearSelection}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={COLOR_TEXT_MUTED}
                    />
                  </Pressable>
                </View>
              )}

              {/* Selected Address Card */}
              {selectedPlace && (
                <View style={styles.selectedAddressCard}>
                  <View style={styles.selectedIconWrapper}>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.selectedAddressText}>
                    <ThemedText style={styles.selectedAddressLabel}>
                      SELECTED LOCATION
                    </ThemedText>

                    <ThemedText style={styles.selectedAddressValue}>
                      {selectedPlace.mainText}
                    </ThemedText>

                    {!!selectedPlace.secondaryText && (
                      <ThemedText
                        style={styles.selectedAddressSecondary}
                      >
                        {selectedPlace.secondaryText}
                      </ThemedText>
                    )}

                    <View style={styles.addressDetails}>
                      {(selectedPlace.addressComponents.street_number ||
                        selectedPlace.addressComponents.route) && (
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>
                            Street
                          </ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {[
                              selectedPlace.addressComponents.street_number,
                              selectedPlace.addressComponents.route,
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          </ThemedText>
                        </View>
                      )}

                      {selectedPlace.addressComponents
                        .sublocality_level_1 && (
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>
                            Community
                          </ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {
                              selectedPlace.addressComponents
                                .sublocality_level_1
                            }
                          </ThemedText>
                        </View>
                      )}

                      {selectedPlace.addressComponents.neighborhood &&
                        !selectedPlace.addressComponents
                          .sublocality_level_1 && (
                          <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>
                              Neighborhood
                            </ThemedText>
                            <ThemedText style={styles.detailValue}>
                              {
                                selectedPlace.addressComponents
                                  .neighborhood
                              }
                            </ThemedText>
                          </View>
                        )}

                      {selectedPlace.addressComponents.locality && (
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>
                            City
                          </ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {selectedPlace.addressComponents.locality}
                          </ThemedText>
                        </View>
                      )}

                      {selectedPlace.addressComponents
                        .administrative_area_level_1 && (
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>
                            State
                          </ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {
                              selectedPlace.addressComponents
                                .administrative_area_level_1
                            }
                          </ThemedText>
                        </View>
                      )}

                      {selectedPlace.addressComponents.country && (
                        <View style={styles.detailRow}>
                          <ThemedText style={styles.detailLabel}>
                            Country
                          </ThemedText>
                          <ThemedText style={styles.detailValue}>
                            {selectedPlace.addressComponents.country}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear selected address"
                    onPress={clearSelection}
                    style={styles.clearSelection}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={COLOR_TEXT_MUTED}
                    />
                  </Pressable>
                </View>
              )}

              {/* Auto-detected current location suggestion */}
              {hasAutoDetected &&
                customerLocation?.gps &&
                !selectedPlace &&
                hasValidCoordinates(customerLocation.gps) && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Use detected current location"
                    onPress={confirmAutoDetectedLocation}
                    style={styles.suggestionItem}
                  >
                    <Ionicons
                      name="locate"
                      size={18}
                      color={PRIMARY_COLOR}
                      style={styles.suggestionIcon}
                    />
                    <View style={styles.suggestionTextWrap}>
                      <ThemedText style={styles.suggestionMainText} numberOfLines={1}>
                        {customerLocation.label ||
                          customerLocation.serviceArea?.name ||
                          'Current location'}
                      </ThemedText>
                      <ThemedText style={styles.suggestionSecondaryText} numberOfLines={1}>
                        {customerLocation.address?.formattedAddress ||
                          customerLocation.serviceArea?.name ||
                          'Detected from your device'}
                      </ThemedText>
                    </View>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={PRIMARY_COLOR}
                    />
                  </Pressable>
                )}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footerContainer}>
            <Pressable
              accessibilityRole="button"
              onPress={handleContinue}
              disabled={
                isLocating ||
                isLoadingPlaceDetails ||
                !hasSelection
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                (isLocating || isLoadingPlaceDetails || !hasSelection) &&
                  styles.disabledButton,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>
                {isLocating
                  ? 'Detecting Location...'
                  : isLoadingPlaceDetails
                    ? 'Loading Address...'
                    : selectedPlace
                      ? 'Confirm Address'
                      : effectiveManualAddress
                        ? 'Confirm Address'
                        : hasAutoDetected
                          ? 'Confirm Current Location'
                          : 'Select an Address'}
              </ThemedText>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR_BG },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: COLOR_TEXT_MAIN },
  keyboardContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerSection: { marginBottom: 20 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: COLOR_TEXT_MAIN },
  subtitle: { fontSize: 14, lineHeight: 20, color: COLOR_TEXT_MUTED, marginTop: 6 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '600' },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: PRIMARY_COLOR,
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  actionSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  disabledAction: { opacity: 0.7 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLOR_BORDER },
  dividerText: { fontSize: 11, fontWeight: '800', color: COLOR_TEXT_MUTED, letterSpacing: 1 },
  searchSection: { gap: 12 },
  addressInputBox: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_CARD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  addressInput: { flex: 1, fontSize: 16, color: COLOR_TEXT_MAIN, paddingVertical: 0, fontWeight: '500' },
  loadingPredictions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  loadingText: { fontSize: 13, color: COLOR_TEXT_MUTED, fontWeight: '600' },
  predictionsContainer: {
    marginTop: 4,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  predictionItemSimple: {
    paddingVertical: 8,
  },
  predictionMain: { fontSize: 14, fontWeight: '600', color: COLOR_TEXT_MAIN },
  predictionSecondary: { fontSize: 12, color: COLOR_TEXT_MUTED, fontWeight: '500', marginTop: 2 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    marginTop: 12,
    gap: 12,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextWrap: { flex: 1, gap: 2 },
  suggestionMainText: { fontSize: 14, fontWeight: '700', color: COLOR_TEXT_MAIN },
  suggestionSecondaryText: { fontSize: 12, color: COLOR_TEXT_MUTED, fontWeight: '500' },
  noResults: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  emptySubtitle: { fontSize: 13, color: COLOR_TEXT_MUTED, textAlign: 'left', lineHeight: 20 },
  saveAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLOR_CARD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
  },
  saveAddressBtnText: { fontSize: 13, fontWeight: '700', color: PRIMARY_COLOR },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  selectedAddressText: { flex: 1, gap: 2 },
  selectedAddressLabel: { fontSize: 10, fontWeight: '800', color: PRIMARY_COLOR, letterSpacing: 0.8 },
  selectedAddressValue: { fontSize: 14, fontWeight: '700', color: COLOR_TEXT_MAIN },
  selectedAddressSecondary: { fontSize: 12, color: COLOR_TEXT_MUTED, fontWeight: '500' },
  addressDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(12, 129, 119, 0.2)',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: { fontSize: 11, fontWeight: '700', color: COLOR_TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 12, fontWeight: '600', color: COLOR_TEXT_MAIN, textAlign: 'right', flex: 1, marginLeft: 8 },
  clearSelection: { padding: 4, marginLeft: 8 },
  manualAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  manualAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  manualAddressText: { flex: 1, gap: 3 },
  manualAddressLabel: { fontSize: 10, fontWeight: '800', color: '#B45309', letterSpacing: 0.8 },
  manualAddressValue: { fontSize: 14, fontWeight: '700', color: COLOR_TEXT_MAIN },
  manualAddressNote: { fontSize: 11, color: '#92400E', lineHeight: 16 },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLOR_BG,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
  },
  primaryButton: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
