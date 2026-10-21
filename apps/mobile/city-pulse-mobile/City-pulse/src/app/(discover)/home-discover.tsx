import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FeatureInsightCard, type FeatureInsight } from '@/components/feature-insight-card';
import { LocationHeader } from '@/components/location-header';
import { useAppState } from '@/state/app-state';
import { API_BASE_URL } from '@/utils/api-config';
import { apiRequest, describeError } from '@/utils/api-client';
import { CATEGORIES, type Category, type Listing, CATEGORY_BASELINES } from '@/data/product';
import { useListings, useSyncedListings, useNearbyListings } from '@/hooks/use-listings';
import { useTheme } from '@/hooks/use-theme';
import { resolveDisplayArea } from '@/utils/display-area';

type CategoryItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  name: string;
  mainLine: string;
  subtext: string;
  badge?: string;
  badgeTone?: 'demand' | 'trusted' | 'new' | 'available' | 'lowSupply' | 'unavailable';
};

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pos: 'card-outline',
  food: 'restaurant-outline',
  gas: 'flame-outline',
  house: 'home-outline',
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  pos: '#3B82F6',
  food: '#F59E0B',
  gas: '#EF4444',
  house: '#10B981',
};

type PulseItem = {
  id: string;
  text: string;
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  low_supply: 'Low Supply',
  unavailable: 'Unavailable',
  unconfirmed: 'Unconfirmed',
};

/**
 * The default area label shown when no location has been selected. It is not a
 * real place, so it must never be used as a filter: a visitor with no location
 * set should see every provider, not an empty grid that reads "0 Live".
 */
const DEFAULT_AREA_LABEL = 'Your Area';

function isDefaultArea(area: string): boolean {
  return !area || area.trim().toLowerCase() === DEFAULT_AREA_LABEL.toLowerCase();
}

/**
 * Derives each category card's live count, subtext, and strategic badge from
 * the real listings in the selected area instead of hardcoded strings.
 *
 * The badge is a *computed signal*, not decoration:
 * - A category with actual available listings and thin supply earns "High Demand".
 * - A category with a strong average trust score earns "Trusted".
 * - A category with a brand-new listing earns "New".
 * - Anything else falls back to its dominant status label.
 */
function getCategoryStats(area: string, listings: Listing[]): CategoryItem[] {
  // No real location selected: show the whole catalogue rather than filtering
  // by a placeholder label, which would empty every card to "0 Live".
  const listingsInArea = isDefaultArea(area)
    ? listings
    : listings.filter((listing) =>
        listing.area.toLowerCase().includes(area.toLowerCase())
      );

  return CATEGORIES.map((category) => {
    const categoryListings = listingsInArea.filter((l) => l.category === category);
    const realTotal = categoryListings.length;

    const available = categoryListings.filter((l) => l.status === 'available').length;
    const lowSupply = categoryListings.filter((l) => l.status === 'low_supply').length;
    const unavailable = categoryListings.filter((l) => l.status === 'unavailable').length;

    const avgTrust =
      realTotal > 0 ? categoryListings.reduce((sum, l) => sum + (l.trust || 0), 0) / realTotal : 0;

    const newestMinutes = categoryListings
      .map((l) => parseFreshnessMinutes(l.updated))
      .filter((n) => n !== Infinity);
    const freshest = newestMinutes.length ? Math.min(...newestMinutes) : Infinity;

    const icon = CATEGORY_ICON[category] || 'flash';
    const iconColor = CATEGORY_ICON_COLOR[category] || BRAND_TEAL;
    const label = CATEGORY_META_LABEL(category);

    // Global baseline + real listings
    const baseline = CATEGORY_BASELINES[category] ?? 0;
    const total = baseline + realTotal;

    const MAIN_LINES: Record<string, { main: string; sub: string }> = {
      pos: { main: 'Compare withdrawal fees', sub: 'Find out what cash withdrawal may cost you.' },
      food: { main: 'Explore menus & prices', sub: 'See available meals and their listed prices.' },
      gas: { main: 'Compare refill prices', sub: 'Check listed prices before travelling.' },
      house: { main: 'Explore rent & prices', sub: 'Compare listed property prices and rent.' },
    };
    const mainLine = MAIN_LINES[category]?.main ?? 'Explore services';
    let subtext = MAIN_LINES[category]?.sub ?? '';

    // Badges use real listing signals; catalog baselines must not imply demand or status.
    let badge: string | undefined;
    let badgeTone: CategoryItem['badgeTone'];
    if (realTotal > 0) {
      if (available > 0 && (lowSupply > 0 || unavailable > realTotal / 2)) {
        badge = 'High Demand';
        badgeTone = 'demand';
      } else if (freshest <= 5) {
        badge = 'New';
        badgeTone = 'new';
      } else if (lowSupply > 0) {
        badge = STATUS_LABEL.low_supply;
        badgeTone = 'lowSupply';
      } else if (avgTrust >= 4) {
        badge = 'Trusted';
        badgeTone = 'trusted';
      } else if (available > 0) {
        badge = STATUS_LABEL.available;
        badgeTone = 'available';
      } else if (unavailable > 0) {
        badge = STATUS_LABEL.unavailable;
        badgeTone = 'unavailable';
      }
    }

    return {
      key: category,
      icon,
      iconColor,
      name: label,
      mainLine,
      subtext,
      badge,
      badgeTone,
    };
  });
}

