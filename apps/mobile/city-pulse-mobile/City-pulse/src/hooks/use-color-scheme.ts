import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppState } from '@/state/app-state';

export function useColorScheme() {
  const { colorScheme: userPreference } = useAppState();
  const systemScheme = useRNColorScheme();

  if (userPreference === 'system') {
    return systemScheme;
  }
  return userPreference;
}
