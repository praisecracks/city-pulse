import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/state/app-state';
import { CATEGORY_META, Category } from '@/data/product';

// Modern Design Tokens (Syncing across Step 1 - Step 5)
const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';

// Category-specific placeholders
const CATEGORY_PLACEHOLDERS: Record<Category, { businessName: string; phone: string; email: string; whatsapp: string }> = {
  pos: {
    businessName: 'e.g. Adebayo POS & Ventures',
    phone: '0803 456 7890',
    email: 'e.g. hello@example.com',
    whatsapp: 'Different from the number above',
  },
  gas: {
    businessName: 'e.g. Hassan Gas & Refills',
    phone: '0803 456 7890',
    email: 'e.g. hello@example.com',
    whatsapp: 'Different from the number above',
  },
  food: {
    businessName: "e.g. Mama's Kitchen",
    phone: '0803 456 7890',
    email: 'e.g. hello@example.com',
    whatsapp: 'Different from the number above',
  },
  house: {
    businessName: 'e.g. Prime Properties Ltd',
    phone: '0803 456 7890',
    email: 'e.g. hello@example.com',
    whatsapp: 'Different from the number above',
  },
};

// Sanitization & Formatting Helpers
function sanitizeInput(text: string): string {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

function formatPhoneDisplay(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

export default function AgentProviderInfoScreen() {
  const { agentDraft, updateAgentDraft } = useAppState();

  // Get selected category from draft (set in Step 1)
  const selectedCategory = useMemo(() => (agentDraft.category as Category) || 'pos', [agentDraft.category]);

  // Get placeholders for selected category
  const placeholders = useMemo(() => CATEGORY_PLACEHOLDERS[selectedCategory] || CATEGORY_PLACEHOLDERS.pos, [selectedCategory]);

  const [businessName, setBusinessName] = useState(agentDraft.businessName || '');
  const [phone, setPhone] = useState(agentDraft.phone || '');
  const [email, setEmail] = useState(agentDraft.email || '');
  const [whatsapp, setWhatsapp] = useState(agentDraft.whatsapp || '');
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field Validations
  const cleanedBusinessName = useMemo(() => sanitizeInput(businessName), [businessName]);
  const rawPhoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);

  const nameError = useMemo(() => {
    if (!touchedFields.businessName && businessName.length === 0) return null;
    if (cleanedBusinessName.length < 3) return 'Business name must be at least 3 characters.';
    return null;
  }, [businessName, cleanedBusinessName, touchedFields.businessName]);

  const phoneError = useMemo(() => {
    if (!touchedFields.phone && phone.length === 0) return null;
    if (rawPhoneDigits.length < 10 || rawPhoneDigits.length > 11) {
      return 'Enter a valid 10 or 11-digit phone number.';
    }
    return null;
  }, [phone, rawPhoneDigits, touchedFields.phone]);

  const canContinue =
    cleanedBusinessName.length >= 3 &&
    rawPhoneDigits.length >= 10 &&
    rawPhoneDigits.length <= 11 &&
    !nameError &&
    !phoneError;

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Phone Number Input Formatting Handler
  const handlePhoneChange = (val: string) => {
    if (errorMessage) setErrorMessage(null);
    const formatted = formatPhoneDisplay(val);
    setPhone(formatted);
  };

  // Secure Navigation to Step 3
  const handleNext = useCallback(async () => {
    setTouchedFields({ businessName: true, phone: true });
    setErrorMessage(null);

    if (!canContinue || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Save sanitized Business Details to state draft
      updateAgentDraft({
        businessName: cleanedBusinessName,
        phone: rawPhoneDigits,
        email: sanitizeInput(email) || undefined,
        whatsapp: whatsapp.replace(/\D/g, '') || undefined,
      });

      // Route securely to Step 3
      router.push('/agent-location-3');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save business info. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canContinue, isSubmitting, cleanedBusinessName, rawPhoneDigits, email, whatsapp, updateAgentDraft]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Top Bar Header */}
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
            <ThemedText style={styles.topBarTitle}>Business Details</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step Progress Indicator (Step 2 of 6) */}
            <View style={styles.stepContainer}>
              <ThemedText style={styles.stepBadgeText}>STEP 2 OF 6</ThemedText>
              <View style={styles.stepTrack}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
              </View>
            </View>

            {/* Dynamic Header */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Tell us about your business.</ThemedText>
              <ThemedText style={styles.description}>
                This helps neighbors identify and contact your active service.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {/* Business / Agency Name Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>BUSINESS OR AGENCY NAME</ThemedText>
                <TextInput
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => markTouched('businessName')}
                  placeholder={placeholders.businessName}
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={60}
                  style={[
                    styles.input,
                    touchedFields.businessName && nameError ? styles.inputError : null,
                  ]}
                />
                {touchedFields.businessName && nameError && (
                  <ThemedText style={styles.fieldErrorText}>{nameError}</ThemedText>
                )}
              </View>

              {/* Contact Phone Field */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>CONTACT PHONE NUMBER</ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onBlur={() => markTouched('phone')}
                  keyboardType="phone-pad"
                  placeholder={placeholders.phone}
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={15}
                  style={[
                    styles.input,
                    touchedFields.phone && phoneError ? styles.inputError : null,
                  ]}
                />
                {touchedFields.phone && phoneError && (
                  <ThemedText style={styles.fieldErrorText}>{phoneError}</ThemedText>
                )}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>EMAIL ADDRESS (OPTIONAL)</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={placeholders.email}
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={100}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>WHATSAPP NUMBER (OPTIONAL)</ThemedText>
                <TextInput
                  value={whatsapp}
                  onChangeText={(value) => setWhatsapp(formatPhoneDisplay(value))}
                  keyboardType="phone-pad"
                  placeholder={placeholders.whatsapp}
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={15}
                  style={styles.input}
                />
                {/* The whole point of a separate field is that it can be a
                    different line from the call number, so say so rather than
                    leaving providers to assume it mirrors the phone field. */}
                <ThemedText style={styles.helperText}>
                  Only fill this if your WhatsApp is a different number. Leave blank and customers
                  will not see a WhatsApp button.
                </ThemedText>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!canContinue || isSubmitting}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canContinue || isSubmitting) && styles.disabledButton,
                pressed && canContinue && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText style={styles.primaryText}>Continue to Location</ThemedText>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },

  /* Navigation Bar */
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

  /* Scrollable Body */
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 24,
  },

  /* Step Progress Bar */
  stepContainer: {
    marginBottom: 20,
    gap: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLOR_PRIMARY,
    letterSpacing: 0.5,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLOR_BORDER,
  },
  stepBarActive: {
    backgroundColor: COLOR_PRIMARY,
  },

  /* Header Group */
  headerGroup: {
    marginBottom: 24,
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
    marginTop: 8,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR_DANGER_BG,
    borderWidth: 1,
    borderColor: COLOR_DANGER_BORDER,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLOR_DANGER_TEXT,
    fontWeight: '600',
  },

  /* Inputs & Form Group */
  formGroup: {
    gap: 18,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLOR_TEXT_MUTED,
  },
  input: {
    height: 50,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '500',
  },
  inputError: {
    borderColor: COLOR_DANGER_TEXT,
    backgroundColor: COLOR_DANGER_BG,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLOR_DANGER_TEXT,
    marginTop: 2,
  },

  /* Action Buttons */
  actionGroup: {
    paddingVertical: 16,
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
  disabledButton: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
