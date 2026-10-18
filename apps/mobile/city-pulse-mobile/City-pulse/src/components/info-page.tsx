import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';

type InfoPageProps = {
  title: string;
  children: ReactNode;
  /** Fallback route used when there is no history to go back to. Defaults to '/home-discover'. */
  fallbackRoute?: string;
};

export function InfoPage({ title, children, fallbackRoute = '/home-discover' }: InfoPageProps) {
  const theme = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textBody} />
          </Pressable>
          <ThemedText style={[styles.topBarTitle, { color: theme.textBody }]}>{title}</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

export function InfoSectionHeader({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.sectionTitle, { color: theme.textTertiary }]}>
      {children}
    </ThemedText>
  );
}

export function InfoSection({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

export function InfoParagraph({ children }: { children: ReactNode }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.paragraph}>
      {children}
    </ThemedText>
  );
}

export function InfoSubtitle({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.subtitle, { color: theme.textBody }]}>
      {children}
    </ThemedText>
  );
}

export function InfoList({ items }: { items: string[] }) {
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={[styles.bullet, { backgroundColor: theme.accent }]}>
            <Ionicons name="ellipse" size={6} color="#FFFFFF" />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.listItemText}>
            {item}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_TAB_HEIGHT,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  list: {
    gap: 10,
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listItemText: {
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
});
