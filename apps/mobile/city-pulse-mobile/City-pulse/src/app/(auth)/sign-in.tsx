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
import { MOCK_API, resolveApiAssetUrl } from '@/utils/api-config';
import { apiRequest, describeError } from '@/utils/api-client';
import {
  isValidEmailAddress,
  isValidNigerianPhoneNumber,
  normalizePhoneNumber,
} from '@/utils/auth-validation';
import { useAppState } from '@/state/app-state';

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

function sanitizeInput(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

function normalizePhone(rawPhone: string): string {
  return normalizePhoneNumber(rawPhone);
}

export default function SignInScreen() {
  const { id, intent, justSignedUp } = useLocalSearchParams<{ id?: string; intent?: string; justSignedUp?: string }>();
  const { signIn } = useAppState();

  // Input & Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation
  const sanitizedIdentifier = useMemo(() => sanitizeInput(identifier).toLowerCase(), [identifier]);
  const isPhone = useMemo(() => /^[+()\d\s-]+$/.test(sanitizedIdentifier), [sanitizedIdentifier]);
  const normalizedIdentifier = useMemo(() => {
    if (isPhone) return normalizePhone(sanitizedIdentifier);
    return sanitizedIdentifier;
  }, [sanitizedIdentifier, isPhone]);

  const errors = useMemo(() => {
    return {
      identifier:
        sanitizedIdentifier.length === 0
          ? 'Phone number or email is required.'
          : isPhone && !isValidNigerianPhoneNumber(identifier)
          ? 'Enter a valid phone number (e.g., 0803 123 4567).'
          : !isPhone && !isValidEmailAddress(sanitizedIdentifier)
          ? 'Enter a valid email address.'
          : null,
      password:
        password.length === 0
          ? 'Password is required.'
          : null,
    };
  }, [sanitizedIdentifier, identifier, isPhone, password]);

  const canContinue = !errors.identifier && !errors.password;

  // Form Submission
  const handleSubmit = useCallback(async () => {
    setTouched({ identifier: true, password: true });
    setErrorMessage(null);

    if (!canContinue || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const sanitizedId = sanitizeInput(id || '');
      const sanitizedIntent = sanitizeInput(intent || '');

      let backendUser: any;
      let token: string;

      if (MOCK_API) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        backendUser = {
          _id: 'mock-user-id',
          name: 'Test User',
          email: normalizedIdentifier.includes('@') ? normalizedIdentifier : 'test@example.com',
          phone: isPhone ? normalizedIdentifier : '08031234567',
          otpVerified: false,
          isVerified: false,
          roles: ['customer'],
          agentIntent: false,
          trustScore: 3,
          badges: [],
          businessProfileVisibility: 'public',
        };
        token = 'mock-token-' + Date.now();
      } else {
        const payload = await apiRequest<{
          data?: { user?: Record<string, any>; token?: string };
        }>('/auth/signin', {
          method: 'POST',
          body: { identifier: normalizedIdentifier, password },
        });

        if (!payload.data?.user || !payload.data.token) {
          throw new Error('Sign-in could not be completed. Please try again.');
        }

        backendUser = payload.data.user;
        token = payload.data.token;
      }

      const authenticatedUser = {
        id: backendUser._id,
        name: backendUser.name,
        email: backendUser.email,
        phone: backendUser.phone,
        verified: backendUser.isVerified === true,
        token,
        roles: backendUser.roles || ['customer'],
        agentIntent: backendUser.agentIntent ?? false,
        avatar: backendUser.avatar ? resolveApiAssetUrl(backendUser.avatar) : undefined,
        trustScore: backendUser.trustScore,
        badges: backendUser.badges,
        businessProfileVisibility: backendUser.businessProfileVisibility,
      };

      await signIn(authenticatedUser);

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const isProvider = authenticatedUser.roles.includes('agent');
      const isAgentApplicant = !isProvider && authenticatedUser.agentIntent;

      if (isProvider) {
        router.replace('/agent-dashboard');
        return;
      }

      if (isAgentApplicant) {
        router.replace('/agent-registration-1');
        return;
      }

      const targetReportId = sanitizedId;
      if (targetReportId) {
        router.replace(`/report-reason?id=${encodeURIComponent(targetReportId)}`);
      } else {
        router.replace('/home-discover');
      }
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(describeError(err, 'Invalid credentials. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [canContinue, isSubmitting, normalizedIdentifier, isPhone, password, signIn, id, intent]);

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

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
            <ThemedText style={styles.topBarTitle}>Sign In</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Success Banner */}
            {justSignedUp === 'true' && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={COLOR_PRIMARY} />
                <ThemedText style={styles.successBannerText}>Account created. Please sign in.</ThemedText>
              </View>
            )}

            {/* Header Content */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Welcome back.</ThemedText>
              <ThemedText style={styles.description}>
                Enter your phone number or email and password to continue.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Form Input */}
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>PHONE OR EMAIL</ThemedText>
                <TextInput
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, identifier: true }))}
                  keyboardType={isPhone ? 'phone-pad' : 'email-address'}
                  textContentType={isPhone ? 'telephoneNumber' : 'emailAddress'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="0803 123 4567 or amina@example.com"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={80}
                  style={[
                    styles.input,
                    touched.identifier && errors.identifier ? styles.inputError : null,
                  ]}
                />
                {touched.identifier && errors.identifier && (
                  <ThemedText style={styles.fieldErrorText}>{errors.identifier}</ThemedText>
                )}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>PASSWORD</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  placeholder="Enter your password"
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
            </View>

            {/* Forgot Password Link */}
            <Pressable onPress={handleForgotPassword} style={styles.forgotPasswordPressable}>
              <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
            </Pressable>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityRole="button"
              disabled={!canContinue || isSubmitting}
              onPress={handleSubmit}
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
                  <Ionicons name="key-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.primaryText}>Sign In</ThemedText>
                </>
              )}
            </Pressable>

            {/* Create Account Link */}
            <View style={styles.footerLink}>
              <ThemedText style={styles.footerText}>Don&apos;t have an account? </ThemedText>
              <Pressable onPress={() => router.replace({ pathname: '/create-account', params: { id, intent } })}>
                <ThemedText style={styles.linkText}>Create Account</ThemedText>
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

  /* Success Banner */
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
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

  /* Forgot Password */
  forgotPasswordPressable: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLOR_PRIMARY,
    fontWeight: '700',
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