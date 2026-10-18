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

export default function TrustOnboardingScreen() {
  const theme = useTheme();

  const handleGetStarted = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/location-rationale');
  };

  const handleSkip = () => {
    try { Haptics.selectionAsync(); } catch {}
    router.replace('/location-rationale');
  };

  return (
    <ImageBackdrop
      posterSource={require('@/assets/images/Trust what you see..jpg')}
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
            <View style={[styles.progressFill, { backgroundColor: BRAND_TEAL, width: '75%' }]} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="shield-checkmark" size={13} color="#2DD4BF" />
              <ThemedText style={styles.eyebrow}>TRUST PARAMETERS</ThemedText>
              <View style={styles.secureBadge}>
                <Ionicons name="lock-closed" size={10} color="#2DD4BF" />
                <ThemedText style={styles.secureText}>SECURE</ThemedText>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <ThemedText style={styles.score}>4.8 / 5</ThemedText>
              <Ionicons name="star" size={18} color="#FBBF24" />
            </View>
            <ThemedText style={styles.detail}>Community Trust Score • Last Verified 5 mins ago</ThemedText>

            <View style={styles.noteRow}>
              <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.6)" />
              <ThemedText style={styles.note}>All community flags and status reports are confidential & anonymous.</ThemedText>
            </View>

            <ThemedText type="title" style={styles.title}>
              Trust what you see.
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              No fake updates. Our automated trust scoring tracks freshness, confidence, and community confirmation to guarantee accurate information.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started with location access"
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: BRAND_TEAL },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
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
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  score: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
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