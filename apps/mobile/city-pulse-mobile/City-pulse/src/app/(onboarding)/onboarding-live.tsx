import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImageBackdrop } from '@/components/image-backdrop';
import { useTheme } from '@/hooks/use-theme';

const BRAND_TEAL = '#129E9E';
const SCRIM = 'rgba(11, 15, 20, 0.62)';

export default function LiveOnboardingScreen() {
  const theme = useTheme();

  const handleNext = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/onboarding-trust');
  };

  const handleSkip = () => {
    try { Haptics.selectionAsync(); } catch {}
    router.replace('/location-rationale');
  };

  return (
    <ImageBackdrop
      posterSource={require('@/assets/images/Live before you leave.optimized.jpg')}
    >
      <ThemedView style={styles.screen}>
        <View style={styles.scrimOverlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brandName}>City Pulse</ThemedText>
            <Pressable
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
              style={styles.skipButton}
            >
              <ThemedText style={styles.skip}>Skip</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <View style={[styles.progressFill, { backgroundColor: BRAND_TEAL, width: '50%' }]} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="pulse" size={13} color="#2DD4BF" />
              <ThemedText style={styles.eyebrow}>ACTIVE VERIFICATION</ThemedText>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <ThemedText style={styles.liveText}>Live</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.provider}>Kuto Gas Plant</ThemedText>
            <ThemedText style={styles.detail}>Dispensing • ₦1,200 per KG</ThemedText>

            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={14} color="#34D399" />
              <ThemedText style={styles.statusText}>No queue right now. Verified by 14 users in the last hour.</ThemedText>
            </View>

            <ThemedText type="title" style={styles.title}>
              Live before you leave.
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Avoid wasted trips. Check active status, product prices, and live queue reports before taking a bike or walking under the hot sun.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next onboarding step"
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: BRAND_TEAL },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.primaryButtonText}>Next</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    </ImageBackdrop>
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
  eyebrowRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eyebrow: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2DD4BF',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2DD4BF',
  },
  provider: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#34D399',
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});