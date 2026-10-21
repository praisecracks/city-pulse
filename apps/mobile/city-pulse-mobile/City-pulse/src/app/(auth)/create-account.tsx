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
import {
  isStrongPassword,
  isValidEmailAddress,
  isValidNigerianPhoneNumber,
  normalizePhoneNumber,
} from '@/utils/auth-validation';

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

// Strict Security & Sanitization Utilities
function sanitizeInput(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

function normalizePhone(rawPhone: string): string {
  return normalizePhoneNumber(rawPhone);
}

export default function CreateAccountScreen() {
  const { id, intent } = useLocalSearchParams<{ id?: string; intent?: string }>();

  // Input States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI Focus & Validation States
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, password: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation Logic
  const sanitizedName = useMemo(() => sanitizeInput(name), [name]);
  const sanitizedEmail = useMemo(() => sanitizeInput(email).toLowerCase(), [email]);
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);

  const errors = useMemo(() => {
    return {
      name:
        sanitizedName.length === 0
          ? 'Full name is required.'
          : sanitizedName.length < 2
          ? 'Name must be at least 2 characters.'
          : sanitizedName.length > 50
          ? 'Name cannot exceed 50 characters.'
          : null,
      email:
        sanitizedEmail.length === 0
          ? 'Email address is required.'
          : !isValidEmailAddress(sanitizedEmail)
          ? 'Enter a valid email address.'
          : null,
      phone:
        normalizedPhone.length === 0
          ? 'Phone number is required.'
          : !isValidNigerianPhoneNumber(phone)
          ? 'Enter a valid phone number (e.g., 0803 123 4567).'
          : null,
      password:
        password.length === 0
          ? 'Password is required.'
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
  }, [sanitizedName, sanitizedEmail, normalizedPhone, phone, password, confirmPassword]);

  const isFormValid = !errors.name && !errors.email && !errors.phone && !errors.password && !errors.confirmPassword && acceptedTerms;

  // Handlers
  const handleBlur = useCallback((field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    setErrorMessage(null);

    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const sanitizedId = sanitizeInput(id || '');
      const sanitizedIntent = sanitizeInput(intent || '');

      if (!MOCK_API) {
        await apiRequest('/auth/signup', {
          method: 'POST',
          body: {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: normalizedPhone,
            password,
            intent: sanitizedIntent,
          },
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace({
        pathname: '/sign-in',
        params: { id: sanitizedId, intent: sanitizedIntent, justSignedUp: 'true' },
      });
    } catch (err: unknown) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(describeError(err, 'An error occurred during account creation. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, sanitizedName, sanitizedEmail, normalizedPhone, password, id, intent]);

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
            <ThemedText style={styles.topBarTitle}>Create Account</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title & Description */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>Join your neighborhood.</ThemedText>
              <ThemedText style={styles.description}>
                Create your account to save listings, report issues, and join as a service provider.
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
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>FULL NAME</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder="Amina Bello"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={50}
                  autoCorrect={false}
                  textContentType="name"
                  style={[
                    styles.input,
                    touched.name && errors.name ? styles.inputError : null,
                  ]}
                />
                {touched.name && errors.name && (
                  <ThemedText style={styles.fieldErrorText}>{errors.name}</ThemedText>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>EMAIL ADDRESS</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => handleBlur('email')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="amina@example.com"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={80}
                  style={[
                    styles.input,
                    touched.email && errors.email ? styles.inputError : null,
                  ]}
                />
                {touched.email && errors.email && (
                  <ThemedText style={styles.fieldErrorText}>{errors.email}</ThemedText>
                )}
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>PHONE NUMBER</ThemedText>
                <TextInput
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => handleBlur('phone')}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  placeholder="0803 123 4567"
                  placeholderTextColor={COLOR_TEXT_MUTED}
                  maxLength={16}
                  style={[
                    styles.input,
                    touched.phone && errors.phone ? styles.inputError : null,
                  ]}
                />
                {touched.phone && errors.phone && (
                  <ThemedText style={styles.fieldErrorText}>{errors.phone}</ThemedText>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>PASSWORD</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  placeholder="Create a password"
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
                  onBlur={() => handleBlur('confirmPassword')}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  placeholder="Confirm your password"
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

            {/* Terms acceptance */}
            <View style={styles.termsRow}>
              <Pressable
                onPress={() => setAcceptedTerms((v) => !v)}
                style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </Pressable>
              <ThemedText style={styles.termsText}>
                I agree to the{' '}
                <ThemedText style={styles.termsLink} onPress={() => router.push('/terms' as any)}>
                  Terms of Service
                </ThemedText>{' '}
                and{' '}
                <ThemedText style={styles.termsLink} onPress={() => router.push('/privacy-policy' as any)}>
                  Privacy Policy
                </ThemedText>
                .
              </ThemedText>
            </View>
          </ScrollView>

          {/* Submit Action Group */}
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
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.primaryText}>Create Account</ThemedText>
                </>
              )}
            </Pressable>

            {/* Sign In Link */}
            <View style={styles.footerLink}>
              <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
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

  /* Top App Bar */
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

  /* Terms */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLOR_TEXT_MUTED,
    lineHeight: 18,
  },
  termsLink: {
    color: COLOR_PRIMARY,
    fontWeight: '700',
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