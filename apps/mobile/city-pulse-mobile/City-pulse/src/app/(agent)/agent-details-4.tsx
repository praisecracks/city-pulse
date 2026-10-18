import { router } from 'expo-router';
import { useCallback, useMemo, useState, memo } from 'react';
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
import { CATEGORY_META, Category } from '@/data/product';
import { useAppState } from '@/state/app-state';
import type { FoodDetails, GasDetails, HouseDetails, PosDetails } from '@/state/app-state';

// Modern Design Tokens (Preserved Original Theme)
const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_TIP_BG = '#FFFBEB';
const COLOR_TIP_BORDER = '#FDE68A';
const COLOR_TIP_TEXT = '#92400E';
const COLOR_DANGER_BG = '#FEF2F2';
const COLOR_DANGER_TEXT = '#EF4444';
const COLOR_DANGER_BORDER = '#FCA5A5';

function numberValue(value: string): number | undefined {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function textValue(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/<[^>]*>?/gm, '').trim();
}

// Reusable Field Component supporting Currency Prefix & Icons
const Field = memo(({ label, value, onChangeText, placeholder, keyboardType = 'default', prefix, icon }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  prefix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) => (
  <View style={styles.inputContainer}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <View style={styles.inputWrapper}>
      {icon && !prefix && <Ionicons name={icon} size={18} color={COLOR_TEXT_MUTED} style={styles.inputIcon} />}
      {prefix && <ThemedText style={styles.inputPrefix}>{prefix}</ThemedText>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLOR_TEXT_MUTED}
        keyboardType={keyboardType}
        style={[
          styles.input,
          (icon && !prefix) ? styles.inputWithIcon : null,
          prefix ? styles.inputWithPrefix : null,
        ]}
      />
    </View>
  </View>
));

