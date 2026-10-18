import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoBackdrop } from '@/components/video-backdrop';
import { useTheme } from '@/hooks/use-theme';

const BRAND_TEAL = '#129E9E';
const SCRIM = 'rgba(11, 15, 20, 0.62)';

export default function WelcomeScreen() {
  const theme = useTheme();

  const handleExplore = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/onboarding-live');
  };

  const handleSkip = () => {
    try { Haptics.selectionAsync(); } catch {}
    router.replace('/location-rationale');
  };

  return (
    <VideoBackdrop
      posterSource={require('@/assets/images/Never waste a trip in Abeokuta again.optimized.jpg')}
      staticOnly={true}
    >
      <ThemedView style={styles.screen}>
        <View style={styles.scrimOverlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brandName}>City Pulse</ThemedText>
            <Pressable
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip intro"
              style={styles.skipButton}
            >
              <ThemedText style={styles.skip}>Skip</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <View style={[styles.progressFill, { backgroundColor: BRAND_TEAL, width: '33%' }]} />
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.badgeContainer, { backgroundColor: 'rgba(18, 158, 158, 0.25)', borderColor: 'rgba(18, 158, 158, 0.4)' }]}>
              <Ionicons name="pulse" size={13} color="#2DD4BF" />
              <ThemedText style={styles.badgeText}>Abeokuta Real-Time Intel</ThemedText>
            </View>

            <ThemedText type="title" style={styles.title}>
              Never waste a trip in Abeokuta again.
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Track live active statuses of local markets, shops, and agents before you step out.
            </ThemedText>
          </View>

          <View style={styles.actionModule}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore neighborhood live"
              onPress={handleExplore}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: BRAND_TEAL },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>Start exploring</ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
              <ThemedText style={styles.trustText}>No account required to browse local updates</ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    </VideoBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SCRIM,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    height: 44,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  skip: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 3,
    marginTop: 10,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 3,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.82)',
    fontWeight: '500',
    maxWidth: '90%',
  },
  actionModule: {
    gap: 14,
    paddingBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    opacity: 0.9,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});