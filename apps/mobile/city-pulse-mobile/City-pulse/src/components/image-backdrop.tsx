import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

type VideoBackdropProps = PropsWithChildren & {
  /** Still image shown behind the screen content. */
  posterSource?: ImageSource;
  /** Keeps the backdrop wash on-brand teal regardless of the system color scheme. */
  tealWash?: boolean;
};

export function ImageBackdrop({ children, posterSource, tealWash = false }: VideoBackdropProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {posterSource && (
        <Image
          source={posterSource}
          contentFit="cover"
          style={styles.poster}
          accessibilityLabel="Onboarding background"
        />
      )}
      <BackdropWash isDark={isDark} tealWash={tealWash} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

function BackdropWash({ isDark, tealWash }: { isDark: boolean; tealWash: boolean }) {
  const colors = tealWash
    ? (['rgba(18, 158, 158, 0.48)', 'rgba(18, 158, 158, 0.70)', 'rgba(18, 158, 158, 0.90)'] as const)
    : isDark
    ? (['rgba(18, 158, 158, 0.55)', 'rgba(18, 158, 158, 0.72)', 'rgba(18, 158, 158, 0.96)'] as const)
    : (['rgba(251, 251, 248, 0.04)', 'rgba(251, 251, 248, 0.18)', 'rgba(251, 251, 248, 0.98)'] as const);

  return (
    <LinearGradient
      colors={colors}
      locations={[0, 0.42, 0.75]}
      style={styles.wash}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbf8', overflow: 'hidden' },
  containerDark: { backgroundColor: '#129E9E' },
  poster: { ...StyleSheet.absoluteFill },
  wash: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
  content: { flex: 1 },
});