export default function AgentDetailsScreen() {
  const { agentDraft, updateAgentDraft } = useAppState();

  const category = (agentDraft.category as Category) || 'pos';
  const categoryLabel = CATEGORY_META[category]?.label || 'Service';
  const savedDetails = agentDraft.serviceDetails;
  
  const savedPos = savedDetails && 'feePer5000' in savedDetails ? savedDetails : undefined;
  const savedFood = savedDetails && 'menuItems' in savedDetails ? savedDetails : undefined;
  const savedGas = savedDetails && 'pricePerKg' in savedDetails ? savedDetails : undefined;
  const savedHouse = savedDetails && 'propertyTypes' in savedDetails ? savedDetails : undefined;

  // Local States
  const [feePer5000, setFeePer5000] = useState(savedPos?.feePer5000?.toString() || '');
  const [feePer10000, setFeePer10000] = useState(savedPos?.feePer10000?.toString() || '');
  const [maxCashLimit, setMaxCashLimit] = useState(savedPos?.maxCashLimit?.toString() || '');
  
  const [acceptedCards, setAcceptedCards] = useState<string[]>(
    (savedPos as any)?.acceptedCardBrands || ['Transfer', 'Card', 'POS']
  );
  
  const [menuItems, setMenuItems] = useState(savedFood?.menuItems || [{ name: '', price: 0 }]);
  const [whatsappOrdering, setWhatsappOrdering] = useState(savedFood?.whatsappOrderingEnabled || false);
  const [foodHomeDelivery, setFoodHomeDelivery] = useState(savedFood?.homeDeliveryEnabled || false);
  const [foodDeliveryCharge, setFoodDeliveryCharge] = useState(savedFood?.deliveryCharge?.toString() || '');
  
  const [pricePerKg, setPricePerKg] = useState(savedGas?.pricePerKg?.toString() || '');
  const [pricePerCylinder, setPricePerCylinder] = useState(savedGas?.pricePerCylinder?.toString() || '');
  const [homeDelivery, setHomeDelivery] = useState(savedGas?.homeDeliveryEnabled || false);
  const [deliveryCharge, setDeliveryCharge] = useState(savedGas?.deliveryCharge?.toString() || '');
  
  const [propertyTypes, setPropertyTypes] = useState(savedHouse?.propertyTypes.join(', ') || '');
  const [rentRangeMin, setRentRangeMin] = useState(savedHouse?.rentRangeMin?.toString() || '');
  const [rentRangeMax, setRentRangeMax] = useState(savedHouse?.rentRangeMax?.toString() || '');
  const [coveredAreas, setCoveredAreas] = useState(savedHouse?.coveredAreas.join(', ') || '');
  
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Memoized Validation & Data Compilation
  const details = useMemo<PosDetails | FoodDetails | GasDetails | HouseDetails | null>(() => {
    if (category === 'pos') {
      const fee = numberValue(feePer5000);
      return fee ? { feePer5000: fee, feePer10000: numberValue(feePer10000), maxCashLimit: numberValue(maxCashLimit), acceptedCardBrands: acceptedCards as any } : null;
    }
    if (category === 'food') {
      const validItems = menuItems.filter((item) => textValue(item.name) && item.price > 0).map((item) => ({ name: textValue(item.name), price: item.price }));
      return validItems.length ? { 
        menuItems: validItems, 
        whatsappOrderingEnabled: whatsappOrdering,
        homeDeliveryEnabled: foodHomeDelivery,
        deliveryCharge: numberValue(foodDeliveryCharge)
      } : null;
    }
    if (category === 'gas') {
      const price = numberValue(pricePerKg);
      return price ? { pricePerKg: price, pricePerCylinder: numberValue(pricePerCylinder), homeDeliveryEnabled: homeDelivery, deliveryCharge: numberValue(deliveryCharge) } : null;
    }
    const properties = propertyTypes.split(',').map(textValue).filter(Boolean);
    const areas = coveredAreas.split(',').map(textValue).filter(Boolean);
    return properties.length && areas.length ? { propertyTypes: properties, rentRangeMin: numberValue(rentRangeMin), rentRangeMax: numberValue(rentRangeMax), coveredAreas: areas } : null;
  }, [category, feePer5000, feePer10000, maxCashLimit, acceptedCards, menuItems, whatsappOrdering, foodHomeDelivery, foodDeliveryCharge, pricePerKg, pricePerCylinder, homeDelivery, deliveryCharge, propertyTypes, rentRangeMin, rentRangeMax, coveredAreas]);

  const detailsError = touched && !details ? 'Please complete the required fields correctly.' : null;
  const canContinue = Boolean(details);

  const handleNext = useCallback(async () => {
    setTouched(true);
    setErrorMessage(null);

    if (!canContinue || isSubmitting) return;

    try {
      setIsSubmitting(true);
      updateAgentDraft({ serviceDetails: details || undefined });
      router.push('/agent-photos-5');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save service details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canContinue, isSubmitting, details, updateAgentDraft]);

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
              onPress={() => router.canGoBack() && router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
            </Pressable>
            <ThemedText style={styles.topBarTitle}>{categoryLabel} Details</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step Progress Indicator */}
            <View style={styles.stepContainer}>
              <ThemedText style={styles.stepBadgeText}>STEP 4 OF 6</ThemedText>
              <View style={styles.stepTrack}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
              </View>
            </View>

            {/* Header Group */}
            <View style={styles.headerGroup}>
              <ThemedText style={styles.title}>
                {category === 'pos' ? 'What are your charges?' : category === 'food' ? 'Menu & Food Pricing' : category === 'gas' ? 'What are your gas prices?' : 'What properties do you handle?'}
              </ThemedText>
              <ThemedText style={styles.description}>
                Provide clear details so neighbors can easily choose your service.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLOR_DANGER_TEXT} />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Form Card Wrapper */}
            <View style={styles.cardContainer}>
              {category === 'pos' && (
                <>
                  <Field label="FEE PER ₦5,000 WITHDRAWAL" value={feePer5000} onChangeText={setFeePer5000} placeholder="100" keyboardType="numeric" prefix="₦" />
                  <Field label="FEE PER ₦10,000 WITHDRAWAL (OPTIONAL)" value={feePer10000} onChangeText={setFeePer10000} placeholder="200" keyboardType="numeric" prefix="₦" />
                  <Field label="MAXIMUM CASH LIMIT PER TRANSACTION" value={maxCashLimit} onChangeText={setMaxCashLimit} placeholder="50000" keyboardType="numeric" prefix="₦" />
                  
                  <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>ACCEPTED PAYMENT METHODS</ThemedText>
                    <View style={styles.chipRow}>
                      {(['Transfer', 'Card', 'POS'] as const).map((method) => {
                        const active = acceptedCards.includes(method);
                        return (
                          <Pressable
                            key={method}
                            onPress={() => setAcceptedCards((curr) => active ? curr.filter((i) => i !== method) : [...curr, method])}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <Ionicons name={active ? "checkbox" : "square-outline"} size={16} color={active ? '#FFFFFF' : COLOR_TEXT_MUTED} />
                            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{method}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              {category === 'food' && (
                <>
                  <ThemedText style={styles.label}>MENU ITEMS & PRICES</ThemedText>
                  {menuItems.map((item, index) => (
                    <View key={index} style={styles.menuRow}>
                      <TextInput
                        value={item.name}
                        onChangeText={(name) => setMenuItems((curr) => curr.map((entry, idx) => idx === index ? { ...entry, name } : entry))}
                        placeholder="Item name (e.g. Jollof Rice)"
                        placeholderTextColor={COLOR_TEXT_MUTED}
                        style={[styles.input, styles.menuName]}
                      />
                      <View style={[styles.input, styles.menuPriceWrapper]}>
                        <ThemedText style={styles.inlinePrefix}>₦</ThemedText>
                        <TextInput
                          value={item.price ? String(item.price) : ''}
                          onChangeText={(price) => setMenuItems((curr) => curr.map((entry, idx) => idx === index ? { ...entry, price: Number(price.replace(/\D/g, '')) || 0 } : entry))}
                          placeholder="Price"
                          placeholderTextColor={COLOR_TEXT_MUTED}
                          keyboardType="numeric"
                          style={styles.menuPriceInput}
                        />
                      </View>
                      {menuItems.length > 1 && (
                        <Pressable
                          onPress={() => setMenuItems((curr) => curr.filter((_, idx) => idx !== index))}
                          style={styles.deleteMenuBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color={COLOR_DANGER_TEXT} />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable onPress={() => setMenuItems((curr) => [...curr, { name: '', price: 0 }])} style={styles.secondaryButton}>
                    <Ionicons name="add-circle-outline" size={18} color={COLOR_PRIMARY} />
                    <ThemedText style={styles.secondaryButtonText}>Add another item</ThemedText>
                  </Pressable>

                  <Pressable onPress={() => setWhatsappOrdering((curr) => !curr)} style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="logo-whatsapp" size={18} color={COLOR_PRIMARY} />
                      <ThemedText style={styles.switchLabel}>Enable WhatsApp ordering</ThemedText>
                    </View>
                    <View style={[styles.switch, whatsappOrdering && styles.switchActive]}>
                      <View style={[styles.switchKnob, whatsappOrdering && styles.switchKnobActive]} />
                    </View>
                  </Pressable>

                  <Pressable onPress={() => setFoodHomeDelivery((curr) => !curr)} style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="bicycle-outline" size={18} color={COLOR_PRIMARY} />
                      <ThemedText style={styles.switchLabel}>Enable home delivery</ThemedText>
                    </View>
                    <View style={[styles.switch, foodHomeDelivery && styles.switchActive]}>
                      <View style={[styles.switchKnob, foodHomeDelivery && styles.switchKnobActive]} />
                    </View>
                  </Pressable>

                  {foodHomeDelivery && (
                    <Field label="DELIVERY CHARGE (OPTIONAL)" value={foodDeliveryCharge} onChangeText={setFoodDeliveryCharge} placeholder="500" keyboardType="numeric" prefix="₦" />
                  )}
                </>
              )}

              {category === 'gas' && (
                <>
                  <Field label="PRICE PER KG" value={pricePerKg} onChangeText={setPricePerKg} placeholder="1200" keyboardType="numeric" prefix="₦" />
                  <Field label="PRICE FOR 12.5 KG CYLINDER" value={pricePerCylinder} onChangeText={setPricePerCylinder} placeholder="14400" keyboardType="numeric" prefix="₦" />
                  
                  <Pressable onPress={() => setHomeDelivery((curr) => !curr)} style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="bicycle-outline" size={18} color={COLOR_PRIMARY} />
                      <ThemedText style={styles.switchLabel}>Offer home delivery</ThemedText>
                    </View>
                    <View style={[styles.switch, homeDelivery && styles.switchActive]}>
                      <View style={[styles.switchKnob, homeDelivery && styles.switchKnobActive]} />
                    </View>
                  </Pressable>

                  {homeDelivery && (
                    <Field label="DELIVERY CHARGE (OPTIONAL)" value={deliveryCharge} onChangeText={setDeliveryCharge} placeholder="500" keyboardType="numeric" prefix="₦" />
                  )}
                </>
              )}

              {category === 'house' && (
                <>
                  <Field label="PROPERTY TYPES" value={propertyTypes} onChangeText={setPropertyTypes} placeholder="e.g. Self-contain, 2-bed flat" icon="home-outline" />
                  <Field label="MIN RENT PER YEAR" value={rentRangeMin} onChangeText={setRentRangeMin} placeholder="150000" keyboardType="numeric" prefix="₦" />
                  <Field label="MAX RENT PER YEAR" value={rentRangeMax} onChangeText={setRentRangeMax} placeholder="450000" keyboardType="numeric" prefix="₦" />
                  <Field label="SUB-NEIGHBORHOODS COVERED" value={coveredAreas} onChangeText={setCoveredAreas} placeholder="e.g. Ibara, Kuto, Ake" icon="map-outline" />
                </>
              )}

              {detailsError && <ThemedText style={styles.fieldErrorText}>{detailsError}</ThemedText>}

              {/* Informational Tip Box */}
              <View style={styles.tipBox}>
                <Ionicons name="time-outline" size={18} color={COLOR_TIP_TEXT} />
                <ThemedText style={styles.tipText}>
                  Keep your service details accurate. Listings without updates may be marked unconfirmed after 3 hours.
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
                  <ThemedText style={styles.primaryText}>Add photos</ThemedText>
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepContainer: {
    marginBottom: 16,
    gap: 6,
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
  headerGroup: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLOR_TEXT_MUTED,
    marginTop: 6,
  },
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
  cardContainer: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainer: {
    gap: 6,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  inputPrefix: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
  },
  input: {
    height: 50,
    backgroundColor: COLOR_BG,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  inputWithPrefix: {
    paddingLeft: 34,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.6,
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_DANGER_TEXT,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_BG,
  },
  chipActive: {
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_PRIMARY,
  },
  chipText: {
    color: COLOR_TEXT_MAIN,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  menuRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  menuName: {
    flex: 1,
  },
  menuPriceWrapper: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  inlinePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
    marginRight: 4,
  },
  menuPriceInput: {
    flex: 1,
    height: '100%',
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteMenuBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLOR_DANGER_BG,
    borderWidth: 1,
    borderColor: COLOR_DANGER_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLOR_BG,
  },
  secondaryButtonText: {
    color: COLOR_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: COLOR_TEXT_MAIN,
    fontSize: 14,
    fontWeight: '600',
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: COLOR_BORDER,
  },
  switchActive: {
    backgroundColor: COLOR_PRIMARY,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLOR_CARD,
  },
  switchKnobActive: {
    alignSelf: 'flex-end',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLOR_TIP_BG,
    borderWidth: 1,
    borderColor: COLOR_TIP_BORDER,
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_TIP_TEXT,
    fontWeight: '500',
  },
  actionGroup: {
    paddingVertical: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLOR_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
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
