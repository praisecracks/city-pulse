import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from '@/components/skeleton';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

/**
 * Placeholder shaped like the real agent-listings screen.
 *
 * The block sizes mirror the corresponding styles in agent-listings.tsx
 * (card padding, thumbnail 60, action icon 36, status dot 8, etc.) so the
 * layout does not shift when the data arrives.
 *
 * Wrapped in SafeAreaView with edges={['top']} so the shimmer does not get
 * clipped by the notification bar on Android / iOS.
 */
export function AgentListingsSkeleton() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <SkeletonGroup>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Skeleton width={40} height={40} radius={20} color={theme.backgroundHover} />
            <Skeleton width={112} height={17} radius={4} color={theme.backgroundHover} style={styles.titleSpacing} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <SkeletonText
              width={260}
              height={13}
              lines={2}
              lastLineWidth="70%"
              color={theme.border}
              style={styles.introSpacing}
            />

            {/* Live listing card */}
            <View style={[styles.card, { borderColor: theme.border }]}>
              {/* Card top row: thumbnail + info */}
              <View style={styles.cardTopRow}>
                <Skeleton width={60} height={60} radius={10} color={theme.backgroundHover} />
                <View style={styles.cardInfo}>
                  <View style={styles.eyebrowRow}>
                    <Skeleton width={74} height={9} radius={3} color={theme.border} />
                    <Skeleton width={56} height={17} radius={6} color={theme.backgroundHover} />
                  </View>
                  <Skeleton width={168} height={16} radius={4} color={theme.backgroundHover} style={styles.nameSpacing} />
                  <Skeleton width={132} height={11} radius={3} color={theme.border} style={styles.previewSpacing} />
                </View>
              </View>

              {/* Meta row: trust score + freshness */}
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <SkeletonCircle size={13} color={theme.backgroundHover} />
                  <Skeleton width={104} height={13} radius={4} color={theme.border} />
                </View>
                <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                <View style={styles.metaBadge}>
                  <SkeletonCircle size={13} color={theme.backgroundHover} />
                  <Skeleton width={96} height={13} radius={4} color={theme.border} />
                </View>
              </View>

              {/* Status banner */}
              <View style={styles.statusBanner}>
                <SkeletonCircle size={8} color={theme.backgroundHover} />
                <Skeleton width={120} height={13} radius={4} color={theme.backgroundHover} />
              </View>
            </View>

            {/* Management section label */}
            <Skeleton width={64} height={9} radius={3} color={theme.border} style={styles.sectionLabelSpacing} />

            {/* Action stack */}
            <View style={styles.actionStack}>
              <View style={[styles.action, { borderColor: theme.border }]}>
                <View style={[styles.actionIcon, { backgroundColor: theme.backgroundHover }]}>
                  <SkeletonCircle size={18} color={theme.border} />
                </View>
                <View style={styles.actionCopy}>
                  <Skeleton width={168} height={13} radius={4} color={theme.backgroundHover} />
                  <SkeletonText
                    width={230}
                    height={10}
                    lines={2}
                    lastLineWidth="65%"
                    color={theme.border}
                    style={styles.actionSpacing}
                  />
                </View>
                <Skeleton width={16} height={16} radius={3} color={theme.backgroundHover} />
              </View>

              <View style={[styles.action, { borderColor: theme.border }]}>
                <View style={[styles.actionIcon, { backgroundColor: theme.backgroundHover }]}>
                  <SkeletonCircle size={18} color={theme.border} />
                </View>
                <View style={styles.actionCopy}>
                  <Skeleton width={148} height={13} radius={4} color={theme.backgroundHover} />
                  <SkeletonText
                    width={220}
                    height={10}
                    lines={2}
                    lastLineWidth="70%"
                    color={theme.border}
                    style={styles.actionSpacing}
                  />
                </View>
                <Skeleton width={16} height={16} radius={3} color={theme.backgroundHover} />
              </View>
            </View>

            {/* Danger note + button */}
            <SkeletonText
              width={280}
              height={11}
              lines={2}
              lastLineWidth="40%"
              color={theme.border}
              style={styles.dangerNoteSpacing}
            />
            <View style={styles.dangerButton}>
              <SkeletonCircle size={18} color={theme.backgroundHover} />
              <Skeleton width={120} height={14} radius={4} color={theme.backgroundHover} />
            </View>
          </ScrollView>
        </SafeAreaView>
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
    safeArea: {
      flex: 1,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 16,
      paddingBottom: 8,
    },
    titleSpacing: {
      marginLeft: 8,
    },
    scrollContent: {
      paddingTop: 4,
      paddingBottom: BOTTOM_TAB_HEIGHT,
    },
    introSpacing: {
      marginTop: 12,
      marginBottom: 12,
    },
    card: {
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardInfo: {
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
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 8,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaDivider: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
    },
    statusBanner: {
      marginTop: 10,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundHover,
    },
    sectionLabelSpacing: {
      marginTop: 20,
      marginBottom: 8,
    },
    actionStack: {
      gap: 10,
    },
    action: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    actionCopy: {
      flex: 1,
    },
    actionSpacing: {
      marginTop: 6,
    },
    dangerNoteSpacing: {
      marginTop: 24,
      marginBottom: 10,
      marginHorizontal: 16,
    },
    dangerButton: {
      height: 48,
      borderRadius: 14,
      marginTop: 10,
      marginHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.dangerBg,
    },
  });
