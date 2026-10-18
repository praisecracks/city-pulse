import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { useAppState } from '@/state/app-state';
import { resolveDisplayArea } from '@/utils/display-area';

const BRAND_TEAL = '#129E9E';

interface LocationHeaderProps {
  onChangeArea?: () => void;
  onProfilePress?: () => void;
  showAgentDashboard?: boolean;
  onAgentDashboardPress?: () => void;
}

export function LocationHeader({
  onChangeArea = () => router.push('/manual-area'),
  onProfilePress = () => router.push('/profile'),
  showAgentDashboard = false,
  onAgentDashboardPress = () => router.replace('/agent-dashboard'),
}: LocationHeaderProps) {
  const { customerLocation, user } = useAppState();
  const theme = useTheme();

  // Build display location from structured data. "Unknown area" is the
  // placeholder the reverse-geocode returns when it fails, so it is treated as
  // absent rather than shown to the user.
  let displayLocation = resolveDisplayArea(
    customerLocation?.serviceArea?.name,
    customerLocation?.address?.community,
    customerLocation?.label,
  );
  let isGps = false;

  if (customerLocation) {
    if (customerLocation.address?.streetName && customerLocation.address?.community) {
      displayLocation = `${customerLocation.address.streetName}, ${customerLocation.address.community}`;
    } else if (customerLocation.address?.community) {
      displayLocation = customerLocation.address.community;
    } else if (customerLocation.serviceArea?.name) {
      displayLocation = customerLocation.serviceArea.name;
    } else if (customerLocation.label) {
      displayLocation = customerLocation.label;
    }
    isGps = customerLocation.gps !== null;
  }

  const isAgent = user?.roles?.includes('agent') ?? false;

  return (
    <View style={styles.locationHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Current location: ${displayLocation}. Tap to change.`}
        onPress={onChangeArea}
        style={({ pressed }) => [styles.locationSelector, pressed && styles.pressed]}
      >
        <View style={styles.locationIconCircle}>
          <Ionicons name={isGps ? 'location' : 'location-outline'} size={18} color={BRAND_TEAL} />
        </View>
        <View style={styles.locationInfo}>
          <ThemedText style={styles.locationLabel}>LOCATION</ThemedText>
          <ThemedText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.locationValue}
          >
            {displayLocation}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>

      {showAgentDashboard && isAgent && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Agent Dashboard"
          onPress={onAgentDashboardPress}
          style={({ pressed }) => [styles.agentDashboardButton, pressed && styles.pressed]}
        >
          <Ionicons name="speedometer-outline" size={22} color={BRAND_TEAL} />
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Your profile"
        onPress={onProfilePress}
        style={({ pressed }) => [styles.userAvatar, pressed && styles.pressed]}
      >
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="person-circle-outline" size={40} color={BRAND_TEAL} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF6EE',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 158, 158, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  agentDashboardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 158, 158, 0.1)',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    fontSize: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});