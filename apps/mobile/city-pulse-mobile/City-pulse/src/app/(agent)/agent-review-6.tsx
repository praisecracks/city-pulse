import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORY_META, Category } from '@/data/product';
import { useAppState } from '@/state/app-state';
import { MOCK_API } from '@/utils/api-config';
import { ApiError, apiRequest, describeError } from '@/utils/api-client';
import { uploadListingPhotos } from '@/utils/listing-photos';

/**
 * A one-line human summary for the listing's `description`.
 *
 * This is deliberately a single line. `pulseToListing` maps `description` to the
 * listing's `detail` field by taking its first line only, and the detail screen
 * now renders the structured `details` blob directly — so everything of
 * substance lives in `details`, and packing it into the description meant the
 * delivery flag, the delivery charge, and the accepted cards were all silently
 * discarded on the way to the customer.
 */
function formatDetails(details: NonNullable<ReturnType<typeof useAppState>['agentDraft']['serviceDetails']>) {
  if ('feePer5000' in details) {
    return `N${details.feePer5000} withdrawal fee per N5,000`;
  }
  if ('menuItems' in details) {
    return `${details.menuItems.length} item${details.menuItems.length === 1 ? '' : 's'} on the menu`;
  }
  if ('pricePerKg' in details) {
    return `N${details.pricePerKg} per KG`;
  }
  return details.propertyTypes.join(', ');
}

/** Shown on the review screen so the provider can see what was captured. */
function formatDetailsForReview(details: NonNullable<ReturnType<typeof useAppState>['agentDraft']['serviceDetails']>) {
  if ('feePer5000' in details) {
    return `N${details.feePer5000} per N5,000 withdrawal${details.maxCashLimit ? `\nMaximum cash: N${details.maxCashLimit}` : ''}\nCards: ${details.acceptedCardBrands.join(', ') || 'None selected'}`;
  }
  if ('menuItems' in details) {
    return `${details.menuItems.map((item) => `${item.name}: N${item.price}`).join('\n')}\nWhatsApp ordering: ${details.whatsappOrderingEnabled ? 'Enabled' : 'Disabled'}\nHome delivery: ${details.homeDeliveryEnabled ? `Enabled${details.deliveryCharge ? ` (N${details.deliveryCharge})` : ''}` : 'Disabled'}`;
  }
  if ('pricePerKg' in details) {
    return `N${details.pricePerKg} per KG${details.pricePerCylinder ? `\n12.5 KG cylinder: N${details.pricePerCylinder}` : ''}\nHome delivery: ${details.homeDeliveryEnabled ? `Enabled${details.deliveryCharge ? ` (N${details.deliveryCharge})` : ''}` : 'Disabled'}`;
  }
  return `${details.propertyTypes.join(', ')}\nRent: N${details.rentRangeMin || 0} - N${details.rentRangeMax || 0} per year\nAreas: ${details.coveredAreas.join(', ')}`;
}

// Modern Design Tokens (Synced with Steps 1 - 5)
const COLOR_PRIMARY = '#129E9E';
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

