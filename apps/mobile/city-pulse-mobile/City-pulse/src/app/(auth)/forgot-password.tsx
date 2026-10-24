import { router, useLocalSearchParams } from 'expo-router';
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
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_API } from '@/utils/api-config';
import { apiRequest, describeError } from '@/utils/api-client';
import { isValidEmailAddress } from '@/utils/auth-validation';

// Modern Design Tokens
const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';
const COLOR_SUCCESS_BG = '#ECFDF5';
const COLOR_SUCCESS_BORDER = '#A7F3D0';
const COLOR_SUCCESS_TEXT = '#065F46';

function sanitizeInput(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

export default function ForgotPasswordScreen() {
  const { id, intent } = useLocalSearchParams<{ id?: string; intent?: string }>();

  // Input States
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Validation
  const sanitizedEmail = useMemo(() => sanitizeInput(email).toLowerCase(), [email]);

  const emailError = useMemo(() => {
    if (!touched && sanitizedEmail.length === 0) return null;
    if (sanitizedEmail.length === 0) return 'Email address is required.';
    if (!isValidEmailAddress(sanitizedEmail)) return 'Enter a valid email address.';
    return null;
  }, [sanitizedEmail, touched]);

  const canSubmit = sanitizedEmail.length > 0 && !emailError;

  const handleSubmit = useCallback(async () => {
    setTouched(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setStatusMessage('Sending reset link...');

      const msgTimer1 = setTimeout(() => setStatusMessage('Server may be starting up, please wait...'), 5000);
      const msgTimer2 = setTimeout(() => setStatusMessage('Still working on it, almost there...'), 15000);
      const msgTimer3 = setTimeout(() => setStatusMessage('This is taking longer than usual, hang tight...'), 30000);

      try {
        if (!MOCK_API) {
          await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: { email: sanitizedEmail },
            timeoutMs: 60000,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300));
          console.log(`[MOCK] Password reset link sent to ${sanitizedEmail}`);
        }

        setSuccessMessage('If the email exists, a password reset link has been sent.');
        setEmail('');
        setTouched(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } finally {
        clearTimeout(msgTimer1);
        clearTimeout(msgTimer2);
        clearTimeout(msgTimer3);
        setStatusMessage(null);
      }
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(describeError(err, 'Failed to send reset link. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, sanitizedEmail]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Top Bar Navigation */}
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
            <ThemedText style={styles.topBarTitle}>Reset Password</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Content */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Forgot your password?</ThemedText>
              <ThemedText style={styles.description}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Success Banner */}
            {successMessage && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={COLOR_SUCCESS_TEXT} />
                <ThemedText style={styles.successBannerText}>{successMessage}</ThemedText>
              </View>
            )}

            {/* Form Input */}
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>EMAIL ADDRESS</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setTouched(true)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="amina@example.com"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={254}
                  style={[
                    styles.input,
                    touched && emailError ? styles.inputError : null,
                  ]}
                />
                {touched && emailError && (
                  <ThemedText style={styles.fieldErrorText}>{emailError}</ThemedText>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Status message during long waits */}
          {statusMessage && (
            <View style={styles.statusBanner}>
              <ActivityIndicator size="small" color={COLOR_PRIMARY} />
              <ThemedText style={styles.statusText}>{statusMessage}</ThemedText>
            </View>
          )}
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canSubmit || isSubmitting) && styles.disabledButton,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.primaryText}>Send Reset Link</ThemedText>
                </>
              )}
            </Pressable>

            {/* Back to Sign In Link */}
            <View style={styles.footerLink}>
              <ThemedText style={styles.footerText}>Remember your password? </ThemedText>
              <Pressable onPress={() => router.replace({ pathname: '/sign-in', params: { id, intent } })}>
                <ThemedText style={styles.linkText}>Sign In</ThemedText>
              </Pressable>
            </View>
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

  /* Main Content */
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
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

  /* Success Banner */
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR_SUCCESS_BG,
    borderWidth: 1,
    borderColor: COLOR_SUCCESS_BORDER,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLOR_SUCCESS_TEXT,
    fontWeight: '600',
  },

  /* Form */
  formGroup: {
    gap: 16,
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
  input: {
    height: 50,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: COLOR_TEXT_MAIN,
    fontSize: 14,
    fontWeight: '600',
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

  /* Status Banner */
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },

  /* Action Buttons */
  actionGroup: {
    paddingVertical: 16,
    gap: 16,
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
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },

  /* Footer Link */
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLOR_TEXT_MUTED,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    color: COLOR_PRIMARY,
    fontWeight: '700',
  },
});