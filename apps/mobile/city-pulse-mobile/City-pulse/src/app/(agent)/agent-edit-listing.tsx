import { useNavigation, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListingPhoto } from '@/components/listing-photo';
import { useMyListing } from '@/hooks/use-listings';
import { useAppState } from '@/state/app-state';
import { PULSE_STATUS_BY_AVAILABILITY, updatePulse } from '@/utils/listing-sync';
import { uploadListingPhotos } from '@/utils/listing-photos';
import {
  MAX_LISTING_PHOTOS,
  PickSource,
  pickImage,
  processListingImage,
} from '@/utils/image-upload';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/utils/api-client';
import { CATEGORY_META, type Availability, type Category } from '@/data/product';
import { getAgentResumePath } from '@/utils/agent-onboarding';
import { AgentEditListingSkeleton } from '@/components/agent-edit-listing-skeleton';

type Theme = ReturnType<typeof useTheme>;

const COLOR_WHITE = '#FFFFFF';
const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  verve: 'Verve',
};

/** A photo the user is editing. `path` is what the API stores; `url` previews it. */
type EditPhoto = {
  key: string;
  path: string;
  url: string;
  caption: string;
};

/**
 * Category-specific fields the provider is allowed to change. Everything else in
 * the stored `details` blob is carried through untouched, because the API
 * re-validates the whole object on every write and a half-sent blob is rejected.
 */
type DetailsDraft = {
  feePer5000: string;
  maxCashLimit: string;
  cardBrands: string[];
  pricePerKg: string;
  pricePerCylinder: string;
  homeDelivery: boolean;
  deliveryCharge: string;
  menuItems: { name: string; price: string }[];
  whatsappOrdering: boolean;
  propertyTypes: string;
  rentMin: string;
  rentMax: string;
  coveredAreas: string;
};

function toNumber(value: string): number | undefined {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detailsToDraft(details: Record<string, unknown> | undefined): DetailsDraft {
  const raw = (details || {}) as Record<string, unknown>;
  const menuItems = Array.isArray(raw.menuItems) ? raw.menuItems : [];

  return {
    feePer5000: toStringValue(raw.feePer5000),
    maxCashLimit: toStringValue(raw.maxCashLimit),
    cardBrands: toList(raw.acceptedCardBrands),
    pricePerKg: toStringValue(raw.pricePerKg),
    pricePerCylinder: toStringValue(raw.pricePerCylinder),
    homeDelivery: raw.homeDeliveryEnabled === true,
    deliveryCharge: toStringValue(raw.deliveryCharge),
    menuItems: (menuItems as Record<string, unknown>[])
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ name: toStringValue(item.name), price: toStringValue(item.price) })),
    whatsappOrdering: raw.whatsappOrderingEnabled === true,
    propertyTypes: toList(raw.propertyTypes).join(', '),
    rentMin: toStringValue(raw.rentRangeMin),
    rentMax: toStringValue(raw.rentRangeMax),
    coveredAreas: toList(raw.coveredAreas).join(', '),
  };
}

/**
 * Rebuilds the `details` blob from the draft. Returns an error string instead of
 * a value when the category's required fields are missing, so the screen can
 * explain the problem rather than let the API reject the whole save.
 */
function draftToDetails(
  category: Category,
  draft: DetailsDraft,
  base: Record<string, unknown> | undefined
): { details?: Record<string, unknown>; error?: string } {
  const merged: Record<string, unknown> = { ...(base || {}) };

  if (category === 'pos') {
    const feePer5000 = toNumber(draft.feePer5000);
    if (!feePer5000) return { error: 'POS listings need a withdrawal fee per N5,000.' };
    merged.feePer5000 = feePer5000;
    merged.acceptedCardBrands = draft.cardBrands;

    const maxCashLimit = toNumber(draft.maxCashLimit);
    if (maxCashLimit) merged.maxCashLimit = maxCashLimit;
    else delete merged.maxCashLimit;

    return { details: merged };
  }

  if (category === 'gas') {
    const pricePerKg = toNumber(draft.pricePerKg);
    if (!pricePerKg) return { error: 'Gas listings need a price per KG.' };
    merged.pricePerKg = pricePerKg;

    const pricePerCylinder = toNumber(draft.pricePerCylinder);
    if (pricePerCylinder) merged.pricePerCylinder = pricePerCylinder;
    else delete merged.pricePerCylinder;

    merged.homeDeliveryEnabled = draft.homeDelivery;

    // Only meaningful while delivery is on, so it is cleared rather than left
    // behind as an orphan number the customer would never see.
    const deliveryCharge = toNumber(draft.deliveryCharge);
    if (draft.homeDelivery && deliveryCharge) merged.deliveryCharge = deliveryCharge;
    else delete merged.deliveryCharge;

    return { details: merged };
  }

  if (category === 'food') {
    const menuItems = draft.menuItems
      .map((item) => ({ name: item.name.trim(), price: toNumber(item.price) ?? 0 }))
      .filter((item) => item.name);
    if (menuItems.length === 0) {
      return { error: 'Food listings need at least one menu item.' };
    }
    merged.menuItems = menuItems;
    merged.whatsappOrderingEnabled = draft.whatsappOrdering;

    // Food vendors offer home delivery on the same terms as gas vendors: a flag,
    // and an optional charge. Collected during onboarding, editable here.
    merged.homeDeliveryEnabled = draft.homeDelivery;
    const deliveryCharge = toNumber(draft.deliveryCharge);
    if (draft.homeDelivery && deliveryCharge) merged.deliveryCharge = deliveryCharge;
    else delete merged.deliveryCharge;

    return { details: merged };
  }

  const propertyTypes = splitList(draft.propertyTypes);
  const coveredAreas = splitList(draft.coveredAreas);
  if (propertyTypes.length === 0 || coveredAreas.length === 0) {
    return { error: 'House listings need at least one property type and one covered area.' };
  }
  merged.propertyTypes = propertyTypes;
  merged.coveredAreas = coveredAreas;

  const rentRangeMin = toNumber(draft.rentMin);
  const rentRangeMax = toNumber(draft.rentMax);
  if (rentRangeMin) merged.rentRangeMin = rentRangeMin;
  else delete merged.rentRangeMin;
  if (rentRangeMax) merged.rentRangeMax = rentRangeMax;
  else delete merged.rentRangeMax;

  return { details: merged };
}

