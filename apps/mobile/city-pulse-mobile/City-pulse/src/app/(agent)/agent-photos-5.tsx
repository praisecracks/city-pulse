import { router } from 'expo-router';
import { useCallback, useMemo, useState, memo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState, type ProviderPhoto } from '@/state/app-state';
import {
  MAX_LISTING_PHOTOS,
  REQUIRED_LISTING_PHOTOS,
  processListingImages,
  pickPhotos,
  showPhotoSourceSheet,
  type PickSource,
} from '@/utils/image-upload';

// Design tokens
const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_TIP_BG = '#E8F6F6';
const COLOR_TIP_BORDER = '#B2E2E2';
const COLOR_TIP_TEXT = '#0C6E66';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';

const MAX_CAPTION_LENGTH = 120;

const PHOTO_HINTS = [
  { slot: 'Cover', hint: 'Your shop front or workspace, with your sign visible' },
  { slot: 'Photo 2', hint: 'What you sell, or the tools you work with' },
  { slot: 'Photo 3', hint: 'Your surroundings so neighbours can find you' },
  { slot: 'Photo 4', hint: 'Anything else that proves you are real' },
];

function createPhotoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function captionValue(value: string) {
  return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, MAX_CAPTION_LENGTH);
}

type SlotData = {
  index: number;
  photo: ProviderPhoto | null;
  hint: { slot: string; hint: string };
};

type MemoizedSlotProps = {
  item: SlotData;
  busySlot: number | null;
  coverId?: string;
  openSlot: (index: number) => void;
  removePhoto: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
};

