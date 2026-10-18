import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentListingsSkeleton } from '@/components/agent-listings-skeleton';
import { ConfirmActionModal } from '@/components/confirm-action-modal';
import { ListingPhoto } from '@/components/listing-photo';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_META, STATUS_META } from '@/data/product';
import { useMyListing } from '@/hooks/use-listings';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/state/app-state';
import { getAgentResumePath } from '@/utils/agent-onboarding';
import { getFreshness } from '@/utils/listing-freshness';

const COLOR_BG = '#FAF6EE';
const COLOR_TEXT = '#0F172A';
const COLOR_MUTED = '#94A3B8';
const COLOR_BORDER = '#E2E8F0';
const COLOR_ACCENT = '#187171';

/**
 * Management view for the provider's single listing.
 */
export default function AgentListingsScreen() {
  const theme = useTheme();

  const { token, user, agentDraft, updateUser } = useAppState();
  const { listing, isLoading, isSyncing, error, isOffline, refresh, setVisibility } = useMyListing(
    token,
    user?.id,
  );

  const isUnpublished = user?.businessProfileVisibility === 'private';

  const [now, setNow] = useState(() => Date.now());
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [skeletonExceeded, setSkeletonExceeded] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setSkeletonExceeded(true), 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const openUnpublishConfirm = () => {
    setPublishError(null);
    setShowUnpublishConfirm(true);
  };

  const handlePublishChange = async () => {
    setPublishError(null);
    const failure = await setVisibility(isUnpublished ? 'public' : 'private');
    if (failure) {
      setPublishError(failure);
      return;
    }
    // Optimistically flip the local user so the notice and button update
    // immediately — the next /auth/me round-trip on focus will confirm.
    updateUser({ businessProfileVisibility: isUnpublished ? 'public' : 'private' });
    setShowUnpublishConfirm(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitles}>
        <ThemedText style={styles.title}>Listings</ThemedText>
        <ThemedText style={styles.subtitle}>
          {listing ? (isUnpublished ? 'Unpublished listing' : 'Live in search results') : 'Manage your business presence'}
        </ThemedText>
      </View>
      {router.canGoBack() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={COLOR_TEXT} />
        </Pressable>
      )}
    </View>
  );

  if (isLoading) {
    if (skeletonExceeded) {
      return (
        <View style={[styles.root]}>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            {renderHeader()}
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLOR_ACCENT} />
              <ThemedText style={styles.centeredText}>
                Loading your listing…
              </ThemedText>
            </View>
          </SafeAreaView>
        </View>
      );
    }
    return <AgentListingsSkeleton />;
  }

  if (error && !listing) {
    return (
      <View style={[styles.root]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centered}>
            <View style={[styles.centeredIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="cloud-offline-outline" size={26} color="#DC2626" />
            </View>
            <ThemedText style={styles.centeredTitle}>
              Could not load your listing
            </ThemedText>
            <ThemedText style={styles.centeredText}>
              {error}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={refresh}
              style={({ pressed }) => [
                styles.retryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <ThemedText style={styles.retryText}>Try again</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!listing) {
    const resumePath = getAgentResumePath(agentDraft) || '/agent-registration-1';

    return (
      <View style={[styles.root]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {renderHeader()}

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.centered}>
              <View style={[styles.centeredIcon, { backgroundColor: '#E6F0F0' }]}>
                <Ionicons name="cube-outline" size={28} color={COLOR_ACCENT} />
              </View>
              <ThemedText style={styles.centeredTitle}>
                No listing yet
              </ThemedText>
              <ThemedText style={styles.centeredText}>
                Publish a listing and it will appear in City Pulse for customers nearby. You can
                edit everything about it later.
              </ThemedText>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(resumePath as never)}
                style={({ pressed }) => [
                  styles.retryBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <ThemedText style={styles.retryText}>Add a listing</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const categoryMeta = CATEGORY_META[listing.category];
  const statusMeta = STATUS_META[listing.status];
  const freshness = getFreshness(listing.updatedAt, now);
  const coverPhotoUri = listing.photos?.[0]?.url;

  return (
    <View style={[styles.root]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {renderHeader()}

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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isUnpublished ? (
            <View style={styles.unpublishedNotice}>
              <Ionicons name="eye-off-outline" size={18} color="#B45309" />
              <ThemedText style={styles.unpublishedNoticeText}>
                Your listing is unpublished, so customers cannot find you in search. Everything is
                saved — publish it again whenever you are ready.
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.intro}>
              This is the listing customers see when they search {categoryMeta?.shortLabel ?? 'City Pulse'}.
            </ThemedText>
          )}

          <View style={[styles.card]}>
            <View style={styles.cardTopRow}>
              {coverPhotoUri ? (
                <ListingPhoto uri={coverPhotoUri} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
                  <Ionicons name="storefront-outline" size={22} color={COLOR_MUTED} />
                </View>
              )}

              <View style={styles.cardInfo}>
                <View style={styles.eyebrowRow}>
                  <ThemedText style={styles.eyebrow}>
                    {isUnpublished ? 'UNPUBLISHED LISTING' : 'LIVE LISTING'}
                  </ThemedText>
                  <View style={styles.categoryBadge}>
                    <ThemedText style={styles.categoryBadgeText}>
                      {categoryMeta?.label ?? 'Listing'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.businessName} numberOfLines={1}>
                  {listing.name}
                </ThemedText>
                <ThemedText style={styles.previewLine} numberOfLines={1}>
                  {listing.area} • {listing.price}
                </ThemedText>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="star" size={13} color="#D97706" />
                <ThemedText style={styles.metaText}>
                  {listing.trust.toFixed(1)} Trust Score
                </ThemedText>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaBadge}>
                <Ionicons
                  name={freshness?.isExpired ? 'alert-circle-outline' : 'time-outline'}
                  size={13}
                  color={freshness?.isExpired ? '#DC2626' : COLOR_ACCENT}
                />
                <ThemedText
                  style={[
                    styles.metaText,
                    {
                      color: freshness?.isExpired ? '#DC2626' : COLOR_ACCENT,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {freshness?.label ?? 'Update your status to start the clock'}
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBanner,
                { backgroundColor: statusMeta.background, borderColor: `${statusMeta.color}25` },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <ThemedText style={[styles.statusLabel, { color: statusMeta.color }]}>
                {statusMeta.label}
                {isSyncing ? ' (Syncing…)' : ''}
              </ThemedText>
            </View>
            </View>

            <ThemedText style={styles.sectionLabel}>
            MANAGEMENT
          </ThemedText>

          <View style={styles.actionStack}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/provider-detail', params: { id: listing.id } })
              }
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="eye-outline" size={18} color={COLOR_ACCENT} />
              </View>
              <View style={styles.actionCopy}>
                <ThemedText style={styles.actionTitle}>
                  View your published listing
                </ThemedText>
                <ThemedText style={styles.actionText}>
                  Exactly what customers see, with your photos and current status
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLOR_MUTED} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/agent-edit-listing')}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="create-outline" size={18} color={COLOR_ACCENT} />
              </View>
              <View style={styles.actionCopy}>
                <ThemedText style={styles.actionTitle}>
                  Edit listing details
                </ThemedText>
                <ThemedText style={styles.actionText}>
                  Update your service rate, photos, and contact details
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLOR_MUTED} />
            </Pressable>
          </View>

          <ThemedText style={styles.publishNote}>
            {isUnpublished
              ? 'Your listing is kept exactly as it is. Publishing puts it back in search straight away, with every detail and photo still in place.'
              : 'Unpublishing takes your listing out of search results. Nothing is deleted, and you can publish it again at any time.'}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            onPress={openUnpublishConfirm}
            disabled={isSyncing}
            style={({ pressed }) => [
              styles.publishButton,
              {
                backgroundColor: isUnpublished ? COLOR_ACCENT : 'transparent',
                borderColor: isUnpublished ? COLOR_ACCENT : COLOR_BORDER,
              },
              pressed && styles.pressed,
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={isUnpublished ? '#FFFFFF' : COLOR_TEXT} />
            ) : (
              <>
                <Ionicons
                  name={isUnpublished ? 'megaphone-outline' : 'eye-off-outline'}
                  size={18}
                  color={isUnpublished ? '#FFFFFF' : COLOR_TEXT}
                />
                <ThemedText
                  style={[
                    styles.publishButtonText,
                    { color: isUnpublished ? '#FFFFFF' : COLOR_TEXT },
                  ]}
                >
                  {isUnpublished ? 'Publish listing again' : 'Unpublish listing'}
                </ThemedText>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <ConfirmActionModal
        visible={showUnpublishConfirm}
        title={isUnpublished ? 'Publish this listing again?' : 'Unpublish this listing?'}
        message={
          isUnpublished
            ? `${listing.name} will appear in City Pulse search results again, exactly as you left it.`
            : `${listing.name} will no longer appear in City Pulse search results, so customers cannot find you. Nothing is deleted, and you can publish it again at any time.`
        }
        confirmLabel={isUnpublished ? 'Publish' : 'Unpublish'}
        icon={isUnpublished ? 'megaphone-outline' : 'eye-off-outline'}
        destructive={!isUnpublished}
        isConfirming={isSyncing}
        error={publishError}
        onCancel={() => setShowUnpublishConfirm(false)}
        onConfirm={handlePublishChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR_BG },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitles: { flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: COLOR_TEXT },
  subtitle: { fontSize: 13, color: COLOR_MUTED, marginTop: 2 },
  pressed: { opacity: 0.7 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: COLOR_MUTED,
    paddingVertical: 12,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
  },
  offlineBannerText: { flex: 1, fontSize: 12, fontWeight: '500', color: '#B45309' },

  unpublishedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
  },
  unpublishedNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#B45309',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  centeredIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centeredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLOR_TEXT,
    textAlign: 'center',
  },
  centeredText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLOR_MUTED,
    textAlign: 'center',
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLOR_ACCENT,
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: '#FFFFFF',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  thumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  cardInfo: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLOR_MUTED,
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#E6F0F0',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLOR_ACCENT,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLOR_TEXT,
    marginBottom: 2,
  },
  previewLine: {
    fontSize: 11,
    fontWeight: '500',
    color: COLOR_MUTED,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
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
    color: COLOR_TEXT,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLOR_BORDER,
  },
  statusBanner: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLOR_MUTED,
    marginTop: 20,
    marginBottom: 8,
  },
  actionStack: {
    gap: 10,
  },
  action: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: '#FFFFFF',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#E6F0F0',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_TEXT,
  },
  actionText: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
    color: COLOR_MUTED,
  },

  publishNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: COLOR_MUTED,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});