import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IncompleteListingNotice } from '@/components/incomplete-listing-notice';
import { AgentDashboardSkeleton } from '@/components/agent-dashboard-skeleton';
import {
  CATEGORY_META,
  Availability,
  STATUS_META,
} from '@/data/product';
import { useAppState } from '@/state/app-state';
import { useTheme } from '@/hooks/use-theme';
import { useMyListing } from '@/hooks/use-listings';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { getAgentResumePath } from '@/utils/agent-onboarding';
import { getFreshness } from '@/utils/listing-freshness';
import { PULSE_STATUS_BY_AVAILABILITY } from '@/utils/listing-sync';

const STATUS_OPTIONS: Exclude<Availability, 'unconfirmed'>[] = [
  'available',
  'low_supply',
  'unavailable',
];

const STATUS_DESCRIPTION: Record<
  'available' | 'low_supply' | 'unavailable',
  string
> = {
  available: 'Customers can currently find you as available.',
  low_supply: 'Let customers know supply is currently limited.',
  unavailable: 'Customers will see that you are currently unavailable.',
};

export default function AgentDashboardScreen() {
  const { agentDraft, user, token } = useAppState();
  const theme = useTheme();

  // The published listing is the source of truth. The onboarding draft is not
  // used for any of the values below: it is cleared on the success screen, its
  // photos are device-local cache URIs, and it does not exist on a second device.
  const { listing, isLoading, isSyncing, error, isOffline, refresh, setStatus, resubmit } = useMyListing(
    token,
    user?.id,
  );

  // Ticks so the freshness countdown is live instead of frozen at mount.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const category = listing?.category;
  const categoryMeta = category ? CATEGORY_META[category] : undefined;
  const currentStatus = STATUS_META[listing?.status ?? 'unconfirmed'];
  const isListingApproved =
    listing?.reviewStatus === undefined || listing.reviewStatus === 'approved';

  // The cover is the first photo because pulseToListing pins isCover first.
  const coverPhotoUri = listing?.photos?.[0]?.url;

  // Both of these are trivial string/date work driven by `now`, which changes
  // every 30 seconds anyway, so memoizing them would add bookkeeping without
  // saving any rendering.
  const freshness = getFreshness(listing?.updatedAt, now);

  const lastConfirmedLabel = (() => {
    if (!listing?.updatedAt) return null;
    const timestamp = Date.parse(listing.updatedAt);
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  })();

  const handleStatusChange = useCallback(
    async (next: 'available' | 'low_supply' | 'unavailable') => {
      await setStatus(PULSE_STATUS_BY_AVAILABILITY[next]);
    },
    [setStatus],
  );

  const handleResubmit = useCallback(async () => {
    const errorMessage = await resubmit();
    if (errorMessage) {
      Alert.alert('Unable to resubmit listing', errorMessage);
      return;
    }
    Alert.alert('Listing resubmitted', 'Your updated listing is back in the admin review queue.');
  }, [resubmit]);

  const isProvider = user?.roles?.includes('agent') ?? false;
  if (!isProvider) {
    return (
      <IncompleteListingNotice
        resumePath={getAgentResumePath(agentDraft) || '/agent-registration-1'}
        accent={theme.accent}
      />
    );
  }

  if (isLoading) {
    return <AgentDashboardSkeleton />;
  }

  // The account has the provider role but the API returned no listing. This is
  // not the normal path any more — the role is granted by publishing — so it
  // means the listing is missing or was removed, and the dashboard must not
  // invent a business card to fill the gap.
  if (!listing) {
    return (
         <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.noticeBlock}>
            <View style={[styles.noticeIcon, { backgroundColor: `${theme.accent}12` }]}>
              <Ionicons name="storefront-outline" size={26} color={theme.accent} />
            </View>
            <ThemedText style={[styles.noticeTitle, { color: theme.textBody }]}>
              {error ? "Couldn't load your listing" : 'No listing found'}
            </ThemedText>
            <ThemedText style={[styles.noticeBody, { color: theme.textSecondary }]}>
              {error
                ? error
                : 'There is no listing attached to your account. Submit a listing to complete provider setup.'}
            </ThemedText>

            {error ? (
              <Pressable
                onPress={refresh}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
              </Pressable>
            ) : (
              // A provider whose listing went missing some other way (a data
              // migration, a failed publish). Hiding no longer lands here,
              // because it leaves the listing in place.
              <Pressable
                onPress={() =>
                  router.push((getAgentResumePath(agentDraft) || '/agent-registration-1') as never)
                }
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <ThemedText style={styles.retryButtonText}>Publish a listing</ThemedText>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.replace('/home-discover')}
              style={({ pressed }) => [styles.retryGhost, pressed && styles.pressed]}
            >
              <ThemedText style={[styles.retryGhostText, { color: theme.accent }]}>
                Back to Discover
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoMark, { backgroundColor: '#0D8282' }]}>
              <Image
                source={require('@/assets/logo-mark.png')}
                style={styles.logoImage}
                contentFit="contain"
                accessibilityLabel="City Pulse logo"
              />
            </View>
            <View>
              <ThemedText style={[styles.headerEyebrow, { color: theme.textSecondary }]}>
                CITY PULSE
              </ThemedText>
              <ThemedText style={[styles.headerTitle, { color: theme.textBody }]}>
                Agent Dashboard
              </ThemedText>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.userAvatar, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Your profile"
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={18} color={theme.accent} />
              )}
            </Pressable>
          </View>
        </View>

        {isOffline && (
          <View style={[styles.offlineBanner, { backgroundColor: theme.warningBg }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.warningText} />
            <ThemedText style={[styles.offlineBannerText, { color: theme.warningText }]}>
              Showing cached data. Reconnect to sync.
            </ThemedText>
          </View>
        )}

        {(error && !isOffline && listing) && (
          <View style={[styles.offlineBanner, { backgroundColor: theme.dangerBg }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.dangerText} />
            <ThemedText style={[styles.offlineBannerText, { color: theme.dangerText }]}>
              {error}
            </ThemedText>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* WELCOME BLOCK */}
          <View style={styles.welcomeBlock}>
            <ThemedText style={[styles.welcomeTitle, { color: theme.textBody }]}>
              Store Operations
            </ThemedText>
            <ThemedText style={[styles.welcomeDescription, { color: theme.textSecondary }]}>
              {isListingApproved
                ? 'Keep your live feed updated so nearby customers can find stock instantly.'
                : 'Your listing is not public yet. We will make it discoverable after admin approval.'}
            </ThemedText>
          </View>

          {/* ACTIVE BUSINESS LISTING CARD WITH PHOTO PREVIEW */}
          <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>

            {/* Primary Photo Preview & Business Header Stack */}
            <View style={styles.listingTopRow}>
              {coverPhotoUri ? (
                <Image
                  source={{ uri: coverPhotoUri }}
                  style={styles.businessThumbnail}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.businessThumbnail, styles.businessThumbnailEmpty]}>
                  <Ionicons name="storefront-outline" size={22} color="#B7AFA1" />
                </View>
              )}
              <View style={styles.listingInfoCol}>
                <View style={styles.eyebrowRow}>
                  <ThemedText style={[styles.sectionEyebrow, { color: theme.textSecondary }]}>
                    {isListingApproved ? 'ACTIVE LISTING' : 'UNDER REVIEW'}
                  </ThemedText>
                  <View style={[styles.categoryBadge, { backgroundColor: `${theme.accent}12` }]}>
                    <ThemedText style={[styles.categoryBadgeText, { color: theme.accent }]}>
                      {categoryMeta?.label || 'Listing'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.businessName, { color: theme.textBody }]} numberOfLines={1}>
                  {listing.name}
                </ThemedText>

                {/* Location & Rate Preview Line */}
                <ThemedText style={[styles.previewLine, { color: theme.textSecondary }]} numberOfLines={1}>
                  {listing.area} • {listing.price}
                </ThemedText>
              </View>
            </View>

            {/* Trust and freshness are customer-facing signals, so show them only after approval. */}
            {isListingApproved && <View style={[styles.metaSubRow, { borderTopColor: '#F2EFE9' }]}>
              <View style={styles.metaBadge}>
                <Ionicons name="star" size={13} color="#E59A00" />
                <ThemedText style={[styles.metaText, { color: theme.textBody }]}>
                  {listing.trust.toFixed(1)} Trust Score
                </ThemedText>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaBadge}>
                <Ionicons
                  name={freshness?.isExpired ? 'alert-circle-outline' : 'time-outline'}
                  size={13}
                  color={freshness?.isExpired ? '#B4232C' : '#0D8282'}
                />
                <ThemedText
                  style={[
                    styles.metaText,
                    { color: freshness?.isExpired ? '#B4232C' : '#0D8282', fontWeight: '700' },
                  ]}
                >
                  {freshness?.label ?? 'Update your status to start the clock'}
                </ThemedText>
              </View>
            </View>}

            {isListingApproved ? (
            <>
            {/* CURRENT STATUS BANNER */}
            <View
              style={[
                styles.currentStatus,
                {
                  backgroundColor: currentStatus.background,
                  borderColor: `${currentStatus.color}25`,
                },
              ]}
            >
              <View style={styles.currentStatusLeft}>
                <View style={[styles.statusIndicator, { backgroundColor: currentStatus.color }]} />
                <View style={styles.currentStatusTextWrap}>
                  <ThemedText style={[styles.currentStatusLabel, { color: currentStatus.color }]}>
                    {currentStatus.label} {isSyncing && '(Syncing...)'}
                  </ThemedText>
                  <ThemedText style={[styles.currentStatusUpdated, { color: theme.textSecondary }]}>
                    {lastConfirmedLabel
                      ? `Confirmed at ${lastConfirmedLabel}`
                      : 'Tap an option below to update'}
                  </ThemedText>
                </View>
              </View>
              {isSyncing ? (
                <ActivityIndicator size="small" color={currentStatus.color} />
              ) : (
                <Ionicons name="radio-button-on" size={18} color={currentStatus.color} />
              )}
            </View>
            </>
            ) : (
              <View style={[styles.currentStatus, { backgroundColor: '#FFF7E8', borderColor: '#F1D9A8' }]}>
                <View style={styles.currentStatusLeft}>
                  <Ionicons name="time-outline" size={18} color="#946200" />
                  <View style={styles.currentStatusTextWrap}>
                    <ThemedText style={[styles.currentStatusLabel, { color: '#946200' }]}>
                      {listing.reviewStatus === 'rejected' ? 'Review required' : 'Pending admin review'}
                    </ThemedText>
                    <ThemedText style={[styles.currentStatusUpdated, { color: theme.textSecondary }]}>
                      {listing.reviewStatus === 'rejected'
                        ? `${listing.reviewNote || 'Update your listing details, then request another review.'} Your listing remains private until it is approved.`
                        : 'Unconfirmed is temporary while we review your listing. After approval, customers can find you and you can set your availability here.'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>

          {listing.reviewStatus === 'rejected' && (
            <Pressable
              accessibilityRole="button"
              disabled={isSyncing}
              onPress={handleResubmit}
              style={({ pressed }) => [
                styles.resubmitButton,
                { backgroundColor: theme.accent, opacity: isSyncing ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {isSyncing ? <ActivityIndicator color="#FFFFFF" /> : (
                <ThemedText style={styles.resubmitButtonText}>Request review again</ThemedText>
              )}
            </Pressable>
          )}

          {isListingApproved && (
          <>
          {/* AVAILABILITY CONTROL SECTION */}
          <View style={styles.controlHeader}>
            <ThemedText style={[styles.controlTitle, { color: theme.textBody }]}>
              Broadcast Status
            </ThemedText>
            <View style={[styles.livePill, { backgroundColor: `${theme.accent}12` }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
              <ThemedText style={[styles.liveText, { color: theme.accent }]}>LIVE FEED</ThemedText>
            </View>
          </View>

          <View style={styles.statusStack}>
            {STATUS_OPTIONS.map((key) => {
              const meta = STATUS_META[key];
              const selected = listing.status === key;

              return (
                <Pressable
                  key={key}
                  onPress={() => handleStatusChange(key)}
                  style={({ pressed }) => [
                    styles.statusCard,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: selected ? meta.color : '#EFECE6',
                      opacity: pressed ? 0.9 : 1,
                    },
                    selected && { backgroundColor: meta.background },
                  ]}
                >
                  <View style={styles.statusCardMain}>
                    <View
                      style={[
                        styles.statusIcon,
                        {
                          backgroundColor: selected ? meta.color : `${meta.color}12`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          key === 'available'
                            ? 'checkmark'
                            : key === 'low_supply'
                            ? 'remove'
                            : 'close'
                        }
                        size={18}
                        color={selected ? '#FFFFFF' : meta.color}
                      />
                    </View>

                    <View style={styles.statusCardCopy}>
                      <ThemedText style={[styles.statusCardTitle, { color: theme.textBody }]}>
                        {meta.label}
                      </ThemedText>
                      <ThemedText style={[styles.statusCardDescription, { color: theme.textSecondary }]}>
                        {STATUS_DESCRIPTION[key]}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? meta.color : '#D1CBC1' },
                    ]}
                  >
                    {selected && <View style={[styles.radioInner, { backgroundColor: meta.color }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          </>
          )}

          {/* MANAGEMENT TOOLS */}
          <ThemedText style={[styles.quickActionsLabel, { color: theme.textSecondary }]}>
            MANAGEMENT TOOLS
          </ThemedText>

          <View style={styles.quickActions}>
            {isListingApproved && <Pressable
              onPress={() =>
                router.push({ pathname: '/provider-detail', params: { id: listing.id } })
              }
              style={({ pressed }) => [
                styles.quickAction,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#EFECE6',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.accent}12` }]}>
                <Ionicons name="eye-outline" size={18} color={theme.accent} />
              </View>

              <View style={styles.quickActionCopy}>
                <ThemedText style={[styles.quickActionTitle, { color: theme.textBody }]}>
                  View your published listing
                </ThemedText>
                <ThemedText style={[styles.quickActionText, { color: theme.textSecondary }]}>
                   Exactly what customers see, with your photos and current status
                 </ThemedText>
               </View>

               <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
            </Pressable>}

            <Pressable
              onPress={() => router.push('/agent-edit-listing')}
              style={({ pressed }) => [
                styles.quickAction,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#EFECE6',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.accent}12` }]}>
                <Ionicons name="create-outline" size={18} color={theme.accent} />
              </View>

              <View style={styles.quickActionCopy}>
                <ThemedText style={[styles.quickActionTitle, { color: theme.textBody }]}>
                  Edit listing details
                </ThemedText>
                <ThemedText style={[styles.quickActionText, { color: theme.textSecondary }]}>
                  Update your service details and photos
                </ThemedText>
              </View>

              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },

  /* Offline banner */
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  offlineBannerText: {
    fontSize: 11,
    fontWeight: '600',
  },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE8DF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  logoMark: {
    width: 40,
    height: 40,
    // A full circle, so the radius is half the box. Matches the profile avatar
    // beside it, which is also a circle.
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 32,
    height: 36,
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    paddingTop: 4,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  welcomeBlock: {
    paddingVertical: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  welcomeDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  section: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  listingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  businessThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#EDE8DF',
  },
  listingInfoCol: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  previewLine: {
    fontSize: 11,
    fontWeight: '500',
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1CBC1',
  },
  currentStatus: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  currentStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  currentStatusTextWrap: {
    flex: 1,
  },
  currentStatusLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  currentStatusUpdated: {
    fontSize: 10,
    marginTop: 2,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  statusStack: {
    gap: 10,
    marginBottom: 20,
  },
  resubmitButton: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  resubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statusCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  statusCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusCardCopy: {
    flex: 1,
    paddingRight: 6,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusCardDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  quickActionsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickAction: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActionCopy: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionText: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  bottomSpace: {
    height: 10,
  },
  businessThumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  noticeIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
    noticeBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  retryGhost: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  retryGhostText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
