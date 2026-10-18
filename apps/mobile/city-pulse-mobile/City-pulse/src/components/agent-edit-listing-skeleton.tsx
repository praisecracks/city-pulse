import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton, SkeletonGroup, SkeletonText } from '@/components/skeleton';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

/**
 * Shimmer placeholder that mirrors the layout of the edit-listing screen.
 * Wrapped in SafeAreaView with edges={['top']} so the shimmer does not get
 * clipped by the notification bar on Android / iOS.
 */
export function AgentEditListingSkeleton() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <SkeletonGroup>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.backBtn} />
            <Skeleton width={120} height={18} radius={4} color={theme.backgroundHover} />
            <View style={styles.saveBtn} />
          </View>
        </SafeAreaView>

        <View style={styles.scroll}>
          {/* Cover Photo Preview */}
          <Skeleton width="100%" height={160} radius={16} color={theme.backgroundHover} />

          {/* Listing Photos Section */}
          <View style={styles.section}>
            <Skeleton width={96} height={11} radius={3} color={theme.border} />
            <View style={styles.photoManagement}>
              {[0, 1].map((i) => (
                <Skeleton key={i} width={72} height={72} radius={10} color={theme.backgroundHover} />
              ))}
              <View style={styles.addPhotoBtn} />
            </View>
          </View>

          {/* Availability Status Section */}
          <View style={styles.section}>
            <Skeleton width={120} height={11} radius={3} color={theme.border} />
            <View style={styles.statusSelector}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width="30%" height={44} radius={10} color={theme.backgroundHover} />
              ))}
            </View>
          </View>

          {/* Business Details Section */}
          <View style={styles.section}>
            <Skeleton width={100} height={11} radius={3} color={theme.border} />
            <View style={styles.inputGroup}>
              <Skeleton width={80} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={44} radius={10} color={theme.backgroundHover} />
            </View>
            <View style={styles.inputGroup}>
              <Skeleton width={88} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={90} radius={10} color={theme.backgroundHover} />
            </View>
            <View style={styles.inputGroup}>
              <Skeleton width={92} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={44} radius={10} color={theme.backgroundHover} />
            </View>
            <View style={styles.inputGroup}>
              <Skeleton width={90} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={44} radius={10} color={theme.backgroundHover} />
            </View>
            <View style={styles.inputGroup}>
              <Skeleton width={60} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={44} radius={10} color={theme.backgroundHover} />
            </View>
            <View style={styles.inputGroup}>
              <Skeleton width={66} height={13} radius={3} color={theme.border} />
              <Skeleton width="100%" height={80} radius={10} color={theme.backgroundHover} />
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </View>
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
      paddingTop: 16,
      paddingBottom: 8,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 32,
      gap: 16,
    },
    section: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
    },
    photoManagement: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    addPhotoBtn: {
      width: 72,
      height: 72,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundHover,
    },
    statusSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    inputGroup: {
      gap: 4,
    },
    bottomSpace: {
      height: 24,
    },
  });
