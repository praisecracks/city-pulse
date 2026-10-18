import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { ListingPhoto } from '@/data/product';

type Theme = ReturnType<typeof useTheme>;

type ListingGalleryProps = {
  photos: ListingPhoto[];
  height?: number;
};

/**
 * Swipeable photo gallery for a provider listing, in the spirit of Google Maps:
 * the cover shot leads, you swipe for the rest, and tapping any photo opens it
 * full screen. Rendered as a pinned-width paging list so a large photo is
 * decoded once rather than resized on every frame.
 */
export function ListingGallery({ photos, height = 240 }: ListingGalleryProps) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const listRef = useRef<FlatList<ListingPhoto>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setViewerOpen] = useState(false);
  // The gallery sits inside padded containers, so the window width is not the
  // page width. Paging snaps on the measured frame, so pages must be too,
  // otherwise every photo is offset by the padding and bleeds into its
  // neighbour at rest.
  const [frameWidth, setFrameWidth] = useState(0);
  const pageWidth = frameWidth || width;

  const handleFrameLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = Math.round(event.nativeEvent.layout.width);
      setFrameWidth((prev) => (prev === next ? prev : next));
    },
    []
  );

  // setActiveIndex is referentially stable, so this handler identity never
  // changes and FlatList will not reset its scroll position.
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const next = viewableItems.find((item) => item.index != null)?.index;
      if (next != null) setActiveIndex(next);
    },
    []
  );

  const openViewer = useCallback(
    (index: number) => {
      setViewerIndex(index);
      setViewerOpen(true);
    },
    []
  );

  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const onViewerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== viewerIndex && next >= 0 && next < photos.length) setViewerIndex(next);
    },
    [photos.length, viewerIndex, width]
  );

  if (photos.length === 0) return null;

  const caption = photos[activeIndex]?.caption?.trim();

  return (
    <View>
      <View style={[styles.frame, { height }]} onLayout={handleFrameLayout}>
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Fixed-width items let the list recycle views instead of re-laying out.
          getItemLayout={(_data, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onViewableItemsChanged={handleViewableItemsChanged}
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={item.caption || `Photo ${index + 1} of ${photos.length}`}
              onPress={() => openViewer(index)}
              style={{ width: pageWidth }}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </Pressable>
          )}
        />

        {photos.length > 1 && (
          <View pointerEvents="none" style={styles.counter}>
            <ThemedText style={styles.counterText}>
              {activeIndex + 1} / {photos.length}
            </ThemedText>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View photos full screen"
          onPress={() => openViewer(activeIndex)}
          style={styles.zoomBtn}
        >
          <Ionicons name="expand-outline" size={14} color={theme.background} />
        </Pressable>
      </View>

      {caption ? (
        <View style={styles.captionBar}>
          <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
          <ThemedText style={styles.captionText}>{caption}</ThemedText>
        </View>
      ) : null}

      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((photo, index) => (
            <View
              key={`${photo.url}-dot`}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      <Modal
        visible={isViewerOpen}
        animationType="fade"
        transparent
        onRequestClose={closeViewer}
      >
        <View style={styles.viewer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
            onPress={closeViewer}
            style={styles.viewerClose}
          >
            <Ionicons name="close" size={22} color={theme.background} />
          </Pressable>

          <FlatList
            data={photos}
            keyExtractor={(item, index) => `${item.url}-viewer-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
            initialScrollIndex={viewerIndex}
            onMomentumScrollEnd={onViewerScroll}
            renderItem={({ item }) => (
              <View style={[styles.viewerPhotoContainer, { width }]}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.viewerPhoto}
                  contentFit="contain"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              </View>
            )}
          />

          <ThemedText style={styles.viewerCaption}>
            {photos[viewerIndex]?.caption || `Photo ${viewerIndex + 1} of ${photos.length}`}
          </ThemedText>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    verifiedText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.accent,
    },
    section: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    roleCardInner: {
      gap: 4,
    },
    roleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    roleIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.backgroundHover,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roleLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textBody,
    },
    roleSubtext: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textBody,
    },
    menuItemSubtext: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    menuItemStandardText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textBody,
    },
    signOutText: {
      color: theme.dangerText,
    },
    pressed: {
      opacity: 0.8,
    },
    avatarZoomOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarZoomContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    zoomHeaderBar: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    zoomHeaderTitle: {
      color: theme.background,
      fontSize: 15,
      fontWeight: '700',
    },
    zoomCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImageWrapper: {
      width: 280,
      height: 280,
      borderRadius: 140,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: theme.accent,
    },
    zoomedImageContent: {
      width: '100%',
      height: '100%',
    },
    zoomedAvatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.accentGlow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomFooterHint: {
      color: theme.textTertiary,
      fontSize: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundElement,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      maxHeight: '85%',
      paddingBottom: 36,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textBody,
    },
    modalSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.backgroundHover,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScrollBody: {
      gap: 16,
      paddingBottom: 16,
    },
    modalAvatarSection: {
      alignItems: 'center',
      gap: 12,
      marginVertical: 8,
    },
    modalAvatarPreviewBox: {
      position: 'relative',
      padding: 2,
    },
    modalCameraIconBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: theme.accent,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.backgroundElement,
    },
    avatarLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    avatarLoadingText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    changePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.backgroundHover,
    },
    changePhotoBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    textInputWithIcon: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.textBody,
    },
    modalFooterActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.backgroundHover,
      borderRadius: 12,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.textBody,
      fontSize: 14,
      fontWeight: '700',
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 12,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      color: theme.background,
      fontSize: 14,
      fontWeight: '700',
    },

    /* Business Profile Styles */
    businessCard: {
      backgroundColor: theme.accentGlow,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    businessHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    businessIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundElement,
      justifyContent: 'center',
      alignItems: 'center',
    },
    businessInfo: {
      flex: 1,
    },
    businessCategory: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    businessName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textBody,
      marginTop: 2,
    },
    businessDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    businessDetailText: {
      fontSize: 14,
      color: theme.textBody,
      flex: 1,
    },
    serviceDetailsContainer: {
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    serviceDetailsTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    serviceDetailsGrid: {
      gap: 6,
    },
    serviceDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundElement,
      borderRadius: 8,
    },
    serviceDetailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    serviceDetailValue: {
      fontSize: 12,
      color: theme.textBody,
      fontWeight: '700',
    },
    photoGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    profilePhotoThumb: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: theme.backgroundHover,
    },

    /* Listing Gallery Styles */
    frame: {
      width: '100%',
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    counter: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    counterText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.background,
    },
    zoomBtn: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    captionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    captionText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
      paddingTop: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.border,
    },
    dotActive: {
      backgroundColor: theme.textBody,
    },
    viewer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
    },
    viewerPhotoContainer: {
      height: '80%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewerPhoto: {
      width: '100%',
      height: '100%',
    },
    viewerClose: {
      position: 'absolute',
      top: 48,
      right: 20,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    viewerCaption: {
      color: theme.background,
      fontSize: 13,
      textAlign: 'center',
      paddingHorizontal: 32,
      paddingBottom: 32,
    },
  });
