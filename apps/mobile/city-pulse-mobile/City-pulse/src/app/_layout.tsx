import { getAgentResumePath, isAgentOnboardingRoute } from '@/utils/agent-onboarding';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStateProvider, useAppState } from '@/state/app-state';
import { OfflineBanner } from '@/components/offline-banner';

void SplashScreen.preventAutoHideAsync();

const TAB_ROUTES = [
  '/home-discover',
  '/agent-dashboard',
  '/category-list',
  '/favorites',
  '/agent-listings',
  '/agent-notifications',
  '/profile',
];

function isOnboardingRoute(path: string) {
  return isAgentOnboardingRoute(path);
}

function RootRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrating, isSessionReady, hasSeenOnboarding, setSplashVisible, agentDraft, user } = useAppState();

  const hasRouted = useRef(false);
  const hasCorrected = useRef(false);
  const [isRouted, setIsRouted] = useState(false);

  const isProvider = user?.roles?.includes('agent') ?? false;
  const isApplicant = !isProvider && (user?.agentIntent ?? false);
  const resumePath = isApplicant ? getAgentResumePath(agentDraft) : null;

  const isTabRoute = TAB_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '/'),
  );
  const isOnboarding = isOnboardingRoute(pathname);
  const isOnboardingStep = isOnboarding && pathname !== '/agent-success';

  const homeFor = useCallback((): string | null => {
    if (user && resumePath) return resumePath;
    if (!user) return hasSeenOnboarding ? '/home-discover' : null;
    return isProvider ? '/agent-dashboard' : '/home-discover';
  }, [user, resumePath, hasSeenOnboarding, isProvider]);

  useEffect(() => {
    if (isHydrating || hasRouted.current) return;
    hasRouted.current = true;
    setIsRouted(true);

    const destination = homeFor();
    if (!destination || pathname === destination) return;
    if (isOnboarding && !resumePath && !isProvider) return;

    router.replace(destination as any);
  }, [isHydrating, pathname, router, homeFor, isOnboarding, resumePath, isProvider]);

  useEffect(() => {
    if (isHydrating || !isSessionReady) return;
    if (hasCorrected.current) return;
    hasCorrected.current = true;

    const destination = homeFor();
    if (!destination || pathname === destination) return;

    const strandedOnOnboarding = isOnboarding && !resumePath && isProvider;
    if (!isTabRoute && !strandedOnOnboarding) return;

    router.replace(destination as any);
  }, [isHydrating, isSessionReady, isTabRoute, isOnboarding, isProvider, resumePath, pathname, router, homeFor]);

  useEffect(() => {
    if (isHydrating || !isSessionReady || !isOnboardingStep) return;
    if (user?.agentIntent && !isProvider) return;

    router.replace((user ? homeFor() : '/home-discover') as any);
  }, [isHydrating, isSessionReady, isOnboardingStep, user, isProvider, router, homeFor]);

  useEffect(() => {
    if (isHydrating || !isRouted) return;
    SplashScreen.hideAsync().catch((error) => {
      console.error('Failed to hide the native splash screen:', error);
    });
    const timer = setTimeout(() => setSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [isHydrating, isRouted, setSplashVisible]);

  return null;
}

function BottomTabBarManager() {
  const pathname = usePathname();
  const { user } = useAppState();
  const showTabBar =
    !!user &&
    TAB_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '/'));

  if (!showTabBar) return null;
  return <BottomTabBar />;
}

function AppContent() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <OfflineBanner />
      <RootRedirect />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <BottomTabBarManager />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    // The boundary sits above the app state on purpose. If anything below it
    // throws while rendering, the user gets a screen with a way forward
    // instead of a blank window with the native splash still on top of it.
    <AppErrorBoundary>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </AppErrorBoundary>
  );
}