export default function AgentReviewScreen() {
  const { agentDraft, token, updateUser, resetAgentDraft, user } = useAppState();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /**
   * Set when the server reports this account already has a listing. Rendering is
   * driven off this rather than off the error string, so the screen can offer a
   * real way forward instead of a message that dead-ends.
   */
  const [alreadyPublished, setAlreadyPublished] = useState(false);

  const category = (agentDraft.category as Category) || 'pos';
  const categoryMeta = CATEGORY_META[category] || { label: 'Service' };

  // Auto-navigate to the dashboard a moment after the "already submitted"
  // state is shown, so the user is not left staring at a summary card whose
  // fields were just wiped by resetAgentDraft.
  useEffect(() => {
    if (!alreadyPublished) return;
    const timer = setTimeout(() => {
      router.replace('/agent-dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [alreadyPublished]);

  // Final Registration Submission Handler
  const handleSubmit = useCallback(async () => {
    setErrorMessage(null);
    setAlreadyPublished(false);

    try {
      setIsSubmitting(true);

      if (!agentDraft.category || !agentDraft.businessName || !agentDraft.phone || !agentDraft.localGovernment || !agentDraft.area || !agentDraft.address || !agentDraft.serviceDetails) {
        throw new Error('Please complete all required listing details before submitting.');
      }

      if (!agentDraft.photos?.length) {
        throw new Error('Please add at least one photo so customers can recognise your place.');
      }

      if (
        agentDraft.latitude !== undefined &&
        agentDraft.longitude !== undefined &&
        (!Number.isFinite(agentDraft.latitude) || !Number.isFinite(agentDraft.longitude) ||
          agentDraft.latitude < -90 || agentDraft.latitude > 90 ||
          agentDraft.longitude < -180 || agentDraft.longitude > 180)
      ) {
        throw new Error('GPS coordinates are invalid. Please re-capture your location.');
      }

      if (!MOCK_API) {
        // Photos go up first as multipart, then the listing is created as small
        // JSON that only references the returned paths. A failed second step can
        // be retried without re-sending the image bytes.
        const uploaded = await uploadListingPhotos(agentDraft.photos, token);
        const images = agentDraft.photos.map((photo, index) => ({
          path: uploaded[index]?.path || '',
          caption: photo.caption,
          isCover: index === 0,
        }));

        const missingImage = images.findIndex((image) => !image.path);
        if (missingImage !== -1) {
          throw new Error('One of your photos failed to upload. Please check your connection and retry.');
        }

        let payload: { roles?: unknown };
        try {
          payload = await apiRequest<{ roles?: unknown }>('/pulses', {
            method: 'POST',
            token,
            body: {
              title: agentDraft.businessName,
              description: formatDetails(agentDraft.serviceDetails),
              location: `${agentDraft.area}, ${agentDraft.localGovernment}, Ogun State`,
              localGovernment: agentDraft.localGovernment,
              address: agentDraft.address,
              category: agentDraft.category,
              contactPhone: agentDraft.phone,
              email: agentDraft.email,
              whatsapp: agentDraft.whatsapp,
              latitude: agentDraft.latitude,
              longitude: agentDraft.longitude,
              accuracy: agentDraft.accuracy,
              source: agentDraft.source || (agentDraft.latitude ? 'gps' : 'manual'),
              details: agentDraft.serviceDetails,
              images,
            },
          });
        } catch (error) {
          // A 409 means this account already has a live listing — the
          // registration is finished, not broken. Retrying is impossible (the
          // unique index will reject every attempt), so the only useful thing to
          // do is stop asking them to submit and take them where their listing
          // actually is. Throwing a plain error here left the user on a page
          // telling them to open a dashboard they had no way to reach.
          if (error instanceof ApiError && error.status === 409) {
            // Mirror the success path: adopt the roles the server already granted
            // and clear the draft, so a reload can no longer interpret this
            // finished registration as an in-progress one.
            updateUser({ roles: [...new Set([...(user?.roles ?? []), 'agent'])] });
            resetAgentDraft();
            setAlreadyPublished(true);
            return;
          }
          throw error;
        }

        if (Array.isArray(payload.roles)) {
          updateUser({ roles: payload.roles });
        }
      } else {
        // Mock mode skips the API call entirely, so grant the "agent" role here
        // to match the real flow. Without this, the routing logic treats the
        // user as a customer after the success page auto-navigates to the
        // dashboard, and a reload sends them back to /home-discover.
        if (user && !user.roles?.includes('agent')) {
          updateUser({ roles: [...(user.roles ?? []), 'agent'] });
        }
      }

      // Navigate to completion success screen — pass the business name so the
      // success page can display it even after the draft is cleared.
      const businessName = encodeURIComponent(agentDraft.businessName || '');
      router.replace(`/agent-success?businessName=${businessName}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError
          ? describeError(err, 'Failed to submit registration. Please try again.')
          : err instanceof TypeError
            ? "You're offline. Check your connection and try again."
            : err instanceof Error
              ? err.message
              : 'Failed to submit registration. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [agentDraft, token, updateUser, resetAgentDraft, user]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar Navigation */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            // After a reload there is no navigation history, so `router.back()`
            // silently does nothing and the user has no way out of this screen at
            // all. Falling back to the photos step keeps them in the onboarding
            // flow where they can review and edit before submitting.
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/agent-photos-5');
              }
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>
          <ThemedText style={styles.topBarTitle}>Verify and Submit</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!alreadyPublished && (
            <>
          {/* Step Progress Bar (Step 6 of 6) */}
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepBadgeText}>STEP 6 OF 6</ThemedText>
            <View style={styles.stepTrack}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
            </View>
          </View>

          {/* Section Header */}
          <View style={styles.headerGroup}>
            <ThemedText style={styles.title}>Confirm your details.</ThemedText>
            <ThemedText style={styles.description}>
              Review your information before submitting it for admin verification.
            </ThemedText>
          </View>

          {/* Error Alert */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </View>
          )}

          {/* Verification Card */}
          <View style={styles.summaryCard}>
            {/* Category Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.label}>CATEGORY</ThemedText>
                <ThemedText style={styles.value}>{categoryMeta.label}</ThemedText>
              </View>
              <Pressable
                disabled={isSubmitting}
                onPress={() => router.push('/agent-registration-1')}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.editBtnText}>Edit</ThemedText>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Business & Contact Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.label}>BUSINESS / AGENCY NAME</ThemedText>
                <ThemedText style={styles.value}>
                  {agentDraft.businessName || 'Not specified'}
                </ThemedText>

                <ThemedText style={[styles.label, styles.subLabel]}>CONTACT PHONE</ThemedText>
                <ThemedText style={styles.value}>
                  {agentDraft.phone || 'Not specified'}
                </ThemedText>
                {agentDraft.email && <>
                  <ThemedText style={[styles.label, styles.subLabel]}>EMAIL</ThemedText>
                  <ThemedText style={styles.value}>{agentDraft.email}</ThemedText>
                </>}
                {agentDraft.whatsapp && <>
                  <ThemedText style={[styles.label, styles.subLabel]}>WHATSAPP</ThemedText>
                  <ThemedText style={styles.value}>{agentDraft.whatsapp}</ThemedText>
                </>}
              </View>
              <Pressable
                disabled={isSubmitting}
                onPress={() => router.push('/agent-provider-info-2')}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.editBtnText}>Edit</ThemedText>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Location Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.label}>AREA / NEIGHBORHOOD</ThemedText>
                <ThemedText style={styles.value}>{agentDraft.area || 'Not specified'}</ThemedText>
                <ThemedText style={styles.label}>LOCAL GOVERNMENT · STATE</ThemedText>
                <ThemedText style={styles.value}>
                  {agentDraft.localGovernment ? `${agentDraft.localGovernment}, Ogun State` : 'Not specified'}
                </ThemedText>

                <ThemedText style={[styles.label, styles.subLabel]}>STREET ADDRESS</ThemedText>
                <ThemedText style={styles.value}>{agentDraft.address || 'Not specified'}</ThemedText>

                <ThemedText style={[styles.label, styles.subLabel]}>LOCATION SOURCE</ThemedText>
                <ThemedText style={styles.value}>
                  {agentDraft.source === 'gps'
                    ? 'GPS'
                    : 'Manual Entry'}
                </ThemedText>

                {agentDraft.latitude !== undefined &&
                  agentDraft.longitude !== undefined &&
                  Number.isFinite(agentDraft.latitude) &&
                  Number.isFinite(agentDraft.longitude) && (
                  <ThemedText style={[styles.label, styles.subLabel]}>COORDINATES</ThemedText>
                )}
                {agentDraft.latitude !== undefined &&
                  agentDraft.longitude !== undefined &&
                  Number.isFinite(agentDraft.latitude) &&
                  Number.isFinite(agentDraft.longitude) && (
                  <ThemedText style={styles.value}>
                    {agentDraft.latitude.toFixed(6)}°, {agentDraft.longitude.toFixed(6)}°
                    {agentDraft.accuracy ? ` (±${Math.round(agentDraft.accuracy)}m)` : ''}
                  </ThemedText>
                )}
              </View>
              <Pressable
                disabled={isSubmitting}
                onPress={() => router.push('/agent-location-3')}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.editBtnText}>Edit</ThemedText>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Service Details Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.label}>SERVICE DETAILS</ThemedText>
                <ThemedText style={styles.valueMultiline}>
                  {agentDraft.serviceDetails ? formatDetailsForReview(agentDraft.serviceDetails) : 'No details provided'}
                </ThemedText>
              </View>
              <Pressable
                disabled={isSubmitting}
                onPress={() => router.push('/agent-details-4')}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.editBtnText}>Edit</ThemedText>
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Photos Section */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.label}>
                  PHOTOS ({agentDraft.photos?.length || 0})
                </ThemedText>

                {agentDraft.photos?.length ? (
                  <View style={styles.photoStrip}>
                    {agentDraft.photos.map((photo, index) => (
                      <View key={photo.id} style={styles.photoCell}>
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.photoThumb}
                          contentFit="cover"
                          transition={150}
                          cachePolicy="memory-disk"
                        />
                        {index === 0 && (
                          <View style={styles.coverTag}>
                            <ThemedText style={styles.coverTagText}>COVER</ThemedText>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText style={styles.value}>No photos added</ThemedText>
                )}
              </View>
              <Pressable
                disabled={isSubmitting}
                onPress={() => router.push('/agent-photos-5')}
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <ThemedText style={styles.editBtnText}>Edit</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Listing Status Note Box */}
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLOR_NOTE_TEXT} />
            <ThemedText style={styles.noteText}>
              Your listing will start as <ThemedText style={styles.boldNoteText}>Unconfirmed</ThemedText> until your first real-time availability update.
            </ThemedText>
          </View>
          </>
          )}

          {alreadyPublished && (
            <View style={styles.alreadyPublishedCard}>
              <Ionicons name="checkmark-circle" size={40} color={COLOR_NOTE_TEXT} />
              <ThemedText style={styles.alreadyPublishedTitle}>
                Your listing is already submitted
              </ThemedText>
              <ThemedText style={styles.alreadyPublishedBody}>
                There is nothing left to submit. Manage, edit, or update your live listing from your
                dashboard.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/agent-dashboard')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <ThemedText style={styles.primaryText} numberOfLines={1}>
                  Go to my dashboard
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Action Footer — only shown when the listing has not already been published */}
        {!alreadyPublished && (
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                isSubmitting && styles.disabledButton,
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText style={styles.primaryText}>Submit for Verification</ThemedText>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        )}
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

  /* Top Navigation Bar */
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

  /* Scroll Content */
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

  /* Header Group */
  headerGroup: {
    marginBottom: 20,
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

  /* Summary Card */
  summaryCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
  },
  alreadyPublishedCard: {
    backgroundColor: COLOR_NOTE_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_NOTE_BORDER,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    gap: 10,
  },
  alreadyPublishedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLOR_NOTE_TEXT,
    textAlign: 'center',
  },
  alreadyPublishedBody: {
    fontSize: 14,
    lineHeight: 20,
    color: COLOR_NOTE_TEXT,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  summaryContent: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  subLabel: {
    marginTop: 10,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: COLOR_TEXT_MAIN,
    marginTop: 3,
  },
  valueMultiline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: COLOR_TEXT_MAIN,
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: COLOR_BORDER,
    marginVertical: 12,
  },

  /* Photo Strip */
  photoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photoCell: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  coverTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
  },
  coverTagText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  /* Note Box */
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLOR_NOTE_BG,
    borderWidth: 1,
    borderColor: COLOR_NOTE_BORDER,
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_NOTE_TEXT,
    fontWeight: '500',
  },
  boldNoteText: {
    fontWeight: '700',
  },

  /* Footer Button */
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
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
