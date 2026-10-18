import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListing, useSyncedListings } from '@/hooks/use-listings';
import { useTheme } from '@/hooks/use-theme';

export default function ReportConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();

  useSyncedListings();
  const listing = useListing(id || '');

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="checkmark" size={36} color={theme.accent} />
          </View>

          <ThemedText style={[styles.title, { color: theme.textBody }]}>Report received</ThemedText>

          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Thank you. Your report about {listing?.name || 'this listing'} has been recorded.
          </ThemedText>

          <View style={[styles.noteCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.noteTitle, { color: theme.textBody }]}>
              What happens to your report
            </ThemedText>
            <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
              Your report is confidential. The provider is not told who filed it, and your identity is
              never shown to them. Reports are reviewed by the City Pulse team to keep neighborhood
              information accurate.
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home-discover');
            }
          }}
          style={({ pressed }) => [styles.primary, { backgroundColor: theme.accent }, pressed && styles.pressed]}
        >
          <ThemedText style={styles.primaryText}>Back to browsing</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8 },
  noteCard: { marginTop: 12, width: '100%', borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  noteTitle: { fontSize: 14, fontWeight: '800' },
  noteText: { fontSize: 13, lineHeight: 19 },
  primary: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
