import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from '@/components/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';

type Theme = ReturnType<typeof useTheme>;

/**
 * Placeholder shaped like the real dashboard.
 *
 * The block sizes mirror the corresponding styles in agent-dashboard.tsx
 * (businessThumbnail 60, statusIcon 36, statusCard padding, and so on) so the
 * layout does not shift when the data arrives — a skeleton that reflows on
 * swap is worse than a spinner.
 *
 * Wrapped in SafeAreaView with edges={['top']} so the shimmer does not get
 * clipped by the notification bar on Android / iOS.
 */
export function AgentDashboardSkeleton() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <SkeletonGroup>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Skeleton width={38} height={38} radius={10} color={theme.backgroundHover} />
              <View style={styles.headerCopy}>
                <Skeleton width={64} height={8} radius={3} color={theme.border} />
                <Skeleton width={116} height={15} radius={4} style={styles.headerTitleSpacing} color={theme.backgroundHover} />
              </View>
            </View>

            <View style={styles.headerRight}>
              <SkeletonCircle size={36} color={theme.backgroundHover} />
              <Skeleton width={82} height={32} radius={10} color={theme.backgroundHover} />
            </View>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome block */}
          <View style={styles.welcomeBlock}>
            <Skeleton width={188} height={24} radius={5} color={theme.backgroundHover} />
            <SkeletonText width={285} height={13} lines={2} lastLineWidth="72%" style={styles.welcomeSpacing} color={theme.border} />
          </View>

          {/* Active listing card */}
          <View style={styles.section}>
            <View style={styles.listingTopRow}>
              <Skeleton width={60} height={60} radius={10} color={theme.backgroundHover} />

              <View style={styles.listingInfoCol}>
                <View style={styles.eyebrowRow}>
                  <Skeleton width={74} height={9} radius={3} color={theme.border} />
                  <Skeleton width={56} height={17} radius={6} color={theme.backgroundHover} />
                </View>
                <Skeleton width={168} height={16} radius={4} style={styles.nameSpacing} color={theme.backgroundHover} />
                <Skeleton width={132} height={11} radius={3} style={styles.previewSpacing} color={theme.border} />
              </View>
            </View>

            {/* Trust score + freshness meta row */}
            <View style={styles.metaSubRow}>
              <Skeleton width={104} height={13} radius={4} color={theme.border} />
              <Skeleton width={3} height={3} radius={1.5} color={theme.border} />
              <Skeleton width={96} height={13} radius={4} color={theme.border} />
            </View>

            {/* Current status banner */}
            <View style={styles.currentStatus}>
              <View style={styles.currentStatusLeft}>
                <SkeletonCircle size={8} color={theme.backgroundHover} />
                <View style={styles.currentStatusCopy}>
                  <Skeleton width={104} height={13} radius={4} color={theme.backgroundHover} />
                  <Skeleton width={148} height={10} radius={3} style={styles.statusSubSpacing} color={theme.border} />
                </View>
              </View>
              <SkeletonCircle size={18} color={theme.backgroundHover} />
            </View>
          </View>

          {/* Broadcast status header */}
          <View style={styles.controlHeader}>
            <Skeleton width={128} height={16} radius={4} color={theme.backgroundHover} />
            <Skeleton width={78} height={20} radius={100} color={theme.backgroundHover} />
          </View>

          {/* Status options */}
          <View style={styles.statusStack}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.statusCard}>
                <View style={styles.statusCardMain}>
                  <Skeleton width={36} height={36} radius={10} color={theme.backgroundHover} />
                  <View style={styles.statusCardCopy}>
                    <Skeleton width={92} height={14} radius={4} color={theme.backgroundHover} />
                    <SkeletonText width={200} height={11} lines={1} lastLineWidth="80%" style={styles.statusDescSpacing} color={theme.border} />
                  </View>
                </View>
                <SkeletonCircle size={20} color={theme.backgroundHover} />
              </View>
            ))}
          </View>

          {/* Management tools */}
          <Skeleton width={104} height={9} radius={3} color={theme.border} style={styles.quickActionsLabel} />

          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <Skeleton width={36} height={36} radius={10} color={theme.backgroundHover} />
              <View style={styles.quickActionCopy}>
                <Skeleton width={148} height={13} radius={4} color={theme.backgroundHover} />
                <SkeletonText width={230} height={10} lines={2} lastLineWidth="65%" style={styles.quickActionSpacing} color={theme.border} />
              </View>
              <Skeleton width={16} height={16} radius={3} color={theme.backgroundHover} />
            </View>
          </View>
        </ScrollView>
      </View>
    </SkeletonGroup>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeAreaTop: {
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    header: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    headerCopy: {
      gap: 0,
    },
    headerTitleSpacing: {
      marginTop: 5,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    content: {
      flex: 1,
    },
    contentBody: {
      paddingTop: 4,
      paddingBottom: BOTTOM_TAB_HEIGHT,
    },

    /* Welcome */
    welcomeBlock: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    welcomeSpacing: {
      marginTop: 8,
    },

    /* Listing section card */
    section: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 14,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    listingTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    listingInfoCol: {
      flex: 1,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nameSpacing: {
      marginTop: 8,
    },
    previewSpacing: {
      marginTop: 7,
    },
    metaSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 8,
    },
    currentStatus: {
      marginTop: 10,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundHover,
    },
    currentStatusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    currentStatusCopy: {
      flex: 1,
      marginLeft: 10,
    },
    statusSubSpacing: {
      marginTop: 6,
    },

    /* Broadcast status */
    controlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    statusStack: {
      gap: 10,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    statusCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: theme.border,
      marginHorizontal: 16,
    },
    statusCardMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusCardCopy: {
      flex: 1,
      marginLeft: 10,
    },
    statusDescSpacing: {
      marginTop: 6,
    },

    /* Management tools */
    quickActionsLabel: {
      marginBottom: 10,
      marginHorizontal: 16,
    },
    quickActions: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    quickAction: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 16,
    },
    quickActionCopy: {
      flex: 1,
      marginLeft: 10,
    },
    quickActionSpacing: {
      marginTop: 6,
    },
  });
