import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImageBackdrop } from '@/components/image-backdrop';
import { useAppState } from '@/state/app-state';
import { resolveDisplayArea } from '@/utils/display-area';

const BRAND_TEAL = '#129E9E';
const SCRIM = 'rgba(11, 15, 20, 0.62)';

export default function CurrentLocationScreen() {
  const { customerLocation } = useAppState();
  
  const gps = customerLocation?.gps;
  const address = customerLocation?.address;
  const serviceArea = customerLocation?.serviceArea;
  const isGps = customerLocation?.gps !== null;
  const accuracy = gps?.accuracy ? Math.round(gps.accuracy) : null;
  const hasCoords = gps !== null;
  
  // Build display area from service area or address. "Unknown area" is the
  // placeholder the reverse-geocode returns when it fails, so it is treated as
  // absent rather than shown to the user.
  const displayArea = resolveDisplayArea(
    serviceArea?.name,
    address?.community,
    customerLocation?.label,
  );
  
  // Build detailed address for display
  const detailedAddress = address?.streetName && address?.community
    ? `${address.streetName}, ${address.community}`
    : address?.formattedAddress || address?.community || displayArea;

  const handleContinue = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.replace('/home-discover');
  };

  return (
    <ImageBackdrop
      posterSource={require('@/assets/images/Find active services closest to you..jpg')}
    >
      <ThemedView style={styles.screen}>
        <View style={styles.scrimOverlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brandName}>City Pulse</ThemedText>
            <Pressable
              onPress={() => router.replace('/manual-area')}
              accessibilityRole="button"
              accessibilityLabel="Choose another area"
              style={styles.skipButton}
            >
              <ThemedText style={styles.skip}>Change area</ThemedText>
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.radarRow}>
              <View style={styles.radarOuter}>
                <View style={[styles.radarRing, { borderColor: BRAND_TEAL }]}>
                  <View style={styles.radarInner}>
                    <View style={styles.radarPin}>
                      <Ionicons name="navigate" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.privacyBadge, { backgroundColor: 'rgba(45, 212, 191, 0.15)' }]}>
                <Ionicons name="checkmark-circle" size={13} color="#2DD4BF" />
                <ThemedText style={styles.scanning}>Location confirmed</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.status}>Location found</ThemedText>

            <ThemedText type="title" style={styles.title}>
              We are looking here.
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              City Pulse will use this area to sort nearby services by distance. You can change it at any time.
            </ThemedText>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Area</ThemedText>
                <ThemedText style={styles.detailValue}>{displayArea}</ThemedText>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Source</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {isGps ? 'GPS' : 'Manual'}
                </ThemedText>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Accuracy</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {accuracy != null ? `±${accuracy} m` : hasCoords ? 'locked' : '—'}
                </ThemedText>
              </View>
            </View>

            {address?.streetName && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Street</ThemedText>
                  <ThemedText style={styles.detailValue}>{address.streetName}</ThemedText>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Community</ThemedText>
                  <ThemedText style={styles.detailValue}>{address.community || '—'}</ThemedText>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Confidence</ThemedText>
                  <ThemedText style={styles.detailValue}>{serviceArea?.confidence || '—'}</ThemedText>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with this area"
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>Continue with this area</ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose another area"
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                router.replace('/manual-area');
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <ThemedText style={styles.secondaryText}>Choose another area</ThemedText>
            </Pressable>
          </View>
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
  status: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  detailItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
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
  primaryButtonText: {
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
});
