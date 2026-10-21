import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Category } from '@/data/product';

const BRAND_TEAL = '#129E9E';

export type FeatureInsight = {
  eyebrow: string;
  headline: string;
  supportingText: string;
  freshness?: string;
  icon: keyof typeof Ionicons.glyphMap;
  cta: string;
  category?: Category;
  imageUri?: string;
  /** Optional array of full insight updates to cycle through for a "live" feel.
   *  Each entry should be a complete insight object so all fields change together. */
  rotatingInsights?: FeatureInsight[];
  /**
   * The CTA opens the full explore feed rather than the category above.
   * `category` is still used for the icon, so this flag is what decides
   * where the button goes — without it, a category is present on nearly
   * every insight and the CTA silently becomes a category filter.
   */
  ctaShowsAll?: boolean;
};

type FeatureInsightCardProps = {
  insight: FeatureInsight;
  onCtaPress: () => void; // Only the button triggers redirection/navigation
  style?: StyleProp<ViewStyle>;
};

export function FeatureInsightCard({ insight, onCtaPress, style }: FeatureInsightCardProps) {
  const [rotationIndex, setRotationIndex] = useState(-1);
  const insights = insight.rotatingInsights;
  const isRotating = !!insights && insights.length > 1;

  // Derived rather than stored: the insight follows the rotation index,
  // so all fields (headline, supportingText, eyebrow, cta, freshness, icon) 
  // change together for a realistic "live" feel.
  const currentInsight = isRotating && insights && rotationIndex >= 0
    ? insights[rotationIndex % insights.length]
    : insight;

  useEffect(() => {
    if (!isRotating || !insights) return;

    const interval = setInterval(() => {
      setRotationIndex((index) => (index + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isRotating, insights]);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: 'rgba(12, 80, 80, 0.35)', // Teal-tinted border edge to tie into your brand theme
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#0D1F1E', '#122E2C', '#164643']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Brand glow bleeding in from the bottom right */}
      <LinearGradient
        colors={['rgba(18, 158, 158, 0)', 'rgba(18, 158, 158, 0.28)', 'rgba(45, 212, 191, 0.42)']}
        locations={[0, 0.6, 1]}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft highlight hugging the top-right corner */}
      <LinearGradient
        colors={['rgba(45, 212, 191, 0.22)', 'rgba(18, 158, 158, 0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Left Content Area */}
      <View style={styles.contentArea}>
        {currentInsight.eyebrow && (
          <View style={styles.badgePill}>
            <View style={styles.liveDot} />
            <ThemedText style={styles.badgeText}>{currentInsight.eyebrow}</ThemedText>
          </View>
        )}

        <ThemedText style={styles.headline} numberOfLines={1}>
          {currentInsight.headline}
        </ThemedText>
        
        <ThemedText style={styles.supporting} numberOfLines={1}>
          {currentInsight.supportingText}
        </ThemedText>

        {/* Only this button handles the redirection navigation */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={currentInsight.cta || 'View listing'}
          onPress={onCtaPress}
          style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
        >
          <ThemedText style={styles.ctaText}>{currentInsight.cta || 'View listing'}</ThemedText>
          <View style={styles.ctaIconCircle}>
            <Ionicons name="arrow-forward" size={10} color="#0F172A" />
          </View>
        </Pressable>
      </View>

      {/* Right Visual / Icon Area */}
      <View style={styles.visualArea}>
        {currentInsight.imageUri ? (
          <Image
            source={{ uri: currentInsight.imageUri }}
            style={styles.cardImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.fallbackVisual}>
            <View style={styles.radarRingOuter} />
            <View style={styles.radarRingInner}>
              <Ionicons name={currentInsight.icon || 'flash'} size={20} color={BRAND_TEAL} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    borderWidth: 1.5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 110, // Keeps height compact so it doesn't push down other elements
    maxHeight: 120,
    shadowColor: '#090D16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  contentArea: {
    flex: 2.0,
    paddingRight: 8,
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 158, 158, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(18, 158, 158, 0.4)',
    gap: 5,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2DD4BF',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#2DD4BF',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  supporting: {
    fontSize: 10,
    lineHeight: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: BRAND_TEAL,
    paddingLeft: 8,
    paddingRight: 3,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 6,
    marginLeft: 2,
    marginBottom: 3,
  },
  ctaText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualArea: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 72,
    borderRadius: 10,
  },
  fallbackVisual: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 158, 158, 0.08)',
    position: 'relative',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(18, 158, 158, 0.3)',
    borderStyle: 'dashed',
  },
  radarRingInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(18, 158, 158, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});