// Memoized individual slot to prevent full-list re-renders during text inputs or gestures
const MemoizedSlot = memo(function MemoizedSlot({
  item,
  busySlot,
  coverId,
  openSlot,
  removePhoto,
  updateCaption,
}: MemoizedSlotProps) {
  const isBusy = busySlot === item.index;
  const isCover = item.index === 0;

  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          item.photo
            ? `${item.hint.slot}, photo added`
            : `${item.hint.slot}, empty. ${item.hint.hint}`
        }
        disabled={busySlot !== null}
        onPress={() => openSlot(item.index)}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.photoFrame}>
          {item.photo ? (
            <Image
              source={{ uri: item.photo.uri }}
              style={styles.photo}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              {isBusy ? (
                <ActivityIndicator size="small" color={COLOR_PRIMARY} />
              ) : (
                <Ionicons name="add" size={26} color={COLOR_PRIMARY} />
              )}
            </View>
          )}

          {isCover && (
            <View style={[styles.badge, !item.photo && styles.badgeEmpty]}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <ThemedText style={styles.badgeText}>COVER</ThemedText>
            </View>
          )}

          {item.photo && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.hint.slot}`}
              onPress={() => removePhoto(item.photo!.id)}
              style={styles.removeBtn}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </Pressable>

      <ThemedText style={styles.slotLabel}>{item.hint.slot}</ThemedText>

      {item.photo ? (
        <TextInput
          value={item.photo.caption}
          onChangeText={(value) => updateCaption(item.photo!.id, value)}
          placeholder="Add a short caption"
          placeholderTextColor={COLOR_TEXT_MUTED}
          maxLength={MAX_CAPTION_LENGTH}
          style={styles.captionInput}
        />
      ) : (
        <ThemedText style={styles.slotHint} numberOfLines={2}>
          {item.hint.hint}
        </ThemedText>
      )}
    </View>
  );
});

export default function AgentPhotosScreen() {
  const { agentDraft, updateAgentDraft } = useAppState();

  const [photos, setPhotos] = useState<ProviderPhoto[]>(agentDraft.photos || []);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const photoCount = photos.length;
  const remaining = MAX_LISTING_PHOTOS - photoCount;
  const canContinue = photoCount >= REQUIRED_LISTING_PHOTOS;

  const coverId = photos[0]?.id;

  const hintFor = useCallback(
    (index: number) => PHOTO_HINTS[index] ?? { slot: `Photo ${index + 1}`, hint: '' },
    []
  );

  const addPhotos = useCallback(
    async (slotIndex: number, source: PickSource) => {
      const isReplacing = slotIndex < photos.length;
      const slotsLeft = isReplacing ? 1 : remaining;

      setBusySlot(slotIndex);
      setErrorMessage(null);

      try {
        const picked = await pickPhotos(source, slotsLeft);
        if (picked.length === 0) return;

        const processed = await processListingImages(
          picked.map((photo) => photo.uri)
        );

        if (processed.length === 0) {
          setErrorMessage('That image could not be read. Try a different one.');
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setPhotos((current) => {
          const additions = processed.map((image) => ({
            id: createPhotoId(),
            uri: image.uri,
            caption: '',
          }));

          if (slotIndex < current.length) {
            const next = [...current];
            next[slotIndex] = { ...additions[0], caption: current[slotIndex].caption || '' };
            return next;
          }

          return [...current, ...additions].slice(0, MAX_LISTING_PHOTOS);
        });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not add that photo. Please try again.');
      } finally {
        setBusySlot(null);
      }
    },
    [remaining, photos.length]
  );

  const removePhoto = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  }, []);

  const makeCover = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (!target) return current;
      return [target, ...current.filter((photo) => photo.id !== id)];
    });
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, caption: captionValue(caption) } : photo))
    );
  }, []);

  const openSlot = useCallback(
    (slotIndex: number) => {
      const existing = photos[slotIndex];

      if (!existing) {
        showPhotoSourceSheet(false, (source) => addPhotos(slotIndex, source), undefined, hintFor(slotIndex).slot);
        return;
      }

      const actions: {
        label: string;
        onPress: () => void;
        destructive?: boolean;
      }[] = [
        {
          label: 'Replace photo',
          onPress: () => showPhotoSourceSheet(true, (source) => addPhotos(slotIndex, source), undefined, hintFor(slotIndex).slot),
        },
      ];

      if (existing.id !== coverId) {
        actions.push({ label: 'Make cover photo', onPress: () => makeCover(existing.id) });
      }

      actions.push({ label: 'Remove photo', onPress: () => removePhoto(existing.id), destructive: true });
      actions.push({ label: 'Cancel', onPress: () => {} });

      Alert.alert('Photo options', hintFor(slotIndex).hint, actions.map((action) => ({
        text: action.label,
        style: action.destructive ? ('destructive' as const) : 'default',
        onPress: action.onPress,
      })));
    },
    [photos, coverId, addPhotos, makeCover, removePhoto, hintFor]
  );

  const handleNext = useCallback(() => {
    setTouched(true);

    if (!canContinue) {
      setErrorMessage('Add at least one photo so customers can recognise your place.');
      return;
    }

    updateAgentDraft({ photos });
    router.push('/agent-review-6');
  }, [canContinue, photos, updateAgentDraft]);

  const slots = useMemo(
    () =>
      Array.from({ length: MAX_LISTING_PHOTOS }, (_, index) => ({
        index,
        photo: photos[index] ?? null,
        hint: hintFor(index),
      })),
    [photos, hintFor]
  );

  const validationMessage =
    touched && !canContinue
      ? `Add at least ${REQUIRED_LISTING_PHOTOS} photo before continuing.`
      : null;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.canGoBack() && router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
            </Pressable>
            <ThemedText style={styles.topBarTitle}>Add photos</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step Progress Indicator */}
            <View style={styles.stepContainer}>
              <ThemedText style={styles.stepBadgeText}>STEP 5 OF 6</ThemedText>
              <View style={styles.stepTrack}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
              </View>
            </View>

            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Show us your place.</ThemedText>
              <ThemedText style={styles.description}>
                A photo of your shop front is how customers confirm they have found the right place before
                they set off.
              </ThemedText>
            </View>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            <View style={styles.cardContainer}>
              <View style={styles.counterRow}>
                <ThemedText style={styles.counterText}>
                  {photoCount} of {MAX_LISTING_PHOTOS} added
                </ThemedText>
                {photoCount >= REQUIRED_LISTING_PHOTOS && (
                  <View style={styles.counterOk}>
                    <Ionicons name="checkmark-circle" size={14} color={COLOR_PRIMARY} />
                    <ThemedText style={styles.counterOkText}>Cover photo ready</ThemedText>
                  </View>
                )}
              </View>

              <FlatList
                data={slots}
                keyExtractor={(item) => String(item.index)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stripContent}
                renderItem={({ item }) => (
                  <MemoizedSlot
                    item={item}
                    busySlot={busySlot}
                    coverId={coverId}
                    openSlot={openSlot}
                    removePhoto={removePhoto}
                    updateCaption={updateCaption}
                  />
                )}
              />

              {validationMessage && (
                <ThemedText style={styles.fieldErrorText}>{validationMessage}</ThemedText>
              )}

              <View style={styles.tipBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLOR_TIP_TEXT} />
                <ThemedText style={styles.tipText}>
                  Photos are required on every listing. They are the quickest way for us to spot fake
                  accounts, and they appear on your listing for customers to browse.
                </ThemedText>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!canContinue}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryButton,
                !canContinue && styles.disabledButton,
                pressed && canContinue && styles.pressed,
              ]}
            >
              <ThemedText style={styles.primaryText}>
                {canContinue ? 'Review my registration' : 'Add a cover photo'}
              </ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepContainer: {
    marginBottom: 16,
    gap: 6,
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
  headerGroup: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLOR_TEXT_MUTED,
    marginTop: 6,
  },
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
  cardContainer: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_TEXT_MUTED,
  },
  counterOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterOkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },
  stripContent: {
    gap: 12,
    paddingRight: 4,
  },
  slot: {
    width: 168,
  },
  photoFrame: {
    width: 168,
    height: 168,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLOR_BG,
    borderWidth: 1.5,
    borderColor: COLOR_BORDER,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLOR_PRIMARY,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeEmpty: {
    backgroundColor: COLOR_TEXT_MUTED,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    marginTop: 8,
  },
  slotHint: {
    fontSize: 11,
    lineHeight: 15,
    color: COLOR_TEXT_MUTED,
    marginTop: 4,
  },
  captionInput: {
    height: 40,
    marginTop: 6,
    backgroundColor: COLOR_BG,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: COLOR_TEXT_MAIN,
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_DANGER_TEXT,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLOR_TIP_BG,
    borderWidth: 1,
    borderColor: COLOR_TIP_BORDER,
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_TIP_TEXT,
    fontWeight: '500',
  },
  actionGroup: {
    paddingVertical: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
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