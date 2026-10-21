import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Availability, CATEGORIES, CATEGORY_META, Category, getListings, Listing, STATUS_META } from '@/data/product';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { useListings, useSyncedListings, useNearbyListings } from '@/hooks/use-listings';
import { useAppState } from '@/state/app-state';
import { formatDistance, getDistanceMeters } from '@/utils/location';
import { resolveDisplayArea } from '@/utils/display-area';

// Modern Design Tokens
const COLOR_PRIMARY = '#129E9E';
const COLOR_PRIMARY_LIGHT = '#E8F6F6';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_ACCENT_GREEN = '#10B981';

const STATUS_PRIORITY: Record<Availability, number> = {
  available: 0,
  low_supply: 1,
  unconfirmed: 2,
  unavailable: 3,
};

const ACTIVE_STATUSES: Availability[] = ['available', 'low_supply'];

type RankedListing = Listing & {
  distanceMeters?: number;
};

export default function CategoryListScreen() {
  const { category, area } = useLocalSearchParams<{ category?: string; area?: string }>();
  const { customerLocation, favorites, toggleFavorite, user } = useAppState();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'nearby'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const hasGps = customerLocation?.gps?.latitude !== undefined && customerLocation?.gps?.longitude !== undefined;
  const gpsLat = customerLocation?.gps?.latitude;
  const gpsLng = customerLocation?.gps?.longitude;

  // Seed data keeps the feed populated offline; the sync layers live listings
  // (with their uploaded photos) on top of it.
  const allSeedAndLive = useListings();
  const {
    isSyncing,
    errorMessage: listingSyncError,
    isOffline: listingSyncOffline,
    refresh: retryListingSync,
  } = useSyncedListings();

  // Geospatial listings when GPS is available
  const {
    listings: nearbyListings,
    isLoading: nearbyLoading,
    error: nearbyError,
    isOffline: nearbyOffline,
    refresh: refreshNearby,
  } = useNearbyListings({
    latitude: gpsLat ?? 0,
    longitude: gpsLng ?? 0,
    radiusMeters: 5000,
    category: category || undefined,
    enabled: hasGps,
  });
  const listingError = nearbyError ?? listingSyncError;
  const listingOffline = nearbyError ? nearbyOffline : listingSyncOffline;

  const urlCategory = category ? (category as Category) : null;
  const [activeCategory, setActiveCategory] = useState<Category | null>(() => urlCategory);
  const meta = activeCategory ? CATEGORY_META[activeCategory] : null;

  // Use geospatial listings when GPS available, otherwise fall back to local store.
  //
  // The /nearby endpoint returns ONLY API results — it deliberately does not
  // merge seed data, because seed entries have no reliable coordinates and
  // cannot participate in a geospatial query. That is correct for distance
  // sorting, but it means an empty nearby response (API down, no providers in
  // radius, or no GPS at all) used to leave the feed blank. Fall back to the
  // full local store so a category tab still shows every known provider rather
  // than an empty state that reads as a broken app.
  const baseListings = useMemo<Listing[]>(() => {
    if (hasGps && nearbyListings.length > 0) return nearbyListings;
    return urlCategory ? getListings(urlCategory) : allSeedAndLive;
  }, [hasGps, nearbyListings, urlCategory, allSeedAndLive]);

  const selectedArea = resolveDisplayArea(
    area,
    customerLocation?.serviceArea?.name,
    customerLocation?.label,
  );

  const listings = useMemo<RankedListing[]>(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    const categoryListings = activeCategory
      ? baseListings.filter((item) => item.category === activeCategory)
      : baseListings;

    return categoryListings
      .filter((item) => {
        if (selectedFilter === 'active') {
          return ACTIVE_STATUSES.includes(item.status);
        }
        return true;
      })
      .filter((item) => !cleanQuery || item.name.toLowerCase().includes(cleanQuery))
      .map((item) => {
        // When using geospatial listings, distanceMeters is already set by the API
        // When using local listings, compute client-side if GPS available
        let distanceMeters = item.distanceMeters;
        if (
          distanceMeters === undefined &&
          hasGps &&
          item.latitude !== undefined &&
          item.longitude !== undefined
        ) {
          distanceMeters = getDistanceMeters(customerLocation.gps!, {
            latitude: item.latitude,
            longitude: item.longitude,
          });
        }

        return { ...item, distanceMeters };
      })
      .sort((first, second) => {
        if (first.distanceMeters === undefined || second.distanceMeters === undefined) {
          if (first.distanceMeters === second.distanceMeters) {
            return (
              STATUS_PRIORITY[first.status] - STATUS_PRIORITY[second.status] ||
              second.trust - first.trust
            );
          }
          return first.distanceMeters === undefined ? 1 : -1;
        }

        return (
          first.distanceMeters - second.distanceMeters ||
          STATUS_PRIORITY[first.status] - STATUS_PRIORITY[second.status] ||
          second.trust - first.trust
        );
      });
  }, [customerLocation, baseListings, activeCategory, searchQuery, selectedFilter, hasGps]);

  const onRefresh = useCallback(() => {
    retryListingSync();
    // Also refresh nearby listings if GPS available
    if (hasGps) {
      refreshNearby();
    }
  }, [hasGps, refreshNearby, retryListingSync]);

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

          <View style={styles.headerTitleGroup}>
            <ThemedText style={styles.headerTitle}>{meta ? `${meta.label} Spots` : 'All Services'}</ThemedText>
            <View style={styles.locationPill}>
              <Ionicons name="location-sharp" size={11} color={COLOR_PRIMARY} />
              <ThemedText style={styles.locationText}>{selectedArea}</ThemedText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="filter-outline" size={18} color={COLOR_TEXT_MAIN} />
          </Pressable>
        </View>

        {listingError && (
          <View style={styles.syncBanner}>
            <Ionicons
              name={listingOffline ? 'cloud-offline-outline' : 'refresh-circle-outline'}
              size={17}
              color="#92400E"
            />
            <ThemedText style={styles.syncBannerText}>
              {listingError}
            </ThemedText>
            {!listingOffline && (
              <Pressable accessibilityRole="button" onPress={onRefresh}>
                <ThemedText style={styles.syncRetryText}>Retry</ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLOR_TEXT_MUTED} />
            <TextInput
              placeholder="Search services..."
              placeholderTextColor={COLOR_TEXT_MUTED}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

          {/* Service-type chips — only shown in browse-all mode (no pre-selected category) */}
          {!urlCategory && (
            <View style={styles.chipContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                <Pressable
                  onPress={() => setActiveCategory(null)}
                  style={[styles.chip, !activeCategory && styles.activeChip]}
                >
                  <Ionicons
                    name="apps"
                    size={13}
                    color={!activeCategory ? '#FFF' : COLOR_TEXT_MUTED}
                  />
                  <ThemedText
                    style={[styles.chipText, !activeCategory && styles.activeChipText]}
                  >
                    All Services
                  </ThemedText>
                </Pressable>

                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.chip, activeCategory === cat && styles.activeChip]}
                  >
                    <Ionicons
                      name="ellipse"
                      size={13}
                      color={activeCategory === cat ? '#FFF' : COLOR_PRIMARY}
                    />
                    <ThemedText
                      style={[styles.chipText, activeCategory === cat && styles.activeChipText]}
                    >
                      {CATEGORY_META[cat].label}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Dynamic Status Filter Chips */}
        <View style={styles.chipContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <Pressable
              onPress={() => setSelectedFilter('all')}
              style={[styles.chip, selectedFilter === 'all' && styles.activeChip]}
            >
              <ThemedText style={[styles.chipText, selectedFilter === 'all' && styles.activeChipText]}>
                All ({baseListings.length})
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setSelectedFilter('active')}
              style={[styles.chip, selectedFilter === 'active' && styles.activeChip]}
            >
              <View style={styles.greenDot} />
              <ThemedText style={[styles.chipText, selectedFilter === 'active' && styles.activeChipText]}>
                Active Now
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setSelectedFilter('nearby')}
              style={[styles.chip, selectedFilter === 'nearby' && styles.activeChip]}
            >
              <Ionicons name="walk-outline" size={13} color={selectedFilter === 'nearby' ? '#FFF' : COLOR_TEXT_MUTED} />
              <ThemedText style={[styles.chipText, selectedFilter === 'nearby' && styles.activeChipText]}>
                Nearest
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>

        {/* Live Refresh Banner */}
        <View style={styles.liveNotice}>
          <View style={styles.liveNoticeLeft}>
            <Ionicons name="sparkles" size={14} color={COLOR_PRIMARY} />
            <ThemedText style={styles.liveNoticeText}>Verified within the last 3 hours</ThemedText>
          </View>
          <ThemedText style={styles.pullNoticeText}>Pull to update</ThemedText>
        </View>

        {/* Main Listing View */}
        <ScrollView
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing || nearbyLoading}
              onRefresh={onRefresh}
              tintColor={COLOR_PRIMARY}
              colors={[COLOR_PRIMARY]}
            />
          }
        >
          {listings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={40} color={COLOR_TEXT_MUTED} />
              <ThemedText style={styles.emptyTitle}>No active providers right now</ThemedText>
              <ThemedText style={styles.emptySub}>Check back shortly or change your location filter.</ThemedText>
            </View>
          ) : (
            listings.map((item) => {
              const status = STATUS_META[item.status] || {
                label: item.status.toUpperCase(),
                background: '#F1F5F9',
                color: COLOR_TEXT_MUTED,
              };

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/provider-detail?id=${item.id}`)}
                  style={({ pressed }) => [styles.providerCard, pressed && styles.pressed]}
                >
                  {item.image ? (
                    <Image source={item.image} contentFit="cover" style={styles.cardCover} />
                  ) : (
                    item.photos?.[0] && (
                      <Image
                        source={{ uri: item.photos[0].url }}
                        contentFit="cover"
                        style={styles.cardCover}
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    )
                  )}

                  <View style={styles.cardContent}>
                    {/* Header Row */}
                    <View style={styles.cardMainRow}>
                      <View style={styles.titleArea}>
                        <ThemedText style={styles.providerTitle}>{item.name}</ThemedText>
                        <ThemedText style={styles.subDetail}>
                          {item.area || 'Okemason'} •{' '}
                          <ThemedText style={styles.distanceHighlight}>
                            {item.distanceMeters === undefined
                              ? item.distance
                              : formatDistance(item.distanceMeters)}
                          </ThemedText>
                        </ThemedText>
                      </View>

                      {/* Rating Badge */}
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <ThemedText style={styles.ratingText}>{item.trust.toFixed(1)}</ThemedText>
                      </View>
                    </View>

                    {/* Rate/Pricing Callout */}
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.priceLabel}>RATE / FEE</ThemedText>
                      <ThemedText style={styles.priceValue}>{item.price}</ThemedText>
                    </View>

                    {/* Status & Action Footer */}
                    <View style={styles.cardFooter}>
                      <View style={[styles.statusPill, { backgroundColor: status.background }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <ThemedText style={[styles.statusLabel, { color: status.color }]}>
                          {status.label}
                        </ThemedText>
                      </View>

                      <View style={styles.footerRight}>
                        <ThemedText style={styles.timeAgo}>Updated {item.updated}</ThemedText>
                        <Ionicons name="chevron-forward" size={16} color={COLOR_TEXT_MUTED} />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Toggle favorite"
                          onPress={(event) => {
                            event.stopPropagation();
                            if (!user) {
                              router.push(`/auth-required?id=${item.id}&intent=favorite`);
                            } else {
                              toggleFavorite(item.id);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.favoriteBtn,
                            pressed && styles.pressed,
                            favorites.includes(item.id) && styles.favoriteBtnActive,
                          ]}
                        >
                          <Ionicons
                            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
                            size={18}
                            color={favorites.includes(item.id) ? '#EF4444' : COLOR_TEXT_MUTED}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
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
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR_TEXT_MUTED,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncBannerText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
  },
  syncRetryText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Search Bar */
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLOR_TEXT_MAIN,
    height: '100%',
  },

  /* Chips Scroll */
  chipContainer: {
    marginVertical: 8,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  activeChip: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_TEXT_MUTED,
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLOR_ACCENT_GREEN,
  },

  /* Live Notice Banner */
  liveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR_PRIMARY_LIGHT,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  liveNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  pullNoticeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLOR_TEXT_MUTED,
  },

  /* Scrollable Provider List */
  scrollList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: BOTTOM_TAB_HEIGHT,
    gap: 14,
  },

  /* Provider Card */
  providerCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardCover: {
    width: '100%',
    height: 110,
  },
  cardContent: {
    padding: 16,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    paddingRight: 8,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  subDetail: {
    fontSize: 12,
    color: COLOR_TEXT_MUTED,
    marginTop: 2,
  },
  distanceHighlight: {
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Rate Box */
  priceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    marginTop: 1,
  },

  /* Footer Row */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
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
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  timeAgo: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
  },

  pressed: {
    opacity: 0.85,
  },
});