import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppState } from '@/state/app-state';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme: userPreference, isHydrating } = useAppState();
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated || isHydrating) {
    return 'light';
  }

  if (userPreference === 'system') {
    return systemScheme;
  }
  return userPreference;
}
