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
import { isStrongPassword } from '@/utils/auth-validation';

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

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  const resetToken = sanitizeInput(token || '');

  // Input States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation
  const errors = useMemo(() => {
    return {
      password:
        password.length === 0
          ? 'New password is required.'
          : !isStrongPassword(password)
          ? 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
          : null,
      confirmPassword:
        confirmPassword.length === 0
          ? 'Please confirm your password.'
          : confirmPassword !== password
          ? 'Passwords do not match.'
          : null,
    };
  }, [password, confirmPassword]);

  const isFormValid = !errors.password && !errors.confirmPassword;

  const handleSubmit = useCallback(async () => {
    setTouched({ password: true, confirmPassword: true });
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isFormValid || isSubmitting) return;

  if (isSuccess) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color={COLOR_SUCCESS_TEXT} />
            <ThemedText style={styles.successTitle}>Password Reset Successful</ThemedText>
            <ThemedText style={styles.successDescription}>
              Your password has been updated. You can now sign in with your new password.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/sign-in')}
              style={styles.retryButton}
            >
              <ThemedText style={styles.retryButtonText}>Sign In</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!resetToken) {
      setErrorMessage('Invalid or missing reset token.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (!MOCK_API) {
        await apiRequest('/auth/reset-password', {
          method: 'POST',
          body: { token: resetToken, password },
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log('[MOCK] Password reset successful');
      }

      setSuccessMessage('Password reset successful. You can now sign in with your new password.');
      setIsSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(describeError(err, 'Failed to reset password. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, password, resetToken]);

  if (!resetToken) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLOR_DANGER_TEXT} />
            <ThemedText style={styles.errorTitle}>Invalid Reset Link</ThemedText>
            <ThemedText style={styles.errorMessage}>
              This password reset link is invalid or has expired.
            </ThemedText>
            <Pressable
              onPress={() => router.replace('/forgot-password')}
              style={styles.retryButton}
            >
              <ThemedText style={styles.retryButtonText}>Request New Link</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
            <ThemedText style={styles.topBarTitle}>New Password</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Content */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Set a new password.</ThemedText>
              <ThemedText style={styles.description}>
                Your new password must be different from previous passwords.
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

            {/* Form Fields */}
            <View style={styles.formGroup}>
              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>NEW PASSWORD</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  placeholder="Enter new password"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={50}
                  style={[
                    styles.input,
                    touched.password && errors.password ? styles.inputError : null,
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLOR_TEXT_MUTED} />
                </Pressable>
                {touched.password && errors.password && (
                  <ThemedText style={styles.fieldErrorText}>{errors.password}</ThemedText>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>CONFIRM PASSWORD</ThemedText>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  placeholder="Confirm new password"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={50}
                  style={[
                    styles.input,
                    touched.confirmPassword && errors.confirmPassword ? styles.inputError : null,
                  ]}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <ThemedText style={styles.fieldErrorText}>{errors.confirmPassword}</ThemedText>
                )}
              </View>
            </View>

            {/* Password Hint */}
            <View style={styles.hintContainer}>
              <ThemedText style={styles.hintText}>
                Use at least 8 characters with uppercase, lowercase, a number, and a special character.
              </ThemedText>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!isFormValid || isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                (!isFormValid || isSubmitting) && styles.disabledButton,
                pressed && isFormValid && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.primaryText}>Reset Password</ThemedText>
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
    position: 'relative',
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
    paddingRight: 48,
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
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 32,
    padding: 4,
  },

  /* Hint */
  hintContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },

  /* Success State */
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Error State */
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: COLOR_PRIMARY,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});