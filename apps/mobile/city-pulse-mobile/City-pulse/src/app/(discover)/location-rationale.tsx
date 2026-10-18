import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoBackdrop } from '@/components/video-backdrop';
import { useAppState } from '@/state/app-state';
import { getAutomaticLocation } from '@/utils/location';

const BRAND_TEAL = '#129E9E';
const SCRIM = 'rgba(11, 15, 20, 0.62)';

export default function LocationRationaleScreen() {
  const { setSelectedArea, setCustomerLocation } = useAppState();
  const [isLocating, setIsLocating] = useState(false);

  const [pulseScale, setPulseScale] = useState(1);
  const [radarOpacity, setRadarOpacity] = useState(0.6);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseScale((current) => (current === 1 ? 1.35 : 1));
      setRadarOpacity((current) => (current === 0.6 ? 0 : 0.6));
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  async function allowLocation() {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const location = await getAutomaticLocation();
      setSelectedArea(location.serviceArea?.name || location.label);
      setCustomerLocation(location);
      router.replace('/current-location');
    } catch {
      router.replace('/manual-area');
    } finally {
      setIsLocating(false);
    }
  }

  return (
    <VideoBackdrop
      posterSource={require('@/assets/images/Find active services closest to you..jpg')}
      staticOnly
    >
      <ThemedView style={styles.screen}>
        <View style={styles.scrimOverlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brandName}>City Pulse</ThemedText>
            <Pressable
              onPress={() => router.replace('/manual-area')}
              accessibilityRole="button"
              accessibilityLabel="Skip location and choose manually"
              style={styles.skipButton}
            >
              <ThemedText style={styles.skip}>Skip</ThemedText>
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.radarRow}>
              <View style={styles.radarOuter}>
                <View
                  style={[
                    styles.radarRing,
                    {
                      borderColor: BRAND_TEAL,
                      transform: [{ scale: pulseScale }],
                      opacity: radarOpacity,
                    },
                  ]}
                />
                <View style={styles.radarInner}>
                  <View style={styles.radarPin}>
                    <Ionicons name="navigate" size={24} color="#FFFFFF" />
                  </View>
                </View>
              </View>
              <View style={styles.privacyBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#2DD4BF" />
                <ThemedText style={styles.scanning}>On-device only</ThemedText>
              </View>
            </View>

            <ThemedText type="title" style={styles.title}>
              Find active services closest to you.
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              We use your location to sort POS agents, cooking gas vendors, and food spots by exact distance to minimize your walk. We never track you in the background.
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow location access"
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                allowLocation();
              }}
              disabled={isLocating}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                isLocating && styles.disabledButton,
              ]}
            >
              <Ionicons name="location-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <ThemedText style={styles.primaryText}>
                {isLocating ? 'Finding your location' : 'Allow Location Access'}
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose neighborhood manually"
              onPress={() => router.push('/manual-area')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <ThemedText style={styles.secondaryText}>Choose neighborhood manually</ThemedText>
            </Pressable>
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
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  radarRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  radarOuter: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  radarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: BRAND_TEAL,
    backgroundColor: 'rgba(18, 158, 158, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scanning: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2DD4BF',
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
  actions: {
    gap: 14,
    paddingBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND_TEAL,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'transparent',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.7,
  },
});