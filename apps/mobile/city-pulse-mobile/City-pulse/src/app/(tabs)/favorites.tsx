import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Listing, STATUS_META } from '@/data/product';
import { useListings, useSyncedListings } from '@/hooks/use-listings';
import { useAppState } from '@/state/app-state';

const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_PRIMARY = '#129E9E';
const COLOR_DANGER = '#EF4444';

export default function FavoritesScreen() {
  const { favorites, toggleFavorite, syncFavorites } = useAppState();
  // Keeps favouriting a freshly published listing working, since its id only
  // exists on the API until the store has synced.
  useSyncedListings();
  const listings = useListings();

  // Saved listings are account-scoped, so this tab is the place the user is most
  // likely to have changed them elsewhere (another device, or the web app).
  // Refreshing on focus keeps the tab honest without polling.
  useFocusEffect(
    useCallback(() => {
      void syncFavorites();
    }, [syncFavorites])
  );

  // Resolving through the synced array (rather than getListing) keeps this
  // derived from state the hook already tracks, so a live listing that arrives
  // after a sync is picked up without any hidden module-state dependency.
  const listingsById = useMemo(
    () => new Map(listings.map((listing) => [listing.id, listing])),
    [listings]
  );

  const favoriteListings = useMemo<Listing[]>(
    () =>
      favorites
        .map((id) => listingsById.get(id))
        .filter((listing): listing is Listing => listing !== undefined),
    [favorites, listingsById]
  );

  const handlePress = useCallback((item: Listing) => {
    router.push(`/provider-detail?id=${item.id}`);
  }, []);

  const handleToggleFavorite = useCallback(
    (item: Listing) => {
      toggleFavorite(item.id);
    },
    [toggleFavorite],
  );

  const renderItem = ({ item }: { item: Listing }) => {
    const status = STATUS_META[item.status] || {
      label: item.status.toUpperCase(),
      background: '#F1F5F9',
      color: COLOR_TEXT_MUTED,
    };
    const isFavorited = favorites.includes(item.id);

    return (
      <Pressable
        key={item.id}
        accessibilityRole="button"
        onPress={() => handlePress(item)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
          <View style={styles.cardMainRow}>
            <View style={styles.titleArea}>
              <ThemedText style={styles.providerTitle}>{item.name}</ThemedText>
              <ThemedText style={styles.subDetail}>{item.area || 'Okemason'}</ThemedText>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle favorite"
                onPress={(event) => {
                  event.stopPropagation();
                  handleToggleFavorite(item);
                }}
                style={({ pressed }) => [
                  styles.favoriteBtn,
                  pressed && styles.pressed,
                  isFavorited && styles.favoriteBtnActive,
                ]}
              >
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorited ? COLOR_DANGER : COLOR_TEXT_MUTED}
                />
              </Pressable>
              <Ionicons name="chevron-forward" size={16} color={COLOR_TEXT_MUTED} />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={[styles.statusPill, { backgroundColor: status.background }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <ThemedText style={[styles.statusLabel, { color: status.color }]}>
                {status.label}
              </ThemedText>
            </View>

            <ThemedText style={styles.priceValue}>{item.price}</ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>
          <ThemedText style={styles.title}>Favorites</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {favoriteListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={COLOR_TEXT_MUTED} />
            <ThemedText style={styles.emptyText}>No favorites yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Tap the heart icon on any service to save it here.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={favoriteListings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR_BG },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  header: {
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },
  headerSpacer: { flex: 1 },
  pressed: { opacity: 0.85 },
  listContent: {
    paddingVertical: 8,
    gap: 14,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    overflow: 'hidden',
  },
  cardCover: {
    width: '100%',
    height: 110,
  },
  cardContent: {
    padding: 12,
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
  cardActions: {
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
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
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR_TEXT_MAIN,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
