import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { VideoBackdrop } from '@/components/video-backdrop';
import { useAppState } from '@/state/app-state';

export function AnimatedSplashOverlay() {
  const { isHydrating, splashVisible, setSplashVisible } = useAppState();

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [setSplashVisible]);

  if (!isHydrating && !splashVisible) return null;

  return (
    <View style={styles.overlay}>
      <VideoBackdrop tealWash>
        <View style={styles.content}>
          <View style={styles.brandGroup}>
            <Image source={require('@/assets/logo-mark.png')} contentFit="contain" style={styles.logo} />
            <Text style={styles.title}>City Pulse</Text>
            <Text style={styles.subtitle}>ABEOKUTA SOUTH & NORTH</Text>
          </View>
          <Text style={styles.tagline}>Know before you leave home.</Text>
        </View>
      </VideoBackdrop>
    </View>
  );
}

export function AnimatedIcon() {
  return <Image source={require('@/assets/logo-transparent.png')} contentFit="contain" style={styles.image} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  brandGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 2,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  image: {
    width: 96,
    height: 96,
  },
});