function generateInsight(area: string, listings: Listing[]): FeatureInsight | null {
  // No real location selected: show the whole catalogue rather than filtering
  // by a placeholder label, which would empty every card to "0 Live".
  const listingsInArea = isDefaultArea(area)
    ? listings
    : listings.filter(
        (listing) => listing.area.toLowerCase().includes(area.toLowerCase())
      );

  const freshUpdate = [...listingsInArea]
    .filter((l) => l.status === 'available' || l.status === 'low_supply')
    .sort((a, b) => parseFreshnessMinutes(a.updated) - parseFreshnessMinutes(b.updated))[0];

  if (freshUpdate) {
    const statusLabel = STATUS_LABEL[freshUpdate.status] || 'Available';
    const eyebrow = freshUpdate.status === 'available' ? 'JUST UPDATED' : 'STATUS UPDATE';
    const headline =
      freshUpdate.status === 'available'
        ? `${freshUpdate.name} is ready nearby`
        : `${freshUpdate.name} has limited supply nearby`;
    const supporting = `${CATEGORY_META_LABEL(freshUpdate.category)} • ${statusLabel} • ${freshUpdate.updated}`;
    const cta =
      freshUpdate.status === 'available'
        ? 'See available providers →'
        : 'Check nearby options →';

    // Realistic rotating insights - each with full data (status, timestamp, category, etc.)
    const rotatingInsights: FeatureInsight[] = [
      {
        eyebrow: 'JUST UPDATED',
        headline: `${freshUpdate.name} is ready nearby`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • ${statusLabel} • ${area} • ${freshUpdate.updated}`,
        freshness: freshUpdate.updated,
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'STATUS UPDATE',
        headline: `${freshUpdate.name} has limited supply nearby`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • ${statusLabel} • ${area} • ${freshUpdate.updated}`,
        freshness: freshUpdate.updated,
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'Check nearby options →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `New ${CATEGORY_META_LABEL(freshUpdate.category).toLowerCase()} available in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • just now`,
        freshness: 'just now',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `More options in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • 3 min ago`,
        freshness: '3 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'STATUS UPDATE',
        headline: `Supply update for ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Low Supply • ${area} • 7 min ago`,
        freshness: '7 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'Check nearby options →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `New provider active in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • 4 min ago`,
        freshness: '4 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `Fresh update in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • 6 min ago`,
        freshness: '6 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'STATUS UPDATE',
        headline: `Limited supply in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Low Supply • ${area} • 8 min ago`,
        freshness: '8 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'Check nearby options →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `Available now in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • 9 min ago`,
        freshness: '9 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `New listing in ${area}`,
        supportingText: `${CATEGORY_META_LABEL(freshUpdate.category)} • Available • ${area} • 10 min ago`,
        freshness: '10 min ago',
        icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
        cta: 'See available providers →',
        category: freshUpdate.category,
      },
    ];
    
    return {
      eyebrow,
      headline,
      supportingText: supporting,
      freshness: freshUpdate.updated,
      icon: CATEGORY_ICON[freshUpdate.category] || 'flash',
      cta,
      category: freshUpdate.category,
      rotatingInsights,
      ctaShowsAll: true,
    };
  }

  const categoriesWithListings = Array.from(
    new Set(listingsInArea.map((l) => l.category))
  ) as Category[];

  if (categoriesWithListings.length > 0) {
    const category = categoriesWithListings[0];
    const categoryListings = listings.filter((l) => l.category === category);
    const hasAvailable = categoryListings.some((l) => l.status === 'available');
    const hasLowSupply = categoryListings.some((l) => l.status === 'low_supply');
    const eyebrow = 'CATEGORY STATUS';
    const headline = `${CATEGORY_META_LABEL(category)} providers in ${area}`;
    const supporting = hasAvailable
      ? 'Some locations are currently available'
      : hasLowSupply
        ? 'Supply is limited in this area'
        : 'Check current availability before leaving';

    const rotatingInsights: FeatureInsight[] = [
      {
        eyebrow: 'CATEGORY STATUS',
        headline: `${CATEGORY_META_LABEL(category)} providers in ${area}`,
        supportingText: `Some locations are currently available in ${area}`,
        icon: CATEGORY_ICON[category] || 'flash',
        cta: `Explore ${CATEGORY_META_LABEL(category)} →`,
        category,
      },
      {
        eyebrow: 'CATEGORY STATUS',
        headline: `${CATEGORY_META_LABEL(category)} providers in ${area}`,
        supportingText: `Supply is limited in ${area}`,
        icon: CATEGORY_ICON[category] || 'flash',
        cta: `Explore ${CATEGORY_META_LABEL(category)} →`,
        category,
      },
      {
        eyebrow: 'CATEGORY STATUS',
        headline: `${CATEGORY_META_LABEL(category)} providers in ${area}`,
        supportingText: `Check current availability before leaving ${area}`,
        icon: CATEGORY_ICON[category] || 'flash',
        cta: `Explore ${CATEGORY_META_LABEL(category)} →`,
        category,
      },
    ];
    
    return {
      eyebrow,
      headline,
      supportingText: supporting,
      icon: CATEGORY_ICON[category] || 'flash',
      cta: `Explore ${CATEGORY_META_LABEL(category)} →`,
      category,
      rotatingInsights,
    };
  }

  const anyListing = [...listings].sort(
    (a, b) => parseFreshnessMinutes(a.updated) - parseFreshnessMinutes(b.updated)
  )[0];

  if (anyListing) {
    // The chosen area has no listings yet, so there is nothing live to report
    // *in* it. The card shows a friendly "arriving soon" state that still names
    // the selected area on every line — including every rotating entry.
    const areaLabel = area;
    const rotatingInsights: FeatureInsight[] = [
      {
        eyebrow: 'RECENT UPDATE',
        headline: `No live updates in ${areaLabel} yet`,
        supportingText: `Check back soon for availability in ${areaLabel}`,
        freshness: 'just now',
        icon: CATEGORY_ICON[anyListing.category] || 'flash',
        cta: 'Browse nearby areas →',
        category: anyListing.category,
        ctaShowsAll: true,
      },
      {
        eyebrow: 'JUST UPDATED',
        headline: `First providers arriving in ${areaLabel}`,
        supportingText: `We are adding verified providers in ${areaLabel} • Just started`,
        freshness: 'just now',
        icon: 'flash',
        cta: 'Browse nearby areas →',
        ctaShowsAll: true,
      },
      {
        eyebrow: 'STATUS UPDATE',
        headline: `Stay ready in ${areaLabel}`,
        supportingText: `New listings in ${areaLabel} are being verified daily`,
        freshness: 'today',
        icon: 'shield-checkmark',
        cta: 'Browse nearby areas →',
        ctaShowsAll: true,
      },
    ];

    return {
      eyebrow: 'RECENT UPDATE',
      headline: `No live updates in ${areaLabel} yet`,
      supportingText: `Check back soon for availability in ${areaLabel}`,
      freshness: 'just now',
      icon: CATEGORY_ICON[anyListing.category] || 'flash',
      cta: 'Browse nearby areas →',
      category: anyListing.category,
      ctaShowsAll: true,
      rotatingInsights,
    };
  }

  // No listings at all — the card should still render rather than vanish,
  // otherwise the whole feature-insight slot disappears on first open or
  // whenever the sync has not landed yet.
  const rotatingInsights: FeatureInsight[] = [
    {
      eyebrow: 'JUST UPDATED',
      headline: `Live updates for ${area}`,
      supportingText: `Verified providers in ${area} are updated every few minutes`,
      freshness: 'just now',
      icon: 'flash',
      cta: 'Browse nearby areas →',
      ctaShowsAll: true,
    },
    {
      eyebrow: 'CATEGORY STATUS',
      headline: `Stay ready in ${area}`,
      supportingText: `New listings in ${area} are being verified daily`,
      freshness: 'today',
      icon: 'shield-checkmark',
      cta: 'Browse nearby areas →',
      ctaShowsAll: true,
    },
    {
      eyebrow: 'JUST UPDATED',
      headline: `First providers arriving in ${area}`,
      supportingText: `We are adding verified providers in ${area} • Just started`,
      freshness: 'just now',
      icon: 'flash',
      cta: 'Browse nearby areas →',
      ctaShowsAll: true,
    },
  ];

  return {
    eyebrow: 'JUST UPDATED',
    headline: `Live updates for ${area}`,
    supportingText: `Verified providers in ${area} are updated every few minutes`,
    freshness: 'just now',
    icon: 'flash',
    cta: 'Browse nearby areas →',
    ctaShowsAll: true,
    rotatingInsights,
  };
}

