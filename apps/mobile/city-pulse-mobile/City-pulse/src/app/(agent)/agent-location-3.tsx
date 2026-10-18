import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/state/app-state';
import { getAutomaticLocation } from '@/utils/location';
import { OGUN_LOCAL_GOVERNMENTS } from '@/utils/agent-onboarding';

const COLOR_PRIMARY = '#129E9E';
const COLOR_PRIMARY_LIGHT = '#D8F7F0';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_NOTE_BG = '#E8F6F6';
const COLOR_NOTE_BORDER = '#B2E2E2';
const COLOR_NOTE_TEXT = '#0C6E66';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';
// Sanitization Helper
function sanitizeInput(text: string): string {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

export default function AgentLocationScreen() {
  const { agentDraft, updateAgentDraft } = useAppState();

  const [localGovernment, setLocalGovernment] = useState(
    OGUN_LOCAL_GOVERNMENTS.find((item) => item === agentDraft.localGovernment) || '',
  );
  const [area, setArea] = useState(agentDraft.area || '');
  const [address, setAddress] = useState(agentDraft.address || '');
  const [isLgaPickerOpen, setIsLgaPickerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    streetName?: string;
    community?: string;
  } | null>(() => (
    agentDraft.latitude !== undefined && agentDraft.longitude !== undefined
      ? {
          latitude: agentDraft.latitude,
          longitude: agentDraft.longitude,
          accuracy: agentDraft.accuracy,
          streetName: agentDraft.address,
          community: agentDraft.area,
        }
      : null
  ));
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field Validations
  const cleanedArea = useMemo(() => sanitizeInput(area), [area]);
  const cleanedAddress = useMemo(() => sanitizeInput(address), [address]);

  const areaError = useMemo(() => {
    if (!touchedFields.area && area.length === 0) return null;
    if (cleanedArea.length < 2) return 'Area or neighborhood name must be at least 2 characters.';
    return null;
  }, [area, cleanedArea, touchedFields.area]);

  const addressError = useMemo(() => {
    if (!touchedFields.address && address.length === 0) return null;
    if (cleanedAddress.length < 5) return 'Street address or landmark must be at least 5 characters.';
    return null;
  }, [address, cleanedAddress, touchedFields.address]);

  const localGovernmentError = touchedFields.localGovernment && !localGovernment
    ? 'Select your local government area.'
    : null;

  const canContinue =
    Boolean(localGovernment) &&
    cleanedArea.length >= 2 &&
    cleanedAddress.length >= 5 &&
    !areaError &&
    !addressError;

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Navigation & Persistence Handler
  const handleNext = useCallback(async () => {
    setTouchedFields({ localGovernment: true, area: true, address: true });
    setErrorMessage(null);

    if (!canContinue || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Persist location details into App State Draft
      updateAgentDraft({
        localGovernment,
        area: cleanedArea,
        address: cleanedAddress,
        source: agentDraft.latitude !== undefined && agentDraft.longitude !== undefined && agentDraft.source === 'gps'
          ? 'gps'
          : 'manual',
      });

      // Navigate securely to Step 4
      router.push('/agent-details-4');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save location details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canContinue, isSubmitting, cleanedArea, cleanedAddress, localGovernment, updateAgentDraft, agentDraft.latitude, agentDraft.longitude, agentDraft.source]);

  const switchToManualEntry = useCallback(() => {
    setCurrentCoords(null);
    updateAgentDraft({
      latitude: undefined,
      longitude: undefined,
      accuracy: undefined,
      source: 'manual',
    });
  }, [updateAgentDraft]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      setErrorMessage(null);

      const location = await getAutomaticLocation();
      const detectedState = location.address?.administrativeArea?.trim().toLowerCase();
      if (detectedState && !detectedState.includes('ogun')) {
        switchToManualEntry();
        setErrorMessage(
          'This GPS location appears to be outside Ogun State. Enter the service address manually, or use GPS while at the service location in Ogun State.',
        );
        return;
      }

      const communityName = location.address?.community || location.serviceArea?.name || location.label;
      const streetName = location.address?.streetName || '';

      setArea(communityName);
      setAddress(streetName);
      setCurrentCoords({
        latitude: location.gps?.latitude ?? 0,
        longitude: location.gps?.longitude ?? 0,
        accuracy: location.gps?.accuracy,
        streetName,
        community: communityName,
      });
      updateAgentDraft({
        area: communityName,
        address: streetName,
        latitude: location.gps?.latitude,
        longitude: location.gps?.longitude,
        accuracy: location.gps?.accuracy,
        source: 'gps',
      });

      // Check accuracy and warn if low
      if (location.gps?.accuracy && location.gps.accuracy > 50) {
        setErrorMessage(`GPS accuracy is ±${Math.round(location.gps.accuracy)}m. Location still recorded but may affect distance calculations.`);
      }
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('permission') || message.includes('not granted')) {
        Alert.alert(
          'Location Permission Required',
          'City Pulse needs your location to auto-fill your service area. You can also enter your area manually below.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', style: 'default', onPress: () => Linking.openSettings() },
          ],
        );
      } else if (message.includes('disabled')) {
        Alert.alert(
          'Location Services Disabled',
          'Location services are turned off on your device. Please enable them to auto-detect your area, or enter it manually.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', style: 'default', onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        setErrorMessage(message || 'Unable to determine your current location. Please try again or enter manually.');
      }
    } finally {
      setIsLocating(false);
    }
  }, [switchToManualEntry, updateAgentDraft]);

  const handleRemoveGPS = switchToManualEntry;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Top Bar Header */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (router.canGoBack()) router.back();
              }}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
            </Pressable>
            <ThemedText style={styles.topBarTitle}>Your Location</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step Progress Indicator (Step 3 of 6) */}
            <View style={styles.stepContainer}>
              <ThemedText style={styles.stepBadgeText}>STEP 3 OF 6</ThemedText>
              <View style={styles.stepTrack}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
              </View>
            </View>

            {/* Dynamic Header */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Where is your service?</ThemedText>
              <ThemedText style={styles.description}>
                Set your service location in Ogun State. Enter it yourself, or use GPS only when you are at the service location.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* GPS Location Display — at top, plain text + icon, no card */}
            {currentCoords && (
              <View style={styles.gpsDisplayRow}>
                <Ionicons name="locate-outline" size={16} color={COLOR_PRIMARY} />
                <View style={styles.gpsDisplayText}>
                  {currentCoords.streetName && currentCoords.community ? (
                    <ThemedText style={styles.gpsDisplayName}>
                      {currentCoords.streetName}, {currentCoords.community}
                    </ThemedText>
                  ) : currentCoords.community ? (
                    <ThemedText style={styles.gpsDisplayName}>{currentCoords.community}</ThemedText>
                  ) : (
                    <ThemedText style={styles.gpsDisplayName}>Current location</ThemedText>
                  )}
                  <ThemedText style={styles.gpsDisplayCoords}>
                    {currentCoords.latitude.toFixed(6)}°, {currentCoords.longitude.toFixed(6)}°
                    {currentCoords.accuracy ? ` (±${Math.round(currentCoords.accuracy)}m)` : ''}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove GPS location"
                  onPress={handleRemoveGPS}
                  style={({ pressed }) => [styles.removeGpsBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="close-circle" size={16} color={COLOR_TEXT_MUTED} />
                </Pressable>
              </View>
            )}

            {/* GPS Advisory Note */}
            <View style={styles.advisoryBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLOR_NOTE_TEXT} />
              <ThemedText style={styles.advisoryText}>
                Manual entry works without GPS. Only use GPS if this device is physically at your service location; otherwise enter the service address below. GPS coordinates enable distance calculations and directions.
              </ThemedText>
            </View>

            {/* Input Form Controls */}
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>STATE</ThemedText>
                <View style={[styles.input, styles.fixedInput]}>
                  <ThemedText style={styles.fixedInputText}>Ogun State</ThemedText>
                  <Ionicons name="lock-closed-outline" size={16} color={COLOR_TEXT_MUTED} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>LOCAL GOVERNMENT AREA</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select local government area"
                  accessibilityState={{ expanded: isLgaPickerOpen }}
                  onPress={() => setIsLgaPickerOpen(true)}
                  style={[styles.input, styles.selectInput, localGovernmentError ? styles.inputError : null]}
                >
                  <ThemedText style={localGovernment ? styles.fixedInputText : styles.placeholderText}>
                    {localGovernment || 'Select your local government'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color={COLOR_TEXT_MUTED} />
                </Pressable>
                {localGovernmentError && (
                  <ThemedText style={styles.fieldErrorText}>{localGovernmentError}</ThemedText>
                )}
              </View>

              {/* GPS Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use my current GPS location"
                disabled={isLocating}
                onPress={handleUseCurrentLocation}
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed && styles.pressed,
                  isLocating && styles.disabledButton,
                ]}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={COLOR_PRIMARY} />
                ) : (
                  <Ionicons name="locate-outline" size={18} color={COLOR_PRIMARY} />
                )}
                <ThemedText style={styles.locationButtonText}>
                  {isLocating ? 'Finding your location...' : 'Use current GPS location'}
                </ThemedText>
              </Pressable>
              {!currentCoords && (
                <ThemedText style={styles.manualHint}>
                  Or continue with the manual address fields below. No coordinates are required.
                </ThemedText>
              )}

              {/* Area / Neighborhood Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>AREA / NEIGHBORHOOD</ThemedText>
                <TextInput
                  value={area}
                  onChangeText={(val) => {
                    if (currentCoords) switchToManualEntry();
                    setArea(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => markTouched('area')}
                  placeholder="e.g. Ibara, Kuto, or Oke-Ilewo"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={60}
                  style={[
                    styles.input,
                    touchedFields.area && areaError ? styles.inputError : null,
                  ]}
                />
                {touchedFields.area && areaError && (
                  <ThemedText style={styles.fieldErrorText}>{areaError}</ThemedText>
                )}
              </View>

              {/* Street Address & Landmarks Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>STREET ADDRESS & LANDMARKS</ThemedText>
                <TextInput
                  value={address}
                  onChangeText={(val) => {
                    if (currentCoords) switchToManualEntry();
                    setAddress(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => markTouched('address')}
                  placeholder="e.g. Opposite Kuto Market, Ibara"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={120}
                  style={[
                    styles.input,
                    touchedFields.address && addressError ? styles.inputError : null,
                  ]}
                />
                {touchedFields.address && addressError && (
                  <ThemedText style={styles.fieldErrorText}>{addressError}</ThemedText>
                )}
              </View>
            </View>
          </ScrollView>

          <Modal
            visible={isLgaPickerOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsLgaPickerOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <ThemedText style={styles.pickerTitle}>Choose a local government</ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close local government selector"
                    onPress={() => setIsLgaPickerOpen(false)}
                    style={styles.pickerClose}
                  >
                    <Ionicons name="close" size={22} color={COLOR_TEXT_MAIN} />
                  </Pressable>
                </View>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {OGUN_LOCAL_GOVERNMENTS.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: localGovernment === item }}
                      key={item}
                      onPress={() => {
                        if (currentCoords) switchToManualEntry();
                        setLocalGovernment(item);
                        setTouchedFields((prev) => ({ ...prev, localGovernment: true }));
                        updateAgentDraft({ localGovernment: item });
                        setIsLgaPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.pickerOption,
                        localGovernment === item && styles.pickerOptionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText style={styles.pickerOptionText}>{item}</ThemedText>
                      {localGovernment === item && (
                        <Ionicons name="checkmark" size={19} color={COLOR_PRIMARY} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Action Footer Button */}
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!canContinue || isSubmitting}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canContinue || isSubmitting) && styles.disabledButton,
                pressed && canContinue && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText style={styles.primaryText}>Continue to Service Details</ThemedText>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOR_BG,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  keyboardContainer: {
    flex: 1,
  },

  /* Navigation Header */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },

  /* Scroll Body */
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 24,
  },

  /* Progress Bar */
  stepContainer: {
    marginBottom: 20,
    gap: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLOR_PRIMARY,
    letterSpacing: 0.5,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLOR_BORDER,
  },
  stepBarActive: {
    backgroundColor: COLOR_PRIMARY,
  },

  /* Section Header */
  headerGroup: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLOR_TEXT_MUTED,
    marginTop: 8,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR_DANGER_BG,
    borderWidth: 1,
    borderColor: COLOR_DANGER_BORDER,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLOR_DANGER_TEXT,
    fontWeight: '600',
  },

  /* GPS Display Row — at top, plain text + icon, no card */
  gpsDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  gpsDisplayText: {
    flex: 1,
  },
  gpsDisplayName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLOR_TEXT_MAIN,
  },
  gpsDisplayCoords: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: COLOR_TEXT_MUTED,
    marginTop: 2,
  },
  removeGpsBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Advisory Box */
  advisoryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLOR_NOTE_BG,
    borderWidth: 1,
    borderColor: COLOR_NOTE_BORDER,
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  advisoryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_NOTE_TEXT,
    fontWeight: '500',
  },

  /* Inputs & Form Styling */
  formGroup: {
    gap: 18,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  input: {
    height: 50,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '500',
  },
  fixedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  fixedInputText: {
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '500',
  },
  placeholderText: {
    color: COLOR_TEXT_MUTED,
    fontSize: 15,
    fontWeight: '500',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualHint: {
    color: COLOR_TEXT_MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  pickerSheet: {
    maxHeight: '75%',
    backgroundColor: COLOR_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  pickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_CARD,
  },
  pickerOption: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerOptionSelected: {
    backgroundColor: COLOR_PRIMARY_LIGHT,
  },
  pickerOptionText: {
    fontSize: 15,
    color: COLOR_TEXT_MAIN,
  },
  inputError: {
    borderColor: COLOR_DANGER_TEXT,
    backgroundColor: COLOR_DANGER_BG,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR_DANGER_TEXT,
    marginTop: 2,
  },
  locationButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY,
    backgroundColor: COLOR_PRIMARY_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationButtonText: {
    color: COLOR_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Footer Action Group */
  actionGroup: {
    paddingVertical: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