function availabilityTone(value: Availability, theme: Theme) {
  switch (value) {
    case 'available':
      return { label: 'Available', color: theme.successText, background: theme.successBg, icon: 'checkmark-circle' };
    case 'low_supply':
      return { label: 'Low Supply', color: theme.warningText, background: theme.warningBg, icon: 'warning' };
    case 'unavailable':
      return { label: 'Unavailable', color: theme.dangerText, background: theme.dangerBg, icon: 'close-circle' };
    default:
      return { label: 'Unconfirmed', color: theme.textSecondary, background: theme.unconfirmedBg, icon: 'help-circle' };
  }
}

export default function AgentEditListingScreen() {
  const { token, agentDraft, user } = useAppState();
  const { listing, isLoading, error, refresh, setStatus } = useMyListing(token, user?.id);
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [skeletonExceeded, setSkeletonExceeded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  // Tracked separately from isDirty because `details` is the one field the API
  // re-validates against the category on every write. Sending it back unchanged
  // would block a photo-only edit if a legacy listing already had details the
  // current rules reject.
  const [detailsDirty, setDetailsDirty] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!isDirty) return;

    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault();
      if (isSaving) {
        Alert.alert('Save in progress', 'Please wait for the listing update to finish.');
        return;
      }

      Alert.alert(
        'Discard unsaved changes?',
        'Your listing edits have not been saved. Leave this page and discard them?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ],
      );
    });
  }, [isDirty, isSaving, navigation]);

  // A skeleton that freezes for more than ~2.5s feels broken, so after that
  // threshold we swap in a spinner with a message so the user knows we are
  // still working rather than stuck.
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setSkeletonExceeded(true), 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const [descriptionInput, setDescriptionInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [photos, setPhotos] = useState<EditPhoto[]>([]);
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft>(() => detailsToDraft(undefined));

  // Sync form fields when the listing record changes (e.g. after a refresh).
  // The business name, area and street address are fixed after publishing, so
  // they render straight from `listing` and are deliberately not held in state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (listing) {
      setDescriptionInput(listing.detail || '');
      setPhoneInput(listing.phone || '');
      setEmailInput(listing.email || '');
      setWhatsappInput(listing.whatsapp || '');
      setPhotos(
        listing.photos?.map((photo, index) => ({
          key: photo.path || `${listing.id}-${index}`,
          path: photo.path || '',
          url: photo.url,
          caption: photo.caption || '',
        })) || [],
      );
      setDetailsDraft(detailsToDraft(listing.details));
    }
  }, [listing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const markDirty = () => setIsDirty(true);
  const markDetailsDirty = () => {
    setDetailsDirty(true);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!listing) return;
    setFormError(null);
    setIsSaving(true);
    try {
      let details: Record<string, unknown> | undefined;
      if (detailsDirty) {
        const built = draftToDetails(
          listing.category as Category,
          detailsDraft,
          listing.details,
        );
        if (built.error) {
          setFormError(built.error);
          return;
        }
        details = built.details;
      }

      await updatePulse(
        listing.id,
        {
          // Only editable fields are sent. title/location/address/category and
          // the map coordinates are fixed once published and the API rejects
          // them, so sending them here would fail the whole save.
          // Sent even when blank so a provider can actually clear a field. The
          // old code dropped empties, which silently kept the old value.
          description: descriptionInput.trim(),
          contactPhone: phoneInput.trim() || listing.phone,
          email: emailInput.trim(),
          whatsapp: whatsappInput.trim(),
          images: photos.map((photo, index) => ({
            path: photo.path,
            caption: photo.caption.trim(),
            isCover: index === 0,
          })),
          details,
        },
        token,
      );

      setIsDirty(false);
      refresh();
      Alert.alert('Success', 'Your listing has been updated.');
      router.back();
    } catch (err: unknown) {
      setFormError(
        `${describeError(err, 'Could not update your listing.')} Your changes are still here; retry when ready.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Availability has its own endpoint, so it is written on tap rather than
   * riding along with the form save. The previous version sent it inside the
   * PUT, where the API drops the field entirely — which is why the selector
   * never appeared to do anything.
   */
  const handleStatusChange = async (next: Availability) => {
    setFormError(null);
    const ok = await setStatus(PULSE_STATUS_BY_AVAILABILITY[next]);
    if (!ok) {
      setFormError('We could not update your availability. Please try again.');
    }
  };

  const handleAddPhotos = async (source: PickSource) => {
    setShowPhotoPicker(false);
    const asset = await pickImage(source);
    if (!asset) return;

    if (photos.length >= MAX_LISTING_PHOTOS) {
      Alert.alert('Photo Limit', `A listing can have up to ${MAX_LISTING_PHOTOS} photos.`);
      return;
    }

    setIsUploading(true);
    setFormError(null);
    try {
      // The picked URI is normalised first. On Android a raw picker URI can be
      // unreadable by the app's own fetch, and uploading it as-is stored a
      // placeholder file that the API happily served back as a broken photo.
      const processed = await processListingImage(asset.uri);

      const uploaded = await uploadListingPhotos(
        [{ id: Date.now().toString(), uri: processed.uri, caption: '' }],
        token,
      );
      const result = uploaded[0];
      if (!result?.path) {
        throw new Error('That photo did not upload. Please check your connection and try again.');
      }

      setPhotos((prev) => [
        ...prev,
        { key: `${Date.now()}`, path: result.path, url: result.url, caption: '' },
      ]);
      setIsDirty(true);
    } catch (err: any) {
      setFormError(err.message || 'We could not add that photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.key !== key));
    setIsDirty(true);
  };

  const handleMakeCover = (key: string) => {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.key === key);
      if (!target) return prev;
      return [target, ...prev.filter((photo) => photo.key !== key)];
    });
    setIsDirty(true);
  };

  const handleUpdateCaption = (key: string, caption: string) => {
    setPhotos((prev) => prev.map((photo) => (photo.key === key ? { ...photo, caption } : photo)));
    setIsDirty(true);
  };

  if (isLoading) {
    if (skeletonExceeded) {
      return (
        <ThemedView style={styles.screen}>
          <SafeAreaView style={[styles.safeArea, styles.centeredState]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <ThemedText style={styles.centeredText}>Loading your listing…</ThemedText>
          </SafeAreaView>
        </ThemedView>
      );
    }

    return <AgentEditListingSkeleton />;
  }

  // Reached when the load finished without a listing: either it failed, or the
  // provider has nothing published. Both used to render an endless spinner.
  if (!listing) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textBody} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Edit Listing</ThemedText>
            <View style={styles.saveBtnPlaceholder} />
          </View>

          <View style={styles.centeredState}>
            <View style={[styles.stateIcon, error && { backgroundColor: theme.dangerBg }]}>
              <Ionicons
                name={error ? 'cloud-offline-outline' : 'document-text-outline'}
                size={34}
                color={error ? theme.dangerText : theme.accent}
              />
            </View>
            <ThemedText style={styles.stateTitle}>
              {error ? 'We could not load your listing' : 'You have not published a listing yet'}
            </ThemedText>
            <ThemedText style={styles.centeredText}>
              {error
                ? error
                : 'Publish a listing first, then you will be able to edit its details, photos and availability here.'}
            </ThemedText>

            <View style={styles.stateActions}>
              {error && (
                <Pressable
                  accessibilityRole="button"
                  onPress={refresh}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Ionicons name="refresh" size={18} color={COLOR_WHITE} />
                  <ThemedText style={styles.primaryButtonText}>Try again</ThemedText>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.replace((getAgentResumePath(agentDraft) || '/agent-registration-1') as never)
                }
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                <ThemedText style={styles.secondaryButtonText}>Create a listing</ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const category = listing.category as Category;
  // A listing created before a category existed in the app (or hand-added via
  // the API) can carry a value CATEGORY_META has no entry for.
  const categoryMeta = CATEGORY_META[category] || { label: 'Service', shortLabel: 'Service', icon: '▣' };
  const tone = availabilityTone(listing.status, theme);
  const coverPhoto = photos[0];
  const busy = isSaving || isUploading;

  // Mirrors summarizePrice() in listing-sync so the preview cannot drift from
  // the price line customers actually see on the card.
  const previewPrice = (() => {
    if (category === 'pos' && toNumber(detailsDraft.feePer5000)) {
      return `N${toNumber(detailsDraft.feePer5000)} per N5,000`;
    }
    if (category === 'gas' && toNumber(detailsDraft.pricePerKg)) {
      return `N${toNumber(detailsDraft.pricePerKg)} per KG`;
    }
    if (category === 'food' && detailsDraft.menuItems.length > 0) {
      const count = detailsDraft.menuItems.filter((item) => item.name.trim()).length;
      return `${count} item${count === 1 ? '' : 's'} on the menu`;
    }
    if (category === 'house' && detailsDraft.propertyTypes.trim()) {
      return splitList(detailsDraft.propertyTypes).join(', ');
    }
    return listing.price;
  })();

  const healthStats = [
    { icon: 'star', label: 'Trust score', value: listing.trust.toFixed(1), color: theme.trustText },
    { icon: 'images', label: 'Photos', value: `${photos.length}/${MAX_LISTING_PHOTOS}`, color: theme.accent },
    { icon: 'time', label: 'Last update', value: listing.updated, color: theme.textSecondary },
    { icon: 'person-circle', label: 'Category', value: categoryMeta.shortLabel, color: theme.accent },
  ];

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textBody} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Edit Listing</ThemedText>
            {isDirty && <ThemedText style={styles.unsavedBadge}>Unsaved changes</ThemedText>}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save listing"
            onPress={handleSave}
            disabled={busy}
            style={({ pressed }) => [
              styles.saveBtn,
              { opacity: busy ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLOR_WHITE} />
            ) : (
              <Ionicons name="save-outline" size={20} color={COLOR_WHITE} />
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={theme.dangerText} />
              <ThemedText style={styles.errorBannerText}>{formError}</ThemedText>
            </View>
          )}

          {/* Listing health */}
          <View style={styles.statRow}>
            {healthStats.map((stat) => (
              <View key={stat.label} style={styles.statTile}>
                <Ionicons name={stat.icon as never} size={15} color={stat.color} />
                <ThemedText style={styles.statValue} numberOfLines={1}>
                  {stat.value}
                </ThemedText>
                <ThemedText style={styles.statLabel} numberOfLines={1}>
                  {stat.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Live preview of what customers see */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionTitle}>CUSTOMER PREVIEW</ThemedText>
              <ThemedText style={styles.sectionHint}>Updates as you type</ThemedText>
            </View>

            <View style={styles.previewCard}>
              <View style={styles.previewCover}>
                {coverPhoto ? (
                  <ListingPhoto uri={coverPhoto.url} style={styles.previewCoverImage} />
                ) : (
                  <View style={styles.previewCoverEmpty}>
                    <Ionicons name="image-outline" size={22} color={theme.textSecondary} />
                    <ThemedText style={styles.previewCoverEmptyText}>Add a cover photo below</ThemedText>
                  </View>
                )}
                <View style={[styles.previewStatusPill, { backgroundColor: tone.background }]}>
                  <View style={[styles.statusDot, { backgroundColor: tone.color }]} />
                  <ThemedText style={[styles.previewStatusText, { color: tone.color }]}>
                    {tone.label}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.previewBody}>
                <View style={styles.previewTitleRow}>
                  <ThemedText style={styles.previewName} numberOfLines={1}>
                    {listing.name || 'Your business name'}
                  </ThemedText>
                  <View style={styles.previewRating}>
                    <Ionicons name="star" size={11} color={theme.trustText} />
                    <ThemedText style={styles.previewRatingText}>{listing.trust.toFixed(1)}</ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.previewMeta} numberOfLines={1}>
                  {listing.area} • {listing.distance}
                </ThemedText>

                <View style={styles.previewPriceBox}>
                  <ThemedText style={styles.previewPriceLabel}>RATE / FEE</ThemedText>
                  <ThemedText style={styles.previewPrice} numberOfLines={1}>
                    {previewPrice}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionTitle}>LISTING PHOTOS</ThemedText>
              <ThemedText style={styles.sectionHint}>
                {photos.length} of {MAX_LISTING_PHOTOS}
              </ThemedText>
            </View>

            <View style={styles.photoManagement}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.key}
                  accessibilityRole="button"
                  accessibilityLabel={index === 0 ? 'Cover photo' : `Make photo ${index + 1} the cover`}
                  onPress={() => handleMakeCover(photo.key)}
                  style={({ pressed }) => [styles.photoThumbContainer, pressed && styles.pressed]}
                >
                  <ListingPhoto uri={photo.url} style={styles.photoThumb} />
                  {index === 0 ? (
                    <View style={styles.coverBadge}>
                      <Ionicons name="star" size={9} color={COLOR_WHITE} />
                      <ThemedText style={styles.coverBadgeText}>COVER</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.setCoverHint}>
                      <Ionicons name="arrow-up-circle" size={13} color={COLOR_WHITE} />
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}
                    onPress={() => handleRemovePhoto(photo.key)}
                    style={styles.removePhotoBtn}
                  >
                    <Ionicons name="close-circle" size={18} color={theme.dangerText} />
                  </Pressable>
                </Pressable>
              ))}

              {photos.length < MAX_LISTING_PHOTOS && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo"
                  onPress={() => setShowPhotoPicker(true)}
                  style={({ pressed }) => [styles.addPhotoBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={24} color={theme.accent} />
                  <ThemedText style={styles.addPhotoText}>Add</ThemedText>
                </Pressable>
              )}
            </View>

            {photos.length > 0 && (
              <View style={styles.captionGroup}>
                <ThemedText style={styles.inputLabel}>
                  Caption for the cover photo
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={coverPhoto.caption}
                  onChangeText={(value) => handleUpdateCaption(coverPhoto.key, value)}
                  placeholder="e.g. Our shop front on Ibara Road"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={120}
                />
              </View>
            )}

            {isUploading && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <ThemedText style={styles.uploadingText}>Preparing and uploading photo…</ThemedText>
              </View>
            )}

            {photos.length === 0 && (
              <ThemedText style={styles.helperText}>
                Listings with a cover photo get far more neighbours reaching out. The first photo is the cover
                customers see on cards.
              </ThemedText>
            )}
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionTitle}>AVAILABILITY STATUS</ThemedText>
              <ThemedText style={styles.sectionHint}>Saved instantly</ThemedText>
            </View>

            <View style={styles.statusSelector}>
              {(['available', 'low_supply', 'unavailable'] as Availability[]).map((value) => {
                const option = availabilityTone(value, theme);
                const isSelected = listing.status === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleStatusChange(value)}
                    style={({ pressed }) => [
                      styles.statusOption,
                      isSelected && { backgroundColor: option.background, borderColor: option.color },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? (option.icon as never) : 'ellipse-outline'}
                      size={16}
                      color={isSelected ? option.color : theme.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.statusOptionText,
                        { color: isSelected ? option.color : theme.textSecondary },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {listing.status === 'unconfirmed' && (
              <View style={styles.noticeRow}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
                <ThemedText style={styles.helperText}>
                  Until you set an availability, neighbours see your listing as unconfirmed.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Service details */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>SERVICE DETAILS</ThemedText>

            {(category === 'pos' || category === 'gas') && (
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.inputLabel}>
                    {category === 'pos' ? 'Fee per N5,000' : 'Price per KG'}
                  </ThemedText>
                  <View style={styles.inputWithPrefix}>
                    <ThemedText style={styles.inputPrefix}>N</ThemedText>
                    <TextInput
                      style={styles.textInputFlush}
                      value={category === 'pos' ? detailsDraft.feePer5000 : detailsDraft.pricePerKg}
                      onChangeText={(value) => {
                        markDetailsDirty();
                        setDetailsDraft((draft) => ({
                          ...draft,
                          feePer5000: category === 'pos' ? value : draft.feePer5000,
                          pricePerKg: category === 'gas' ? value : draft.pricePerKg,
                        }));
                      }}
                      placeholder="150"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.inputLabel}>
                    {category === 'pos' ? 'Max cash limit' : '12.5KG cylinder'}
                  </ThemedText>
                  <View style={styles.inputWithPrefix}>
                    <ThemedText style={styles.inputPrefix}>N</ThemedText>
                    <TextInput
                      style={styles.textInputFlush}
                      value={
                        category === 'pos' ? detailsDraft.maxCashLimit : detailsDraft.pricePerCylinder
                      }
                      onChangeText={(value) => {
                        markDetailsDirty();
                        setDetailsDraft((draft) => ({
                          ...draft,
                          maxCashLimit: category === 'pos' ? value : draft.maxCashLimit,
                          pricePerCylinder: category === 'gas' ? value : draft.pricePerCylinder,
                        }));
                      }}
                      placeholder="Optional"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {category === 'pos' && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Cards you accept</ThemedText>
                <View style={styles.chipRow}>
                  {Object.keys(CARD_BRAND_LABELS).map((brand) => {
                    const isOn = detailsDraft.cardBrands.includes(brand);
                    return (
                      <Pressable
                        key={brand}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isOn }}
                        onPress={() => {
                          markDetailsDirty();
                          setDetailsDraft((draft) => ({
                            ...draft,
                            cardBrands: isOn
                              ? draft.cardBrands.filter((item) => item !== brand)
                              : [...draft.cardBrands, brand],
                          }));
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          isOn && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name={isOn ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={isOn ? theme.accent : theme.textSecondary}
                        />
                        <ThemedText style={[styles.chipText, isOn && { color: theme.accent }]}>
                          {CARD_BRAND_LABELS[brand]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {(category === 'gas' || category === 'food') && (
              <View style={styles.inputGroup}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleCopy}>
                    <ThemedText style={styles.inputLabel}>Home delivery</ThemedText>
                    <ThemedText style={styles.helperText}>
                      {category === 'gas'
                        ? 'Offer to drop cylinders at the door'
                        : 'Offer to bring the order to the customer'}
                    </ThemedText>
                  </View>
                  <Switch
                    value={detailsDraft.homeDelivery}
                    onValueChange={(value) => {
                      markDetailsDirty();
                      setDetailsDraft((draft) => ({ ...draft, homeDelivery: value }));
                    }}
                    trackColor={{ true: theme.accent }}
                  />
                </View>

                {detailsDraft.homeDelivery && (
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Delivery charge (optional)</ThemedText>
                    <View style={styles.inputWithPrefix}>
                      <ThemedText style={styles.inputPrefix}>N</ThemedText>
                      <TextInput
                        style={styles.textInputFlush}
                        value={detailsDraft.deliveryCharge}
                        onChangeText={(value) => {
                          markDetailsDirty();
                          setDetailsDraft((draft) => ({ ...draft, deliveryCharge: value }));
                        }}
                        placeholder="500"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {category === 'food' && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Menu</ThemedText>
                {detailsDraft.menuItems.map((item, index) => (
                  <View key={index} style={styles.menuRow}>
                    <TextInput
                      style={[styles.textInput, styles.menuName]}
                      value={item.name}
                      onChangeText={(value) => {
                        markDetailsDirty();
                        setDetailsDraft((draft) => {
                          const next = [...draft.menuItems];
                          next[index] = { ...next[index], name: value };
                          return { ...draft, menuItems: next };
                        });
                      }}
                      placeholder="Item name"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <View style={styles.inputWithPrefix}>
                      <ThemedText style={styles.inputPrefix}>N</ThemedText>
                      <TextInput
                        style={styles.textInputFlush}
                        value={item.price}
                        onChangeText={(value) => {
                          markDetailsDirty();
                          setDetailsDraft((draft) => {
                            const next = [...draft.menuItems];
                            next[index] = { ...next[index], price: value };
                            return { ...draft, menuItems: next };
                          });
                        }}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name || 'menu item'}`}
                      onPress={() => {
                        markDetailsDirty();
                        setDetailsDraft((draft) => ({
                          ...draft,
                          menuItems: draft.menuItems.filter((_, i) => i !== index),
                        }));
                      }}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    >
                      <Ionicons name="trash-outline" size={17} color={theme.dangerText} />
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    markDetailsDirty();
                    setDetailsDraft((draft) => ({
                      ...draft,
                      menuItems: [...draft.menuItems, { name: '', price: '' }],
                    }));
                  }}
                  style={({ pressed }) => [styles.inlineAddBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="add" size={16} color={theme.accent} />
                  <ThemedText style={styles.inlineAddText}>Add menu item</ThemedText>
                </Pressable>

                <View style={styles.toggleRow}>
                  <View style={styles.toggleCopy}>
                    <ThemedText style={styles.inputLabel}>Take WhatsApp orders</ThemedText>
                  </View>
                  <Switch
                    value={detailsDraft.whatsappOrdering}
                    onValueChange={(value) => {
                      markDetailsDirty();
                      setDetailsDraft((draft) => ({ ...draft, whatsappOrdering: value }));
                    }}
                    trackColor={{ true: theme.accent }}
                  />
                </View>
              </View>
            )}

            {category === 'house' && (
              <>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Property types</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={detailsDraft.propertyTypes}
                    onChangeText={(value) => {
                      markDetailsDirty();
                      setDetailsDraft((draft) => ({ ...draft, propertyTypes: value }));
                    }}
                    placeholder="Self-contained, 2-bedroom flat"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Areas you cover</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={detailsDraft.coveredAreas}
                    onChangeText={(value) => {
                      markDetailsDirty();
                      setDetailsDraft((draft) => ({ ...draft, coveredAreas: value }));
                    }}
                    placeholder="Ibara, Kuto, Saje"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <ThemedText style={styles.inputLabel}>Rent from</ThemedText>
                    <View style={styles.inputWithPrefix}>
                      <ThemedText style={styles.inputPrefix}>N</ThemedText>
                      <TextInput
                        style={styles.textInputFlush}
                        value={detailsDraft.rentMin}
                        onChangeText={(value) => {
                          markDetailsDirty();
                          setDetailsDraft((draft) => ({ ...draft, rentMin: value }));
                        }}
                        placeholder="150000"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <View style={styles.fieldHalf}>
                    <ThemedText style={styles.inputLabel}>Rent to</ThemedText>
                    <View style={styles.inputWithPrefix}>
                      <ThemedText style={styles.inputPrefix}>N</ThemedText>
                      <TextInput
                        style={styles.textInputFlush}
                        value={detailsDraft.rentMax}
                        onChangeText={(value) => {
                          markDetailsDirty();
                          setDetailsDraft((draft) => ({ ...draft, rentMax: value }));
                        }}
                        placeholder="500000"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Business */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>BUSINESS DETAILS</ThemedText>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.inputLabel}>Business name</ThemedText>
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={11} color={theme.textSecondary} />
                  <ThemedText style={styles.lockedTagText}>Fixed</ThemedText>
                </View>
              </View>
              <View style={[styles.inputWithIcon, styles.lockedField]}>
                <Ionicons name="business-outline" size={17} color={theme.textSecondary} style={styles.inputIcon} />
                <ThemedText style={styles.lockedFieldText} numberOfLines={1}>
                  {listing.name || '—'}
                </ThemedText>
              </View>
              <ThemedText style={styles.lockedHint}>
                This is the name customers see and report, so it cannot change after you publish.
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.inputLabel}>What customers should know</ThemedText>
                <ThemedText style={styles.counter}>{descriptionInput.length}/240</ThemedText>
              </View>
              <TextInput
                style={[styles.textInput, styles.multiline]}
                value={descriptionInput}
                onChangeText={(value) => {
                  setDescriptionInput(value);
                  markDirty();
                }}
                placeholder="Opening hours, queue times, what you stock..."
                placeholderTextColor={theme.textSecondary}
                maxLength={240}
                multiline
              />
            </View>
          </View>

          {/* Contact & location */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>CONTACT & LOCATION</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Phone number</ThemedText>
              <View style={styles.inputWithIcon}>
                <Ionicons name="call-outline" size={17} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputFlush}
                  value={phoneInput}
                  onChangeText={(value) => {
                    setPhoneInput(value);
                    markDirty();
                  }}
                  placeholder="080XXXXXXXX"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <ThemedText style={styles.inputLabel}>WhatsApp</ThemedText>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="logo-whatsapp" size={17} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputFlush}
                    value={whatsappInput}
                    onChangeText={(value) => {
                      setWhatsappInput(value);
                      markDirty();
                    }}
                    placeholder="Optional"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldHalf}>
                <ThemedText style={styles.inputLabel}>Email</ThemedText>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="mail-outline" size={17} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputFlush}
                    value={emailInput}
                    onChangeText={(value) => {
                      setEmailInput(value);
                      markDirty();
                    }}
                    placeholder="Optional"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.inputLabel}>Area / neighborhood</ThemedText>
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={11} color={theme.textSecondary} />
                  <ThemedText style={styles.lockedTagText}>Fixed</ThemedText>
                </View>
              </View>
              <View style={[styles.inputWithIcon, styles.lockedField]}>
                <Ionicons name="navigate-outline" size={17} color={theme.textSecondary} style={styles.inputIcon} />
                <ThemedText style={styles.lockedFieldText} numberOfLines={1}>
                  {listing.area || '—'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.inputLabel}>Street address</ThemedText>
                <View style={styles.lockedTag}>
                  <Ionicons name="lock-closed" size={11} color={theme.textSecondary} />
                  <ThemedText style={styles.lockedTagText}>Fixed</ThemedText>
                </View>
              </View>
              <View style={[styles.inputWithIcon, styles.lockedField, styles.lockedFieldMultiline]}>
                <ThemedText style={styles.lockedFieldText} numberOfLines={3}>
                  {listing.address || '—'}
                </ThemedText>
              </View>
              <ThemedText style={styles.lockedHint}>
                Your trust score belongs to this exact spot. If you have genuinely moved, remove this
                listing and publish again from your new location — your score starts fresh there, and
                that is the honest signal for customers.
              </ThemedText>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              disabled={busy}
              style={({ pressed }) => [styles.primaryButton, busy && styles.disabled, pressed && styles.pressed]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLOR_WHITE} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={COLOR_WHITE} />
                  <ThemedText style={styles.primaryButtonText}>Save changes</ThemedText>
                </>
              )}
            </Pressable>

            <ThemedText style={styles.footerHint}>
              {isDirty
                ? 'Your edits are saved only when you tap save.'
                : 'Everything is up to date.'}
            </ThemedText>
          </View>
        </ScrollView>

        {/* Photo Source Sheet */}
        {showPhotoPicker && (
          <View style={styles.sheetOverlay}>
            <Pressable style={styles.sheetBackdrop} onPress={() => setShowPhotoPicker(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <ThemedText style={styles.sheetTitle}>Add Photo</ThemedText>
              <Pressable
                onPress={() => handleAddPhotos('camera')}
                style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
              >
                <Ionicons name="camera" size={24} color={theme.accent} />
                <ThemedText style={styles.sheetOptionText}>Take Photo</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleAddPhotos('library')}
                style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
              >
                <Ionicons name="images" size={24} color={theme.accent} />
                <ThemedText style={styles.sheetOptionText}>From Gallery</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setShowPhotoPicker(false)}
                style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
                <ThemedText style={styles.sheetOptionText}>Cancel</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    safeArea: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pressed: { opacity: 0.85 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.textBody },
    unsavedBadge: { fontSize: 11, fontWeight: '600', color: theme.warningText },
    saveBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnPlaceholder: { width: 40, height: 40 },

    centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    centeredText: { fontSize: 14, lineHeight: 20, color: theme.textSecondary, textAlign: 'center' },
    stateIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stateTitle: { fontSize: 18, fontWeight: '700', color: theme.textBody, textAlign: 'center' },
    stateActions: { gap: 10, marginTop: 8, alignSelf: 'stretch' },

    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.dangerBg,
      borderWidth: 1,
      borderColor: theme.dangerText,
      padding: 12,
      borderRadius: 12,
    },
    errorBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.dangerText },

    statRow: { flexDirection: 'row', gap: 8 },
    statTile: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 10,
      paddingHorizontal: 4,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: { fontSize: 13, fontWeight: '800', color: theme.textBody },
    statLabel: { fontSize: 10, fontWeight: '600', color: theme.textSecondary },

    section: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    sectionHint: { fontSize: 10, fontWeight: '600', color: theme.textTertiary },

    previewCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      overflow: 'hidden',
    },
    previewCover: { height: 132, backgroundColor: theme.backgroundHover },
    previewCoverImage: { width: '100%', height: '100%' },
    previewCoverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    previewCoverEmptyText: { fontSize: 12, color: theme.textSecondary },
    previewStatusPill: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    previewStatusText: { fontSize: 11, fontWeight: '700' },
    previewBody: { padding: 12, gap: 4 },
    previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewName: { flex: 1, fontSize: 16, fontWeight: '800', color: theme.textBody },
    previewRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.warningBg,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    previewRatingText: { fontSize: 11, fontWeight: '800', color: theme.trustText },
    previewMeta: { fontSize: 12, color: theme.textSecondary },
    previewPriceBox: {
      marginTop: 6,
      backgroundColor: theme.accentGlow,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 2,
    },
    previewPriceLabel: { fontSize: 9, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.5 },
    previewPrice: { fontSize: 14, fontWeight: '800', color: theme.accent },

    photoManagement: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    photoThumbContainer: { position: 'relative', width: 84, height: 84 },
    photoThumb: { width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    coverBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      borderBottomLeftRadius: 11,
      borderBottomRightRadius: 11,
      paddingVertical: 3,
    },
    coverBadgeText: { fontSize: 9, fontWeight: '800', color: COLOR_WHITE, letterSpacing: 0.5 },
    setCoverHint: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      borderBottomLeftRadius: 11,
      borderBottomRightRadius: 11,
      paddingVertical: 4,
    },
    removePhotoBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
    },
    addPhotoBtn: {
      width: 84,
      height: 84,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.backgroundHover,
    },
    addPhotoText: { fontSize: 11, fontWeight: '700', color: theme.accent },
    captionGroup: { gap: 4 },

    uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    uploadingText: { fontSize: 13, color: theme.textSecondary },
    helperText: { fontSize: 12, lineHeight: 17, color: theme.textSecondary },
    noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    statusSelector: { flexDirection: 'row', gap: 8 },
    statusOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusOptionText: { fontSize: 12, fontWeight: '600' },

    fieldRow: { flexDirection: 'row', gap: 10 },
    fieldHalf: { flex: 1, gap: 4 },
    inputGroup: { gap: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inputLabel: { fontSize: 13, fontWeight: '700', color: theme.textBody },
    counter: { fontSize: 11, color: theme.textTertiary },
    textInput: {
      backgroundColor: theme.backgroundHover,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.textBody,
    },
    textInputFlush: { flex: 1, paddingVertical: 10, paddingHorizontal: 0, fontSize: 14, color: theme.textBody },
    multiline: { height: 88, textAlignVertical: 'top' },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    inputWithPrefix: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    inputPrefix: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginRight: 2 },

    // Locked fields render as read-only values rather than disabled inputs.
    // A greyed-out TextInput still looks editable and invites taps that do
    // nothing; showing the value plainly, with the lock stated in words, makes
    // the constraint legible instead of feeling broken.
    lockedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
    },
    lockedTagText: { fontSize: 10, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.4 },
    lockedField: { minHeight: 42, paddingVertical: 10 },
    lockedFieldMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
    lockedFieldText: { flex: 1, fontSize: 14, color: theme.textSecondary },
    lockedHint: { fontSize: 12, lineHeight: 18, color: theme.textTertiary, marginTop: 6 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundHover,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },

    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 4,
    },
    toggleCopy: { flex: 1, gap: 2 },

    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    menuName: { flex: 1 },
    iconBtn: { padding: 4 },
    inlineAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
    inlineAddText: { fontSize: 13, fontWeight: '700', color: theme.accent },

    footer: { gap: 10, paddingTop: 4 },
    primaryButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: { fontSize: 15, fontWeight: '700', color: COLOR_WHITE },
    secondaryButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryButtonText: { fontSize: 15, fontWeight: '700', color: theme.accent },
    disabled: { opacity: 0.5 },
    footerHint: { fontSize: 12, color: theme.textSecondary, textAlign: 'center' },

    sheetOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
    },
    sheetBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: theme.backgroundElement,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 16,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.textBody, textAlign: 'center' },
    sheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetOptionText: { fontSize: 15, color: theme.textBody, fontWeight: '600' },
  });
