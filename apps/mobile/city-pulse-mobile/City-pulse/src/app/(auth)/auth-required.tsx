import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Modern Design Tokens (Matched with system architecture)
const COLOR_PRIMARY = '#129E9E';
const COLOR_PRIMARY_LIGHT = '#E8F6F6';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';

export default function AuthRequiredScreen() {
  const { id, intent } = useLocalSearchParams<{ id?: string; intent?: string }>();
  const isAgent = intent === 'agent';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top Header / Back Action */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home-discover');
              }
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>
          <ThemedText style={styles.topBarTitle}>Authentication Needed</ThemedText>
        </View>

        {/* Content Body */}
        <View style={styles.content}>
          {/* Badge / Status Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={isAgent ? 'business-outline' : 'shield-checkmark-outline'}
              size={28}
              color={COLOR_PRIMARY}
            />
          </View>

          {/* Heading & Subtitle */}
          <ThemedText style={styles.title}>
            {isAgent ? 'Create your provider account.' : 'Verify your identity.'}
          </ThemedText>

          <ThemedText style={styles.description}>
            {isAgent
              ? 'Sign in or create an account to complete your service provider listing. You can still browse without an account.'
              : 'Reporting is confidential, but City Pulse needs an account to help prevent abuse and protect neighborhood trust.'}
          </ThemedText>

          {/* Context Callout Box */}
          <View style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <Ionicons name="information-circle-outline" size={18} color={COLOR_PRIMARY} />
              <ThemedText style={styles.contextTitle}>
                {isAgent ? 'Listing creation' : 'Your report will return here'}
              </ThemedText>
            </View>
            <ThemedText style={styles.contextCopy}>
              {isAgent
                ? 'Complete your account setup to manage and maintain active service listings.'
                : 'After signing in, you will continue reporting this listing without losing your reason or provider context.'}
            </ThemedText>
          </View>
        </View>

        {/* Action Group */}
        <View style={styles.actionGroup}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/account-type?id=${id || ''}&intent=${intent || ''}`)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            <ThemedText style={styles.primaryText}>Create an account</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/sign-in?id=${id || ''}&intent=${intent || ''}`)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="log-in-outline" size={18} color={COLOR_PRIMARY} />
            <ThemedText style={styles.secondaryText}>I already have an account</ThemedText>
          </Pressable>
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
    paddingHorizontal: 16,
  },

  /* Top Navigation Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  /* Content */
  content: {
    flex: 1,
    paddingTop: 32,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLOR_PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginTop: 10,
  },

  /* Context Card */
  contextCard: {
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 16,
    marginTop: 28,
    gap: 6,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  contextCopy: {
    fontSize: 13,
    lineHeight: 19,
    color: COLOR_TEXT_MUTED,
  },

  /* Action Buttons */
  actionGroup: {
    gap: 10,
    paddingBottom: 24,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
  },

  pressed: {
    opacity: 0.85,
  },
});