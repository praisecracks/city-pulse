import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { useAppState } from '@/state/app-state';

// Clean, app-native teal color specs
const COLOR_BG = '#0D8282';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#1C252E';
const COLOR_TEXT_MUTED = '#637381';

export default function AgentSuccessScreen() {
  const { agentDraft, resetAgentDraft } = useAppState();
  const { businessName: paramBusinessName } = useLocalSearchParams<{ businessName?: string }>();

  const businessName = paramBusinessName || agentDraft.businessName?.trim() || 'Your listing';
  const locationArea = agentDraft.area?.trim() || 'your neighborhood';

  useEffect(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, []);

  const handleProceed = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (typeof resetAgentDraft === 'function') {
      resetAgentDraft();
    }
    router.replace('/agent-dashboard');
  }, [resetAgentDraft]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* TOP STATUS */}
        <View style={styles.topHeader}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <ThemedText style={styles.statusPillText}>Submission Received</ThemedText>
          </View>
        </View>

        {/* HERO CARD WITH WATERMARK CHECKMARK ICON IN BACKGROUND MIDDLE */}
        <View style={styles.heroCard}>
          {/* Watermark Checkmark at back middle */}
          <View style={styles.watermarkContainer}>
            <Ionicons name="checkmark" size={160} color="rgba(13, 130, 130, 0.06)" />
          </View>

          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={32} color="#0D8282" />
          </View>

          <ThemedText style={styles.heroTitle}>Listing Submitted</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            <ThemedText style={styles.boldText}>{businessName}</ThemedText> in{' '}
            <ThemedText style={styles.boldText}>{locationArea}</ThemedText> is awaiting admin review.
          </ThemedText>
        </View>

        {/* BADGE TIER CARD */}
        <View style={styles.badgeCard}>
          <View style={styles.badgeIconBox}>
            <Ionicons name="time-outline" size={18} color="#0D8282" />
          </View>
          <View style={styles.badgeTextCol}>
            <ThemedText style={styles.badgeTitle}>Verification in progress</ThemedText>
            <ThemedText style={styles.badgeDesc}>Our team will review your listing details and photos. Your profile stays unverified until approval.</ThemedText>
          </View>
        </View>

        {/* CURRENT STATUS NOTICE BLOCK */}
        <View style={styles.noticeBlock}>
          <ThemedText style={styles.noticeHeading}>Listing Status: Pending review</ThemedText>
          <ThemedText style={styles.noticeBody}>
            Your listing will not appear in customer discovery until it is approved. You can manage it from your provider dashboard while you wait.
          </ThemedText>
        </View>

        {/* BOTTOM ACTION BUTTON */}
        <View style={styles.actionContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleProceed}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <ThemedText style={styles.primaryButtonText}>Go to provider dashboard</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#0D8282" />
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
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
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  topHeader: {
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  watermarkContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -80 }],
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    marginBottom: 6,
    textAlign: 'center',
    zIndex: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    zIndex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },

  /* Badge Card */
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_CARD,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextCol: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
    lineHeight: 15,
  },

  /* Notice Block */
  noticeBlock: {
    marginTop: 14,
    paddingHorizontal: 4,
  },
  noticeHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  /* Action Section */
  actionContainer: {
    marginTop: 'auto',
    paddingTop: 14,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLOR_CARD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLOR_BG,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});