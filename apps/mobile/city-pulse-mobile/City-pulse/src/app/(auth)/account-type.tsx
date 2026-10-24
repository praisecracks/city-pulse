import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/state/app-state';

const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_TEAL_SOFT = '#E8F6F6';

export default function AccountTypeScreen() {
  const { id, existingUser } = useLocalSearchParams<{ id?: string; intent?: string; existingUser?: string }>();
  const { updateUser } = useAppState();
  const isExistingUser = existingUser === 'true';

  const handleSelect = (accountType: 'agent' | 'customer') => {
    if (isExistingUser && accountType === 'customer') return;

    if (isExistingUser && accountType === 'agent') {
      // Already logged in as a customer: mark agent intent and go straight to
      // provider onboarding instead of re-entering auth.
      updateUser({ agentIntent: true });
      router.push('/agent-registration-1' as never);
      return;
    }

    router.push({
      pathname: '/create-account',
      params: {
        id: id || '',
        intent: accountType === 'agent' ? 'agent' : 'customer',
      },
    });
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>
          <ThemedText style={styles.topBarTitle}>Create Account</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title & Description */}
          <View style={styles.headerGroup}>
            <ThemedText style={styles.title}>What type of account?</ThemedText>
            <ThemedText style={styles.description}>
              Choose the account that fits how you’ll use City Pulse.
              You can add the other role later from your profile.
            </ThemedText>
          </View>

          {/* Account Type Options */}
          <View style={styles.options}>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSelect('agent')}
              style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}
            >
              <View style={[styles.iconCircle, { backgroundColor: COLOR_TEAL_SOFT }]}>
                <Ionicons name="briefcase-outline" size={26} color={COLOR_PRIMARY} />
              </View>
              <View style={styles.optionBody}>
                <ThemedText style={styles.optionTitle}>Service Provider</ThemedText>
                <ThemedText style={styles.optionDesc}>
                  List your business availability — POS, food, gas, or house agency.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLOR_TEXT_MUTED} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => handleSelect('customer')}
              disabled={isExistingUser}
              style={({ pressed }) => [
                styles.optionCard,
                isExistingUser && styles.optionCardMarked,
                pressed && !isExistingUser && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isExistingUser ? COLOR_TEAL_SOFT : COLOR_TEAL_SOFT },
                ]}
              >
                {isExistingUser ? (
                  <Ionicons name="checkmark-circle" size={26} color={COLOR_PRIMARY} />
                ) : (
                  <Ionicons name="person-outline" size={26} color={COLOR_PRIMARY} />
                )}
              </View>
              <View style={styles.optionBody}>
                <ThemedText style={styles.optionTitle}>Customer</ThemedText>
                <ThemedText style={styles.optionDesc}>
                  {isExistingUser
                    ? 'Already active on this account.'
                    : 'Discover and find nearby services, report issues, and save favorites.'}
                </ThemedText>
              </View>
              {isExistingUser ? (
                <View style={styles.markedBadge}>
                  <ThemedText style={styles.markedBadgeText}>Active</ThemedText>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={COLOR_TEXT_MUTED} />
              )}
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer Note */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            By continuing, you agree to City Pulse&apos;s Terms and Privacy Policy.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOR_BG,
  },
  safeArea: {
    flex: 1,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },

  headerGroup: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLOR_TEXT_MUTED,
    marginTop: 4,
  },

  /* Options */
  options: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
  },
  optionCardMarked: {
    borderColor: COLOR_PRIMARY,
    borderWidth: 2,
    backgroundColor: COLOR_TEAL_SOFT,
    opacity: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: COLOR_TEXT_MUTED,
  },
  markedBadge: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 15,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.85,
  },
});
