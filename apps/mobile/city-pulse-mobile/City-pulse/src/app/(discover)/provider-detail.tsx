import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListingGallery } from '@/components/listing-gallery';
import { ProviderDetailsList } from '@/components/provider-details-list';
import { STATUS_META, CATEGORY_META } from '@/data/product';
import { useListing, useMyListing, useSyncedListings } from '@/hooks/use-listings';
import { useAppState } from '@/state/app-state';
import { formatDistance, getDistanceMeters } from '@/utils/location';

// Modern Design Tokens
const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  // A listing published moments ago only exists on the API, so sync first and
  // let the store resolve the id across seed and live data.
  useSyncedListings();
  const listing = useListing(id);
  const { beginReport, customerLocation, favorites, toggleFavorite, user, token } = useAppState();

  // Fallback: if the global sync hasn't picked up the listing yet (or the
  // provider clicked "view" from their own dashboard), try fetching their
  // own listing directly. This prevents the spinner from spinning forever
  // when the listing was just published and the global `/pulses` endpoint
  // hasn't ingested it yet.
  const { listing: myListing, isLoading: myListingLoading } = useMyListing(token, user?.id);
  const resolvedListing = listing || (user?.roles?.includes('agent') ? myListing : null);
  const isLoading = !listing && myListingLoading;

  if (isLoading || !resolvedListing) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={[styles.safeArea, styles.loadingState]}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const listingData = resolvedListing;
  const distanceText =
    customerLocation?.gps && listingData.latitude !== undefined && listingData.longitude !== undefined
      ? formatDistance(
          getDistanceMeters(customerLocation.gps, {
            latitude: listingData.latitude,
            longitude: listingData.longitude,
          }),
        )
      : listingData.distance;

  const status = STATUS_META[listingData.status] || {
    label: listingData.status.toUpperCase(),
    background: '#F1F5F9',
    color: COLOR_TEXT_MUTED,
  };

  // A provider viewing their own public listing gets neither a report control
  // nor a favourite control: reporting yourself is rejected server-side, and
  // favouriting your own business is not a customer action. The backend blocks
  // both too, but hiding them explains the rule instead of surfacing it as an
  // error the user has to trigger to discover.
  const isOwnListing = Boolean(user?.id && listingData.agentId && user.id === listingData.agentId);
  const isProvider = user?.roles?.includes('agent') ?? false;

  // Seed listings (e.g. 'adebayo-pos') have string IDs that are not valid
  // MongoDB ObjectIds. The report API requires a real ObjectId, so hide the
  // report button for seed listings to avoid a confusing "Cast to ObjectId
  // failed" error. A 24-character hex string is the canonical ObjectId format.
  const isSeedListing = !/^[0-9a-fA-F]{24}$/.test(listingData.id ?? '');

  const phoneNumber = listingData.phone || '';
  // WhatsApp is a separate, optional field from the call number — a provider may
  // take calls on one line and be reachable on WhatsApp at a different one, or
  // may not offer WhatsApp at all.
  const whatsappNumber = listingData.whatsapp || '';
  const canCall = Boolean(phoneNumber);
  const canWhatsApp = Boolean(whatsappNumber);

  async function openWhatsApp() {
    if (!whatsappNumber) return;
    const whatsapp = `whatsapp://send?phone=234${whatsappNumber.replace(/^0/, '')}`;
    const fallback = `sms:+234${whatsappNumber.replace(/^0/, '')}`;
    try {
      await Linking.openURL(whatsapp);
    } catch {
      await Linking.openURL(fallback);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top App Bar */}
        <View style={styles.appBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>Provider Details</ThemedText>

          {/* Reporting lives in the action group below, as one clearly labelled
              control. It used to also sit here as an unlabelled red icon, and
              that duplicate had no self-report guard — the only route into the
              flow that a provider could take. One entry point, one guard. */}
          <View style={styles.iconBtnSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Photos: uploaded gallery when present, otherwise the seeded cover */}
          {listingData.photos?.length ? (
            <ListingGallery photos={listingData.photos} />
          ) : (
            listingData.image && <Image source={listingData.image} contentFit="cover" style={styles.image} />
          )}

          {/* Heading Card */}
          <View style={styles.mainCard}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <ThemedText style={styles.title}>{listingData.name}</ThemedText>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={13} color={COLOR_PRIMARY} />
                  <ThemedText style={styles.area}>
                    {listingData.area || 'Okemason'} •{' '}
                    <ThemedText style={styles.distanceHighlight}>{distanceText}</ThemedText>
                  </ThemedText>
                </View>
                <ThemedText style={styles.categoryLabel}>
                  {CATEGORY_META[listingData.category]?.label || 'Service provider'}
                </ThemedText>
              </View>

              {/* Rating Badge + Favorite */}
              <View style={styles.headingActions}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <ThemedText style={styles.ratingText}>{listingData.trust.toFixed(1)}</ThemedText>
                </View>

                {!isOwnListing ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isProvider
                        ? 'Favorites are a customer feature'
                        : !user
                        ? 'Sign in to favorite'
                        : 'Toggle favorite'
                    }
                    onPress={(event) => {
                      event.stopPropagation();
                      if (isProvider) {
                        Alert.alert(
                          'Favorites are for customers',
                          'As a service provider, your favorites do not appear on a separate page. You can always visit a listing directly from search.',
                          [{ text: 'OK' }],
                        );
                        return;
                      }
                      if (!user) {
                        router.push(`/auth-required?id=${listingData.id}&intent=favorite`);
                      } else {
                        toggleFavorite(listingData.id);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.favoriteBtn,
                      pressed && styles.pressed,
                      favorites.includes(listingData.id) && styles.favoriteBtnActive,
                    ]}
                  >
                    <Ionicons
                      name={favorites.includes(listingData.id) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={favorites.includes(listingData.id) ? '#EF4444' : COLOR_TEXT_MUTED}
                    />
                  </Pressable>
                ) : (
                  <View style={styles.favoriteBtn} />
                )}
              </View>
            </View>

            {/* Status Pill & Time Ago Banner */}
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: status.background }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <ThemedText style={[styles.statusLabel, { color: status.color }]}>
                  {status.label}
                </ThemedText>
              </View>
              <ThemedText style={styles.updated}>Updated {listingData.updated}</ThemedText>
            </View>

            {/* Rate / Service Info Block */}
            <View style={styles.infoBox}>
              <ThemedText style={styles.infoLabel}>RATE / SERVICE FEE</ThemedText>
              <ThemedText style={styles.infoValue}>{listingData.price}</ThemedText>
              {listingData.detail ? (
                <ThemedText style={styles.infoDetail}>{listingData.detail}</ThemedText>
              ) : null}
            </View>
          </View>

          {/* Category-specific details the provider entered (home delivery, menu
              prices, rent range, fees) plus address and email. */}
          <ProviderDetailsList listing={listingData} />

          {/* Trust explanation, stated accurately: the score starts at 3.0 and
              only ever falls, in response to reports from the community. It is
              not a star rating a customer can raise. */}
          <View style={styles.trustNote}>
            <Ionicons name="information-circle-outline" size={15} color={COLOR_TEXT_MUTED} />
            <ThemedText style={styles.trustNoteText}>
              Trust starts at 3.0 and only changes when neighbors report a problem. It is not
              editable by the provider, and no customer can raise or lower it directly.
            </ThemedText>
          </View>

          {/* Call-To-Action Group.
              Each contact action is rendered only when the provider actually
              published that channel, so a customer is never offered a "Chat on
              WhatsApp" button that opens a number the provider never gave. */}
          <View style={styles.actionGroup}>
            {canCall && (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(`tel:+234${phoneNumber.replace(/^0/, '')}`)}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <ThemedText style={styles.primaryText}>Call Provider Now</ThemedText>
              </Pressable>
            )}

            {canWhatsApp && (
              <Pressable
                accessibilityRole="button"
                onPress={openWhatsApp}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <ThemedText style={styles.secondaryText}>Chat on WhatsApp</ThemedText>
              </Pressable>
            )}

            {!canCall && !canWhatsApp && (
              <View style={[styles.noContactNotice, { backgroundColor: COLOR_CARD, borderColor: COLOR_BORDER }]}>
                <Ionicons name="information-circle-outline" size={18} color={COLOR_TEXT_MUTED} />
                <ThemedText style={styles.noContactText}>
                  This provider has not published a phone or WhatsApp number.
                </ThemedText>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (listingData.latitude && listingData.longitude) {
                  router.push(`/directions?id=${listingData.id}`);
                } else {
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listingData.area || 'Abeokuta')}`);
                }
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="navigate-outline" size={18} color={COLOR_PRIMARY} />
              <ThemedText style={styles.secondaryText}>Get Directions</ThemedText>
            </Pressable>

            {!isOwnListing && !isSeedListing && (
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Tells the City Pulse team that this listing is inaccurate"
                onPress={() => {
                  if (isProvider) {
                    Alert.alert(
                      'Reporting not available',
                      'As a service provider, you cannot report listings. If you notice a problem with another listing, please contact support.',
                      [{ text: 'OK' }],
                    );
                    return;
                  }
                  beginReport(listingData.id);
                  router.push(`/report-reason?id=${listingData.id}`);
                }}
                style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
              >
                <Ionicons name="flag-outline" size={15} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.reportText}>Report an inaccurate listing</ThemedText>
              </Pressable>
            )}
          </View>

        </ScrollView>
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
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
  },

   /* App Bar */
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Keeps the header title centred now that the report icon is gone from the bar.
  iconBtnSpacer: {
    width: 40,
    height: 40,
  },
  noContactNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noContactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLOR_TEXT_MUTED,
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },

  /* Content Scroll Container */
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },

  /* Media Cover */
  image: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
  },

  /* Main Info Container */
  mainCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
    gap: 14,
  },

  /* Title & Rating Header */
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingCopy: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  area: {
    fontSize: 12,
    color: COLOR_TEXT_MUTED,
  },
  distanceHighlight: {
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },
  categoryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Status Row */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  updated: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
  },

  /* Rate & Fee Box */
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLOR_PRIMARY,
    marginTop: 2,
  },
  infoDetail: {
    fontSize: 12,
    color: COLOR_TEXT_MUTED,
    marginTop: 6,
    lineHeight: 18,
  },

  /* Trust explainer */
  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  trustNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLOR_TEXT_MUTED,
  },

  /* Action Buttons */
  actionGroup: {
    gap: 10,
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
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },
  reportButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: COLOR_DANGER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  reportText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_DANGER_TEXT,
  },

  pressed: {
    opacity: 0.85,
  },
});