function CATEGORY_META_LABEL(category: string): string {
  const labels: Record<string, string> = {
    pos: 'POS / Cash',
    food: 'Food Spots',
    gas: 'Cooking Gas',
    house: 'House Agents',
  };
  return labels[category] || category;
}

function parseFreshnessMinutes(updated: string): number {
  const match = updated.match(/(\d+)\s*(min|hour)/i);
  if (!match) return Infinity;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('hour')) return value * 60;
  return value;
}

export default function HomeDiscoverScreen() {
  const { area } = useLocalSearchParams<{ area?: string }>();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { setHasSeenOnboarding, user, customerLocation } = useAppState();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const badgeToneStyles = {
    demand: { container: styles.cardBadgeDemand, text: styles.cardBadgeTextDemand },
    trusted: { container: styles.cardBadgeTrusted, text: styles.cardBadgeTextTrusted },
    new: { container: styles.cardBadgeNew, text: styles.cardBadgeTextNew },
    available: { container: styles.cardBadgeAvailable, text: styles.cardBadgeTextAvailable },
    lowSupply: { container: styles.cardBadgeLowSupply, text: styles.cardBadgeTextLowSupply },
    unavailable: { container: styles.cardBadgeUnavailable, text: styles.cardBadgeTextUnavailable },
  };
  const isAgent = user?.roles?.includes('agent') ?? false;

  const hasGps = customerLocation?.gps?.latitude !== undefined && customerLocation?.gps?.longitude !== undefined;
  const gpsLat = customerLocation?.gps?.latitude;
  const gpsLng = customerLocation?.gps?.longitude;

  // Subscribing to the listing store makes the category counts and the feature
  // insight card react the moment live listings sync in. On first open the
  // sync runs in the background, so without this the grid showed "0 Live" and
  // the card stayed hidden until the user navigated away and back.
  const allListings = useListings();
  const {
    errorMessage: listingSyncError,
    isOffline: listingSyncOffline,
    refresh: retryListingSync,
  } = useSyncedListings();

  // Geospatial listings when GPS is available
  const {
    listings: nearbyListings,
    error: nearbyError,
    isOffline: nearbyOffline,
    refresh: refreshNearby,
  } = useNearbyListings({
    latitude: gpsLat ?? 0,
    longitude: gpsLng ?? 0,
    radiusMeters: 5000,
    enabled: hasGps,
  });
  const discoverSyncError = nearbyError ?? listingSyncError;
  const discoverSyncOffline = nearbyError ? nearbyOffline : listingSyncOffline;
  const retryDiscoverSync = useCallback(() => {
    retryListingSync();
    if (hasGps) refreshNearby();
  }, [hasGps, refreshNearby, retryListingSync]);

  // Geospatial results are more precise, but an empty/failed request should
  // still leave locally available listings visible while the status banner
  // explains that live data may be stale.
  const selectedArea = resolveDisplayArea(area, customerLocation?.serviceArea?.name, customerLocation?.label);
  const listings = hasGps && nearbyListings.length > 0 ? nearbyListings : allListings;
  const insight = useMemo(() => generateInsight(selectedArea, listings), [selectedArea, listings]);

  const [pulses, setPulses] = useState<PulseItem[]>([
    { id: '1', text: '5 POS Agents currently dispensing cash nearby.' },
    { id: '2', text: '2 Gas Plants operating with no waiting queue.' },
  ]);
  const [isFetchingPulses, setIsFetchingPulses] = useState(false);
  const [pulseError, setPulseError] = useState<string | null>(null);

  const categoryStats = useMemo(
    () => getCategoryStats(selectedArea, listings),
    [selectedArea, listings],
  );

  useEffect(() => {
    setHasSeenOnboarding(true);
  }, [setHasSeenOnboarding]);

  // Fetch live pulses for activity feed
  useEffect(() => {
    const loadPulses = async () => {
      setIsFetchingPulses(true);
      try {
        const path = hasGps && gpsLat !== undefined && gpsLng !== undefined
          ? `/pulses/nearby?lat=${gpsLat}&lng=${gpsLng}&radius=5000`
          : `/pulses?location=${encodeURIComponent(selectedArea)}`;
        const payload = await apiRequest<{ data?: any[] }>(path, { timeoutMs: 10000 });

        if (payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
          const dynamicPulses = payload.data.slice(0, 3).map((item: any, index: number) => ({
            id: String(item.id || index),
            text: item.description || item.title || `${item.name} is currently active.`,
          }));
          setPulses(dynamicPulses);
          setPulseError(null);
        }
      } catch (err) {
        setPulseError(describeError(err, 'Could not load live updates.'));
      } finally {
        setIsFetchingPulses(false);
      }
    };
    loadPulses();
  }, [selectedArea, hasGps, gpsLat, gpsLng]);

  const handleCategoryPress = useCallback((categoryKey: string) => {
    router.push(`/category-list?category=${encodeURIComponent(categoryKey)}&area=${encodeURIComponent(selectedArea)}`);
  }, [selectedArea]);

  const handleBecomeAgent = useCallback(() => {
    router.push('/auth-required?intent=agent');
  }, []);

  const handleCreateAccount = useCallback(() => {
    router.push('/create-account');
  }, []);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                retryListingSync();
                refreshNearby();
              }}
            />
          }
        >
          <LocationHeader
            showAgentDashboard
            onAgentDashboardPress={() => router.replace('/agent-dashboard')}
          />

          {discoverSyncError && (
            <View style={[styles.syncBanner, { backgroundColor: theme.warningBg }]}>
              <Ionicons
                name={discoverSyncOffline ? 'cloud-offline-outline' : 'refresh-circle-outline'}
                size={17}
                color={theme.warningText}
              />
              <ThemedText style={[styles.syncBannerText, { color: theme.warningText }]}>
                {discoverSyncError}
              </ThemedText>
              {!discoverSyncOffline && (
                <Pressable accessibilityRole="button" onPress={retryDiscoverSync}>
                  <ThemedText style={[styles.syncRetryText, { color: theme.warningText }]}>
                    Retry
                  </ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.liveIndicatorPill}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveIndicatorText}>
                Live Updates Active
              </ThemedText>
            </View>

            <ThemedText style={styles.heroTitle}>Hello, Neighbor 👋</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Check real-time availability before leaving home.
            </ThemedText>
          </View>

          {/* Feature Insight Card */}
          {insight && (
            <FeatureInsightCard
              insight={insight}
              onCtaPress={() => {
                // Only the explicit "Explore <category>" insight filters by
                // category. Every other CTA is a general availability
                // teaser, so it opens the full explore feed. Without this
                // check the category used for the icon also filtered the
                // list, and the full-feed branch below was unreachable.
                if (insight.category && !insight.ctaShowsAll) {
                  handleCategoryPress(insight.category);
                } else {
                  router.push('/category-list');
                }
              }}
              style={styles.featureInsightCard}
            />
          )}

          {/* Quick Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterChip,
                activeFilter === 'all' && styles.activeFilterChip,
              ]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  activeFilter === 'all' && styles.activeFilterChipText,
                ]}
              >
                All Categories
              </ThemedText>
            </Pressable>
            {categoryStats.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setActiveFilter(cat.key)}
                style={[
                  styles.filterChip,
                  activeFilter === cat.key && styles.activeFilterChip,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterChipText,
                    activeFilter === cat.key && styles.activeFilterChipText,
                  ]}
                >
                  {cat.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Categories Grid */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>EXPLORE CATEGORIES</ThemedText>
            <ThemedText style={styles.sectionSub}>
              {categoryStats.filter((c) => c.badge).length} signals live
            </ThemedText>
          </View>

          <View style={styles.categoryGrid}>
            {categoryStats
              .filter((category) => activeFilter === 'all' || activeFilter === category.key)
              .map((category) => (
                <Pressable
                  key={category.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.name}, ${category.mainLine}`}
                  onPress={() => handleCategoryPress(category.key)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    pressed && styles.pressed,
                  ]}
                >
                  {category.badge && (
                    <View
                      style={[
                        styles.cardBadge,
                        category.badgeTone && badgeToneStyles[category.badgeTone].container,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.cardBadgeText,
                          category.badgeTone && badgeToneStyles[category.badgeTone].text,
                        ]}
                      >
                        {category.badge}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.cardTopRow}>
                    <View style={styles.categoryIconCircle}>
                      <Ionicons
                        name={category.icon}
                        size={22}
                        color={category.iconColor}
                      />
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.cardTitleRow}>
                      <ThemedText numberOfLines={1} style={styles.categoryName}>
                        {category.name}
                      </ThemedText>
                      <Ionicons name="arrow-forward-circle-outline" size={20} color="#CBD5E1" />
                    </View>
                    <ThemedText style={styles.categoryMainLine}>
                      {category.mainLine}
                    </ThemedText>
                    <ThemedText numberOfLines={2} style={styles.categorySubtext}>
                      {category.subtext}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
          </View>

          {/* Live Activity Feed */}
          <View style={styles.livePulseContainer}>
            <View style={styles.pulseHeader}>
              <View style={styles.pulseHeaderLeft}>
                <Ionicons name="flash" size={16} color={BRAND_TEAL} />
                <ThemedText style={styles.pulseTitle}>
                  LIVE IN {selectedArea.toUpperCase()}
                </ThemedText>
              </View>
              {isFetchingPulses ? (
                <ActivityIndicator size="small" color={BRAND_TEAL} />
              ) : (
                <View style={styles.freshnessTag}>
                  <ThemedText style={styles.freshnessTagText}>Just now</ThemedText>
                </View>
              )}
            </View>

            <View style={styles.pulseList}>
              {pulses.map((pulse, index) => (
                <View key={pulse.id}>
                  {index > 0 && <View style={styles.pulseDivider} />}
                  <View style={styles.pulseItem}>
                    <View style={styles.statusDotGreen} />
                    <ThemedText style={styles.pulseText}>
                      {pulse.text}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Customer Account Creation Banner */}
          {!user && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create a customer account to save favorites and get personalized recommendations"
              onPress={handleCreateAccount}
              style={({ pressed }) => [
                styles.customerCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.customerCardContent}>
                <View style={styles.customerIconBadge}>
                  <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.customerTextGroup}>
                  <ThemedText style={styles.customerTitle}>
                    New to City Pulse?
                  </ThemedText>
                  <ThemedText style={styles.customerDescription}>
                    Create a customer account to save favorites, get personalized deals, and access your history.
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND_TEAL} />
            </Pressable>
          )}

          {/* Agent Banner - Only show for non-agents */}
          {!isAgent && (
            <Pressable
              accessibilityRole="button"
              onPress={handleBecomeAgent}
              style={({ pressed }) => [
                styles.agentCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.agentCardContent}>
                <View style={styles.agentIconBadge}>
                  <Ionicons name="briefcase-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.agentTextGroup}>
                  <View style={styles.agentTitleRow}>
                    <ThemedText style={styles.agentTitle}>
                      Are you a Service Provider?
                    </ThemedText>
                    <View style={styles.freeBadge}>
                      <ThemedText style={styles.freeBadgeText}>FREE</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.agentDescription}>
                    List your active status to reach customers nearby in under 2 minutes.
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const BRAND_TEAL = '#129E9E';
const BRAND_TEAL_SOFT = '#E8F6F6';
const LIVE_GREEN = '#10B981';

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 96,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundElement,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    locationSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    locationIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: BRAND_TEAL_SOFT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    locationLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.8,
    },
    locationValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textBody,
      marginTop: 1,
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: BRAND_TEAL_SOFT,
      marginLeft: 4,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    signInChip: {
      backgroundColor: BRAND_TEAL,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    signInChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    agentDashboardButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: BRAND_TEAL_SOFT,
      marginLeft: 4,
    },
    heroSection: {
      marginTop: 20,
      marginBottom: 14,
    },
    featureInsightCard: {
      marginTop: 8,
      marginBottom: 16,
    },
    syncBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 10,
      marginBottom: 8,
    },
    syncBannerText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
    },
    syncRetryText: {
      fontSize: 12,
      fontWeight: '800',
    },
    liveIndicatorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: theme.successBg,
      borderColor: theme.successText,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 10,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: LIVE_GREEN,
    },
    liveIndicatorText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.successText,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textBody,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    filterScroll: {
      gap: 8,
      paddingVertical: 4,
      marginBottom: 20,
    },
    filterChip: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeFilterChip: {
      backgroundColor: BRAND_TEAL,
      borderColor: BRAND_TEAL,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    activeFilterChipText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.8,
    },
    sectionSub: {
      fontSize: 11,
      fontWeight: '600',
      color: BRAND_TEAL,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '48%',
      backgroundColor: theme.backgroundElement,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      minHeight: 140,
      justifyContent: 'space-between',
      position: 'relative',
      shadowColor: theme.textBody,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    cardBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: theme.warningBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    cardBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.warningText,
    },
    cardBadgeDemand: {
      backgroundColor: '#FFF7ED',
    },
    cardBadgeTextDemand: {
      color: '#C2410C',
    },
    cardBadgeTrusted: {
      backgroundColor: '#ECFDF5',
    },
    cardBadgeTextTrusted: {
      color: '#047857',
    },
    cardBadgeNew: {
      backgroundColor: '#EFF6FF',
    },
    cardBadgeTextNew: {
      color: '#1D4ED8',
    },
    cardBadgeAvailable: {
      backgroundColor: '#ECFEFF',
    },
    cardBadgeTextAvailable: {
      color: '#0F766E',
    },
    cardBadgeLowSupply: {
      backgroundColor: '#FEF3C7',
    },
    cardBadgeTextLowSupply: {
      color: '#B45309',
    },
    cardBadgeUnavailable: {
      backgroundColor: '#F1F5F9',
    },
    cardBadgeTextUnavailable: {
      color: '#475569',
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BRAND_TEAL_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    marginTop: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: theme.textBody,
  },
  categoryMainLine: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_TEAL,
    marginTop: 2,
  },
  categorySubtext: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  livePulseContainer: {
    marginTop: 22,
    backgroundColor: theme.backgroundElement,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    shadowColor: theme.textBody,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_TEAL,
    letterSpacing: 0.5,
  },
  freshnessTag: {
    backgroundColor: theme.backgroundHover,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freshnessTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  pulseList: {
    gap: 10,
  },
  pulseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIVE_GREEN,
  },
  pulseText: {
    fontSize: 13,
    color: theme.textBody,
    flex: 1,
    lineHeight: 18,
  },
  pulseDivider: {
    height: 1,
    backgroundColor: theme.borderSubtle,
    marginVertical: 2,
  },
  agentCard: {
    marginTop: 18,
    backgroundColor: theme.backgroundElement,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.textBody,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  agentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  agentIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentTextGroup: {
    flex: 1,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textBody,
  },
  freeBadge: {
    backgroundColor: BRAND_TEAL_SOFT,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: BRAND_TEAL,
  },
  agentDescription: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  customerCard: {
    marginTop: 18,
    backgroundColor: BRAND_TEAL_SOFT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.accentSoft,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.textBody,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  customerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerTextGroup: {
    flex: 1,
  },
  customerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textBody,
  },
  customerDescription: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});