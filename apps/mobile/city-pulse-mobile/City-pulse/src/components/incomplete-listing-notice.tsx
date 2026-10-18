import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const COLOR_BG = '#F7F4EB';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_TIP_BG = '#E8F6F6';
const COLOR_TIP_BORDER = '#B2E2E2';
const COLOR_TIP_TEXT = '#0C6E66';

type Props = {
  /** The step this person still has to complete. */
  resumePath: string;
  accent: string;
};

/**
 * Shown instead of the agent dashboard when the account has not published a
 * listing yet. Without this, an applicant who reloaded mid-registration landed
 * on a dashboard built entirely from placeholders.
 */
export function IncompleteListingNotice({ resumePath, accent }: Props) {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: `${accent}1A` }]}>
            <Ionicons name="storefront-outline" size={30} color={accent} />
          </View>

          <ThemedText style={styles.title}>Your business is not live yet</ThemedText>
          <ThemedText style={styles.description}>
            Finish setting up your service provider details and your listing will appear in
            City Pulse for customers nearby.
          </ThemedText>

          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="list-outline" size={16} color={COLOR_TEXT_MUTED} />
              <ThemedText style={styles.rowText}>Pick your service category</ThemedText>
            </View>
            <View style={styles.row}>
              <Ionicons name="business-outline" size={16} color={COLOR_TEXT_MUTED} />
              <ThemedText style={styles.rowText}>Add your business and contact details</ThemedText>
            </View>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={16} color={COLOR_TEXT_MUTED} />
              <ThemedText style={styles.rowText}>Pin your location</ThemedText>
            </View>
            <View style={styles.row}>
              <Ionicons name="images-outline" size={16} color={COLOR_TEXT_MUTED} />
              <ThemedText style={styles.rowText}>Upload at least one photo of your place</ThemedText>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLOR_TIP_TEXT} />
            <ThemedText style={styles.tipText}>
              We saved your progress, so you will come back to the exact step you left.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(resumePath as never)}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: accent }, pressed && styles.pressed]}
          >
            <ThemedText style={styles.primaryText}>Continue registration</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/home-discover')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <ThemedText style={styles.secondaryText}>Browse City Pulse instead</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOR_BG },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 24, gap: 14 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: COLOR_TEXT_MAIN,
    fontWeight: '600',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
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
  primaryButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: COLOR_TEXT_MUTED, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});