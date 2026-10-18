import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useListing, useSyncedListings } from '@/hooks/use-listings';
import { useAppState } from '@/state/app-state';
import { useTheme } from '@/hooks/use-theme';
import {
  REPORT_REASONS,
  type ReportReasonId,
  submitReport,
} from '@/utils/report-api';

const MAX_NOTE_LENGTH = 280;

export default function ReportReasonScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const { user, token, pendingReportId } = useAppState();

  useSyncedListings();
  const listing = useListing(id || pendingReportId || '');

  // A valid MongoDB ObjectId is a 24-character hex string. Seed listings
  // use slugs like 'adebayo-pos' which will fail the backend's ObjectId cast.
  // If someone deep-links directly to a seed listing, block the report.
  const listingId = id || pendingReportId || '';
  const isSeedListing = !/^[0-9a-fA-F]{24}$/.test(listingId);

  const [selected, setSelected] = useState<ReportReasonId>('not_available');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace(`/auth-required?id=${id || pendingReportId || ''}`);
    }
  }, [user, id, pendingReportId]);

  const isOwnListing = Boolean(user?.id && listing?.agentId && user.id === listing.agentId);

  if (!user) {
    return null;
  }

  if (isOwnListing) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.blockedState}>
            <View style={[styles.blockedIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={28} color={theme.accent} />
            </View>
            <ThemedText style={[styles.blockedTitle, { color: theme.textBody }]}>
              This is your own listing
            </ThemedText>
            <ThemedText style={[styles.blockedBody, { color: theme.textSecondary }]}>
              You cannot report your own business. Use your dashboard to update your details instead.
            </ThemedText>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                router.replace('/agent-dashboard' as never);
              }}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}
            >
              <ThemedText style={styles.primaryText}>Go to my dashboard</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (isSeedListing) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.blockedState}>
            <View style={[styles.blockedIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="information-circle-outline" size={28} color="#F59E0B" />
            </View>
            <ThemedText style={[styles.blockedTitle, { color: theme.textBody }]}>
              Cannot report this listing
            </ThemedText>
            <ThemedText style={[styles.blockedBody, { color: theme.textSecondary }]}>
              This is a demo listing that does not exist on the server. Reports can only be filed
              for real listings published by providers.
            </ThemedText>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                router.back();
              }}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}
            >
              <ThemedText style={styles.primaryText}>Go back</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const handleSubmit = async () => {
    if (!id || isSubmitting) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsSubmitting(true);
    try {
      await submitReport(id, selected, note, token);
      router.replace(`/report-confirmation?id=${encodeURIComponent(id)}`);
    } catch (error) {
      Alert.alert(
        'Report not sent',
        error instanceof Error ? error.message : 'We could not file your report. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Top Header Bar */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={theme.textBody} />
          </Pressable>
          <View style={styles.brandContainer}>
            <View style={[styles.brandDot, { backgroundColor: theme.accent }]} />
            <ThemedText style={[styles.brand, { color: theme.textBody }]}>City Pulse Network</ThemedText>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Target Listing Summary */}
          {listing && (
            <View style={[styles.providerCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.providerHeaderRow}>
                <Ionicons name="business-outline" size={16} color={theme.accent} />
                <ThemedText style={[styles.providerBadgeText, { color: theme.accent }]}>Reporting Listing</ThemedText>
              </View>
              <ThemedText style={[styles.providerName, { color: theme.textBody }]}>
                {listing.name}
              </ThemedText>
              <ThemedText style={[styles.providerDetail, { color: theme.textSecondary }]}>
                {listing.area}
              </ThemedText>
            </View>
          )}

          <View style={styles.headerBlock}>
            <ThemedText style={[styles.question, { color: theme.textBody }]}>
              What is wrong with this listing?
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your report is confidential and helps keep information reliable for everyone in the neighborhood.
            </ThemedText>
          </View>

          {/* Reason Selection */}
          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selected === reason.id;
              return (
                <Pressable
                  key={reason.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setSelected(reason.id);
                  }}
                  style={({ pressed }) => [
                    styles.reasonCard,
                    {
                      backgroundColor: isSelected ? theme.accentSoft : theme.backgroundElement,
                      borderColor: isSelected ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.reasonText,
                      { color: theme.textBody, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {reason.label}
                  </ThemedText>
                  <View style={[styles.radio, { borderColor: isSelected ? theme.accent : theme.borderInput }]}>
                    {isSelected && (
                      <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Optional Note Section */}
          <View style={[styles.noteContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.noteLabel, { color: theme.textSecondary }]}>
              Add detail (optional)
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={MAX_NOTE_LENGTH}
              placeholder="E.g. They only have small notes left or the POS network is down."
              placeholderTextColor={theme.textTertiary}
              style={[styles.noteInput, { color: theme.textBody }]}
            />
            <ThemedText style={[styles.charCounter, { color: theme.textTertiary }]}>
              {note.length}/{MAX_NOTE_LENGTH}
            </ThemedText>
          </View>
        </ScrollView>

        {/* Sticky Actions Footer */}
        <View style={[styles.actionsContainer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primaryButton, 
              { backgroundColor: theme.accent }, 
              pressed && styles.pressed,
              isSubmitting && styles.disabledButton
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.primaryText}>Submit report</ThemedText>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              router.back();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: theme.textBody }]}>Cancel</ThemedText>
          </Pressable>
        </View>

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1, 
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  brandDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  brand: { 
    fontSize: 13, 
    lineHeight: 18, 
    fontWeight: '700', 
    letterSpacing: 0.3 
  },
  scrollContent: { 
    paddingVertical: 16, 
    paddingBottom: 32 
  },
  providerCard: { 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  providerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  providerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerName: { 
    fontSize: 16, 
    lineHeight: 22, 
    fontWeight: '800' 
  },
  providerDetail: { 
    fontSize: 12, 
    lineHeight: 16, 
    marginTop: 2, 
    fontWeight: '600' 
  },
  headerBlock: {
    marginBottom: 16,
  },
  question: { 
    fontSize: 20, 
    lineHeight: 26, 
    fontWeight: '800' 
  },
  subtitle: { 
    fontSize: 13, 
    lineHeight: 18, 
    marginTop: 4, 
  },
  reasonsContainer: { 
    gap: 10 
  },
  reasonCard: {
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  reasonText: { 
    fontSize: 14, 
    lineHeight: 20, 
    flex: 1, 
    paddingRight: 10 
  },
  radio: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  radioDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  noteContainer: { 
    marginTop: 16, 
    borderWidth: 1, 
    borderRadius: 14, 
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  noteLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  noteInput: { 
    minHeight: 88, 
    textAlignVertical: 'top', 
    fontSize: 14, 
    lineHeight: 20,
    paddingTop: 0,
  },
  charCounter: { 
    fontSize: 11, 
    textAlign: 'right', 
    marginTop: 6,
    fontWeight: '500',
  },
  actionsContainer: { 
    gap: 10, 
    paddingVertical: 12, 
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '800' 
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: { 
    fontSize: 13, 
    fontWeight: '700' 
  },
  blockedState: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12, 
    padding: 24 
  },
  blockedIcon: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 4,
  },
  blockedTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    textAlign: 'center' 
  },
  blockedBody: { 
    fontSize: 14, 
    lineHeight: 20, 
    textAlign: 'center',
    marginBottom: 8,
  },
  pressed: { 
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});