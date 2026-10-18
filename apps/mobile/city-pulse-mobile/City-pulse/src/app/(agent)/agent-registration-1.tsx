import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORY_META, Category } from '@/data/product';
import { useAppState } from '@/state/app-state';

// Modern Design Tokens (Matching Image Design Language)
const COLOR_PRIMARY = '#129E9E';
const COLOR_PRIMARY_LIGHT = '#D8F7F0';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_UNSELECTED_RADIO = '#E2E8F0';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';

// Whitelisted Categories
const ALLOWED_CATEGORIES: Category[] = ['pos', 'gas', 'food', 'house'];

const CATEGORY_DETAILS: Record<
  Category,
  { label: string; description: string; iconName: keyof typeof Ionicons.glyphMap }
> = {
  pos: {
    label: 'POS Cash Point',
    description: 'Dispensing cash, cash withdrawals',
    iconName: 'card-outline',
  },
  gas: {
    label: 'Cooking Gas',
    description: 'Refilling & cylinder delivery',
    iconName: 'flame-outline',
  },
  food: {
    label: 'Food Spot / Bukka',
    description: 'Local restaurants, cooked food',
    iconName: 'restaurant-outline',
  },
  house: {
    label: 'House Agent',
    description: 'Rentals, listings & accommodations',
    iconName: 'home-outline',
  },
};

export default function AgentRegistrationScreen() {
  const { agentDraft, updateAgentDraft } = useAppState();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    (agentDraft?.category as Category) || 'pos'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate Whitelisted Category Options
  const categories = useMemo(() => {
    return ALLOWED_CATEGORIES.filter((key) => CATEGORY_META[key] !== undefined);
  }, []);

  // Handle Selection Change
  const handleSelect = (category: Category) => {
    if (errorMessage) setErrorMessage(null);
    setSelectedCategory(category);
  };

  // Secure Continue Submission Handler
  const handleContinue = useCallback(async () => {
    if (!selectedCategory) {
      setErrorMessage('Please select a service category to proceed.');
      return;
    }

    if (!ALLOWED_CATEGORIES.includes(selectedCategory)) {
      setErrorMessage('Invalid service category selected.');
      return;
    }

    if (isProcessing) return;

    try {
      setErrorMessage(null);
      setIsProcessing(true);

      // Update local agent onboarding draft
      updateAgentDraft({ category: selectedCategory });

      // Navigate securely to next stage (Step 2)
      router.push('/agent-provider-info-2');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process selection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCategory, isProcessing, updateAgentDraft]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Navigation */}
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
          <ThemedText style={styles.topBarTitle}>Select Service</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Indicator Section */}
          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepBadgeText}>STEP 1 OF 6</ThemedText>
            <View style={styles.stepTrack}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={styles.stepBar} />
              <View style={styles.stepBar} />
              <View style={styles.stepBar} />
              <View style={styles.stepBar} />
              <View style={styles.stepBar} />
            </View>
          </View>

          {/* Title & Description */}
          <View style={styles.headerGroup}>
            <ThemedText style={styles.title}>What service do you provide?</ThemedText>
            <ThemedText style={styles.description}>
              Select your main business category. You can only choose one for now.
            </ThemedText>
          </View>

          {/* Dynamic Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
              <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            </View>
          )}

          {/* Category Option Cards */}
          <View style={styles.optionsList}>
            {categories.map((key) => {
              const detail = CATEGORY_DETAILS[key];
              const isSelected = selectedCategory === key;

              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => handleSelect(key)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconBox, isSelected && styles.iconBoxActive]}>
                    <Ionicons
                      name={detail.iconName}
                      size={20}
                      color={isSelected ? COLOR_PRIMARY : COLOR_TEXT_MUTED}
                    />
                  </View>

                  <View style={styles.optionCopy}>
                    <ThemedText style={styles.optionTitle}>{detail.label}</ThemedText>
                    <ThemedText style={styles.optionDetail}>{detail.description}</ThemedText>
                  </View>

                  {/* Radio / Check Indicator */}
                  <View style={styles.radioContainer}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLOR_PRIMARY} />
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Primary Action Group */}
        <View style={styles.actionGroup}>
          <Pressable
            accessibilityRole="button"
            disabled={!selectedCategory || isProcessing}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              (!selectedCategory || isProcessing) && styles.disabledButton,
              pressed && selectedCategory && styles.pressed,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.primaryText}>Continue</ThemedText>
            )}
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

  /* Scroll View Layout */
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
    backgroundColor: '#E2E8F0',
  },
  stepBarActive: {
    backgroundColor: COLOR_PRIMARY,
  },

  /* Title Header */
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

  /* Options List & Cards */
  optionsList: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCardActive: {
    backgroundColor: COLOR_PRIMARY_LIGHT,
    borderColor: COLOR_PRIMARY,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#FFFFFF',
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  optionDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_TEXT_MUTED,
    marginTop: 2,
  },

  /* Radio Controls */
  radioContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLOR_UNSELECTED_RADIO,
  },

  /* Action Button Group */
  actionGroup: {
    paddingVertical: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
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
