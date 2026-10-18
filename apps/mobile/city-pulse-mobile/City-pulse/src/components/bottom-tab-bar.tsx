import type { ComponentProps } from 'react';
import { StyleSheet, View, Pressable, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAppState } from '@/state/app-state';
import { fetchNotifications } from '@/utils/notification-api';
import { getCachedNotificationsSync, subscribeToCacheChange } from '@/utils/notification-cache';

// Design Tokens
const COLOR_BG = '#FFFFFF';
const COLOR_ACTIVE_BG = '#187171'; // Soft teal pill background
const COLOR_BORDER = '#E2E8F0';
const COLOR_INACTIVE = '#6b7d97';
const COLOR_ACTIVE = '#b7e7e7';
const COLOR_SHADOW = 'rgba(15, 23, 42, 0.08)';

// Total vertical space the floating tab bar occupies (height + margin + safe area)
export const BOTTOM_TAB_HEIGHT = 90;

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  key: string;
  label: string;
  icon: IconName;
  iconFocused: IconName;
  href: string;
};

const CUSTOMER_TABS: TabConfig[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFocused: 'home', href: '/home-discover' },
  { key: 'explore', label: 'Explore', icon: 'search-outline', iconFocused: 'search', href: '/category-list' },
  { key: 'favourite', label: 'Saved', icon: 'heart-outline', iconFocused: 'heart', href: '/favorites' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', iconFocused: 'person', href: '/profile' },
];

const AGENT_TABS: TabConfig[] = [
  { key: 'home', label: 'Dashboard', icon: 'home-outline', iconFocused: 'home', href: '/agent-dashboard' },
  { key: 'listings', label: 'Listings', icon: 'cube-outline', iconFocused: 'cube', href: '/agent-listings' },
  { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconFocused: 'notifications', href: '/agent-notifications' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', iconFocused: 'person', href: '/profile' },
];

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAppState();
  const pathname = usePathname();

  const isProvider = user?.roles?.includes('agent') ?? false;
  const tabs = isProvider
    ? AGENT_TABS
    : user
      ? CUSTOMER_TABS
      : CUSTOMER_TABS.filter((tab) => tab.key === 'home' || tab.key === 'explore');

  // Live unread count for the Alerts tab — seeded from the AsyncStorage cache
  // so the dot appears on the very first render, then refreshed from the
  // server whenever the user changes. Subscribes to cache mutations (e.g.
  // marks-as-read from the notifications screen) so the dot vanishes in real
  // time without waiting for a server poll.
  const readUnreadCount = (uid: string | undefined): number => {
    if (!uid) return 0;
    const cached = getCachedNotificationsSync(uid);
    return cached
      ? cached.notifications.filter((n) => n.readAt === null).length
      : 0;
  };

  const [unreadCount, setUnreadCount] = useState(() => {
    if (!isProvider || !user?.id) return 0;
    return readUnreadCount(user.id);
  });

  useEffect(() => {
    if (!isProvider || !user?.id) return;

    // Refresh from the server for a fresh count.
    let cancelled = false;
    void fetchNotifications(token).then(
      (result) => {
        if (!cancelled) setUnreadCount(result.unreadCount);
      },
      () => {
        /* keep the cached count */
      },
    );

    // Re-read the cache whenever it changes (e.g. user marks notifications
    // read from the Alerts screen) so the dot disappears instantly.
    const unsubscribe = subscribeToCacheChange(() => {
      setUnreadCount(readUnreadCount(user.id));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isProvider, user?.id, token]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleTabPress = (href: string) => {
    if (isActive(href)) return;
    router.replace(href as any);
  };

  // Safe floating margin calculation
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16;

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: bottomMargin },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.floatingContainer}>
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const showBadge = tab.key === 'notifications' && unreadCount > 0;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              onPress={() => handleTabPress(tab.href)}
              style={({ pressed }) => [
                styles.tabItem,
                active && styles.activeTabItem,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={active ? tab.iconFocused : tab.icon}
                  size={20}
                  color={active ? COLOR_ACTIVE : COLOR_INACTIVE}
                />
                {showBadge && <View style={styles.unreadDot} />}
              </View>
              {active && (
                <Text numberOfLines={1} style={styles.labelActive}>
                  {tab.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  floatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR_BG,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 64,
    width: '100%',
    maxWidth: 420, // keeps it elegant on wider screens/tablets
    
    // Premium Floating Shadow
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    paddingHorizontal: 8,
    gap: 6,
  },
  activeTabItem: {
    backgroundColor: COLOR_ACTIVE_BG,
    flex: 1.3, // gives active tab slightly more visual breathing room
  },

  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  labelActive: {
    fontSize: 11,
    fontWeight: '700',
    color: COLOR_ACTIVE,
  },
});