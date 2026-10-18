import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageContentFit } from 'expo-image';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

export type ListingPhotoProps = {
  uri: string;
  /** Sized by the caller; the image fills the box this style describes. */
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  /** Shown under the icon when the image cannot be loaded. */
  fallbackLabel?: string;
  /** Overlays rendered on top of the image (badges, remove buttons). */
  children?: ReactNode;
};

/**
 * A listing photo that says so when it cannot be shown.
 *
 * expo-image renders nothing at all for a URL that 404s, which leaves an empty
 * bordered box: the grid still says a photo is there, but no photo appears.
 * That is exactly the failure this component exists to make legible — a photo
 * that is genuinely missing now looks different from a photo that is merely
 * still loading.
 */
export function ListingPhoto({
  uri,
  style,
  contentFit = 'cover',
  fallbackLabel = 'Photo unavailable',
  children,
}: ListingPhotoProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // The failure is recorded against the URI that produced it, so the same
  // component can be reused across a changing photo list (a cover swap, a
  // removal, a reload) without an effect to re-arm it: a new source simply
  // stops matching and renders normally again.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const hasFailed = Boolean(uri) && failedUri === uri;

  const handleError = useCallback(() => setFailedUri(uri), [uri]);

  if (!uri || hasFailed) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
        <ThemedText style={styles.fallbackText} numberOfLines={2}>
          {fallbackLabel}
        </ThemedText>
        {children}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={150}
        cachePolicy="memory-disk"
        onError={handleError}
      />
      {children}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.backgroundHover,
      overflow: 'hidden',
    },
    fallbackText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
  });
