import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const SHIMMER_DURATION_MS = 1250;
const SWEEP_WIDTH = 220;

const SkeletonContext = createContext<Animated.Value | null>(null);

/**
 * Owns the one animation that drives every skeleton on screen.
 *
 * Running a loop per block would mean ~25 native drivers for a single screen,
 * all burning frames after loading finishes. One shared driver, stopped when
 * the subtree unmounts, keeps it to exactly one.
 */
function ShimmerProvider({ children }: { children: React.ReactNode }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SHIMMER_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [progress]);

  return <SkeletonContext.Provider value={progress}>{children}</SkeletonContext.Provider>;
}

function useSweep(blockWidth: number) {
  const progress = useContext(SkeletonContext);

  if (!progress) return undefined;

  // The band travels from just outside the left edge to just outside the right.
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SWEEP_WIDTH, blockWidth + SWEEP_WIDTH],
  });

  return {
    transform: [{ translateX }],
  } as const;
}

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A single shimmering placeholder block. Wraps its children in the shared
 * shimmer driver, so use it directly or via the helpers below.
 */
export function Skeleton({ width = '100%', height = 14, radius = 6, color = '#E8E2D8', style }: SkeletonProps) {
  // Percentage widths have no measurable pixel size, so the band is sized off
  // the widest plausible block and simply travels a little further.
  const blockWidth = typeof width === 'number' ? width : 320;
  const sweep = useSweep(blockWidth);

  return (
    <View
      style={[{ width, height, borderRadius: radius, backgroundColor: color, overflow: 'hidden' }, style]}
    >
      {sweep && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.sweep, sweep]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.75)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sweepGradient}
          />
        </Animated.View>
      )}
    </View>
  );
}

type SkeletonTextProps = {
  width?: number | `${number}%`;
  height?: number;
  lines?: number;
  radius?: number;
  lastLineWidth?: number | `${number}%`;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Stacked text placeholders; the final line is shortened like real copy. */
export function SkeletonText({
  width = '100%',
  height = 13,
  lines = 1,
  radius = 4,
  lastLineWidth = '60%',
  color = '#E8E2D8',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[styles.textGroup, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : width}
          height={height}
          radius={radius}
          color={color}
        />
      ))}
    </View>
  );
}

type SkeletonCircleProps = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonCircle({ size = 36, color = '#E8E2D8', style }: SkeletonCircleProps) {
  return <Skeleton width={size} height={size} radius={size / 2} color={color} style={style} />;
}

/** Card-shaped container that supplies the shimmer driver to its children. */
export function SkeletonGroup({ children }: { children: React.ReactNode }) {
  return <ShimmerProvider>{children}</ShimmerProvider>;
}

const styles = StyleSheet.create({
  sweep: {
    width: SWEEP_WIDTH,
  },
  sweepGradient: {
    flex: 1,
  },
  textGroup: {
    gap: 7,
    width: '100%',
  },
});
