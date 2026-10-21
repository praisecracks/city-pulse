import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Category } from '@/data/product';
import { apiRequest, isOfflineError } from '@/utils/api-client';
import { sanitizePersistedDraft, toPersistedDraft } from '@/utils/agent-onboarding';
import {
  addFavoriteRemote,
  fetchFavoriteIds,
  removeFavoriteRemote,
} from '@/utils/favorites-api';
import { startOfflineQueueListener } from '@/utils/offline-queue';
import { clearCachedNotifications } from '@/utils/notification-cache';
import { resolveApiAssetUrl } from '@/utils/api-config';

type User = {
  /**
   * The account's id as the API knows it. Needed to recognise "this is my own
   * listing" — a check that is otherwise impossible on the client, and the
   * reason report and favourite controls can be disabled with an explanation
   * rather than rejected after the fact.
   */
  id?: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  token: string;
  roles: string[];
  /**
   * Set when the person chose "Service Provider" at sign-up. Intent only — it
   * stays true forever and says nothing about whether they finished. Use
   * `isProvider` to ask "do they have a real listing?".
   */
  agentIntent?: boolean;
  avatar?: string;
  trustScore?: number;
  badges?: string[];
  createdAt?: string;
  // Business profile visibility: 'public' or 'private'
  // When private, the business profile is hidden from other users
  businessProfileVisibility?: 'public' | 'private';
};

export type PosDetails = {
  feePer5000: number;
  feePer10000?: number;
  maxCashLimit?: number;
  acceptedCardBrands: ('visa' | 'mastercard' | 'verve')[];
};

export type FoodDetails = {
  menuItems: { name: string; price: number }[];
  whatsappOrderingEnabled: boolean;
  homeDeliveryEnabled?: boolean;
  deliveryCharge?: number;
};

export type GasDetails = {
  pricePerKg: number;
  pricePerCylinder?: number;
  homeDeliveryEnabled: boolean;
  deliveryCharge?: number;
};

export type HouseDetails = {
  propertyTypes: string[];
  rentRangeMin?: number;
  rentRangeMax?: number;
  coveredAreas: string[];
};

export type AgentDetails = PosDetails | FoodDetails | GasDetails | HouseDetails;

/**
 * A photo the provider attached to their listing during onboarding.
 * `uri` is local until the listing is submitted; `url` is only set afterwards,
 * when the photo has been uploaded and the API has handed back a public path.
 */
export type ProviderPhoto = {
  id: string;
  uri: string;
  caption: string;
  url?: string;
};

export type AgentDraft = {
  category?: Category;
  businessName?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  localGovernment?: string;
  area?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  source?: 'gps' | 'manual';
  serviceDetails?: AgentDetails;
  photos?: ProviderPhoto[];
};

export type LocationMode = 'automatic' | 'manual';

export type GPSLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
};

export type ResolvedAddress = {
  streetName?: string;
  community?: string;
  locality?: string;
  administrativeArea?: string;
  country?: string;
  formattedAddress?: string;
  components?: Record<string, string>;
};

export type ServiceArea = {
  name: string;
  source: 'gps' | 'manual';
  confidence?: 'high' | 'medium' | 'low';
};

export type CustomerLocation = {
  gps: GPSLocation | null;
  address: ResolvedAddress | null;
  serviceArea: ServiceArea | null;
  label: string;
  mode: LocationMode;
};

type AppState = {
  selectedArea: string;
  customerLocation: CustomerLocation | null;
  splashVisible: boolean;
  hasSeenOnboarding: boolean;
  colorScheme: 'light' | 'dark' | 'system';
  user: User | null;
  token: string | null;
  pendingReportId: string | null;
  agentDraft: AgentDraft;
  isHydrating: boolean;
  isSessionReady: boolean;
  favorites: string[];
  setSelectedArea: (area: string) => void;
  setCustomerLocation: (location: CustomerLocation | null) => void;
  setServiceArea: (serviceArea: ServiceArea | null) => void;
  setSplashVisible: (visible: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  signIn: (user: User) => void;
  signOut: () => void;
  beginReport: (listingId: string) => void;
  clearPendingReport: () => void;
  updateAgentDraft: (draft: Partial<AgentDraft>) => void;
  resetAgentDraft: () => void;
  updateUser: (updates: Partial<User>) => void;
  toggleFavorite: (listingId: string) => void;
  /** Pulls the account's saved listings and reconciles the local cache. */
  syncFavorites: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

const STORAGE_KEYS = {
  USER: '@citypulse:user',
  TOKEN: '@citypulse:token',
  HAS_SEEN_ONBOARDING: '@citypulse:hasSeenOnboarding',
  SELECTED_AREA: '@citypulse:selectedArea',
  CUSTOMER_LOCATION: '@citypulse:customerLocation',
  COLOR_SCHEME: '@citypulse:colorScheme',
  FAVORITES: '@citypulse:favorites',
  AGENT_DRAFT: '@citypulse:agentDraft',
};

export function AppStateProvider({ children }: PropsWithChildren) {
  const [selectedArea, setSelectedAreaState] = useState('Okemason');
  const [customerLocation, setCustomerLocationState] = useState<CustomerLocation | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark' | 'system'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [agentDraft, setAgentDraft] = useState<AgentDraft>({});
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [favorites, setFavoritesState] = useState<string[]>([]);

  // Refs so the favourite sync callbacks can read the current token and list
  // without being re-created on every keystroke of unrelated state, which would
  // otherwise cascade into every screen that consumes this context.
  const tokenRef = useRef<string | null>(null);
  // The account-scoped listing cache is keyed by user id, and the session
  // reconciliation below runs before the render that would otherwise close over
  // the freshly reconciled user.
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const favoritesRef = useRef<string[]>([]);
  // Lets the boot-time hydration effect trigger the sync without closing over a
  // value that is not declared yet.
  const syncFavoritesRef = useRef<() => void>(() => {});

  /**
   * Pulls the authoritative account state and folds it into the cached user.
   *
   * This is a *reconciliation*, not a gate. The app routes on the cached copy
   * immediately; this call only corrects it. It used to block the initial
   * redirect until it settled, which meant that an unreachable host left a
   * signed-in provider stranded on whatever route the app cold-started on,
   * because React Native's `fetch` has no default timeout and simply hangs.
   */
  const refreshSessionUser = useCallback(async (authToken: string) => {
    try {
      // The phone is sent so the backend's development token bypass resolves to
      // this account rather than guessing from the most recent signup.
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const phone = stored ? (JSON.parse(stored) as User)?.phone : undefined;
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';

      // Short budget on purpose: this must never hold up the app, and a stale
      // account is corrected on the next launch or focus anyway.
      const payload = await apiRequest<{ data?: { user?: Record<string, unknown> } }>(
        `/auth/me${query}`,
        { token: authToken, timeoutMs: 6000 },
      );
      if (!payload) return;

      const fresh = payload?.data?.user;
      if (!fresh) return;

      setUser((current) => {
        if (!current) return current;

        // `fresh` is untrusted server JSON, so every field is narrowed before it
        // is allowed near the typed account. Anything unexpected falls back to
        // the cached value rather than overwriting a good copy with a bad one.
        const text = (value: unknown): string | undefined =>
          typeof value === 'string' && value.length > 0 ? value : undefined;

        const roles = Array.isArray(fresh.roles)
          ? fresh.roles.filter((role): role is string => typeof role === 'string')
          : current.roles;

        // Guard against a backend that omits the "agent" role from /auth/me.
        // If the cached account was a provider but the server drops the role,
        // a stale listing belonging to this account is evidence the promotion
        // is legitimate — keep the role so the dashboard is reachable. This is
        // account-scoped via belongsTo, so it can never promote the wrong user.
        if (current.roles?.includes('agent') && !roles.includes('agent')) {
          const cachedListing = getCachedListingSync(current.id);
          if (cachedListing) {
            roles.push('agent');
          }
        }

        const agentIntent = typeof fresh.agentIntent === 'boolean' ? fresh.agentIntent : current.agentIntent;
        const name = text(fresh.name) ?? current.name;
        const email = text(fresh.email) ?? current.email;
        const phone = text(fresh.phone) ?? current.phone;
        const avatar = Object.prototype.hasOwnProperty.call(fresh, 'avatar')
          ? (text(fresh.avatar) ? resolveApiAssetUrl(text(fresh.avatar)!) : undefined)
          : current.avatar;
        const id = text(fresh._id) ?? text(fresh.id) ?? current.id;
        const verified = typeof fresh.isVerified === 'boolean' ? fresh.isVerified : current.verified;
        const trustScore = typeof fresh.trustScore === 'number' ? fresh.trustScore : current.trustScore;
        const badges = Array.isArray(fresh.badges)
          ? (fresh.badges as User['badges'])
          : current.badges;
        const businessProfileVisibility = (fresh.businessProfileVisibility === 'public' || fresh.businessProfileVisibility === 'private')
          ? fresh.businessProfileVisibility
          : current.businessProfileVisibility;

      const changed =
        roles !== current.roles ||
        agentIntent !== current.agentIntent ||
        name !== current.name ||
        email !== current.email ||
        phone !== current.phone ||
        avatar !== current.avatar ||
        verified !== current.verified ||
        id !== current.id ||
        trustScore !== current.trustScore ||
        JSON.stringify(badges) !== JSON.stringify(current.badges) ||
        businessProfileVisibility !== current.businessProfileVisibility;

      if (!changed) return current;

      const updated: User = { ...current, name, email, phone, avatar, verified, roles, agentIntent, id, trustScore, badges, businessProfileVisibility };
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch (err) {
      // Only a transport failure means "the server never answered". A rejection
      // (401 for a token the API will not accept, 404 for an account that is no
      // longer there) is the server telling us this session is not real, and
      // inferring a provider role from a cached listing in that case is what
      // sent one account to another account's dashboard.
      if (!isOfflineError(err)) {
        return;
      }

      // Offline or server down: keep using the cached account. If the listing
      // cache has a saved listing for this account, the user has already
      // published and is a provider — promote the agent role locally so the
      // root redirect routes them to the dashboard instead of onboarding.
      const cachedListing = getCachedListingSync(userRef.current?.id);
      if (cachedListing) {
        setUser((current) => {
          if (!current || current.roles?.includes('agent')) return current;
          const updated: User = { ...current, roles: [...(current.roles ?? []), 'agent'] };
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } finally {
      setIsSessionReady(true);
    }
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storageReads = Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_AREA),
          AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_LOCATION),
          AsyncStorage.getItem(STORAGE_KEYS.COLOR_SCHEME),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.AGENT_DRAFT),
        ]);
        let timeout: ReturnType<typeof setTimeout>;
        const storedValues = await Promise.race([
          storageReads,
          new Promise<never>((_, reject) => {
            timeout = setTimeout(
              () => reject(new Error('Loading saved app data timed out')),
              10_000,
            );
          }),
        ]).finally(() => clearTimeout(timeout));
        const [
          storedUser,
          storedToken,
          storedOnboarding,
          storedArea,
          storedLocation,
          storedColorScheme,
          storedFavorites,
          storedDraft,
        ] = storedValues;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          userRef.current = parsedUser;
          setUser(parsedUser);
        }
        if (storedToken) {
          tokenRef.current = storedToken;
          setToken(storedToken);
        }
        if (storedOnboarding === 'true') {
          setHasSeenOnboardingState(true);
        }
        if (storedArea) {
          setSelectedAreaState(storedArea);
        }
        if (storedLocation) {
          try {
            const parsedLocation = JSON.parse(storedLocation) as CustomerLocation | {
              latitude: number;
              longitude: number;
              label: string;
              mode: LocationMode;
              accuracy?: number;
              addressComponents?: Record<string, string>;
            };
            // Support both old format (flat) and new format (structured)
            if ('gps' in parsedLocation) {
              // New format
              if (
                parsedLocation.gps &&
                Number.isFinite(parsedLocation.gps.latitude) &&
                Number.isFinite(parsedLocation.gps.longitude) &&
                parsedLocation.label &&
                (parsedLocation.mode === 'automatic' || parsedLocation.mode === 'manual')
              ) {
                setCustomerLocationState(parsedLocation);
              }
            } else {
              // Old format - migrate
              if (
                Number.isFinite(parsedLocation.latitude) &&
                Number.isFinite(parsedLocation.longitude) &&
                parsedLocation.label &&
                (parsedLocation.mode === 'automatic' || parsedLocation.mode === 'manual')
              ) {
                setCustomerLocationState({
                  gps: {
                    latitude: parsedLocation.latitude,
                    longitude: parsedLocation.longitude,
                    accuracy: parsedLocation.accuracy,
                    timestamp: Date.now(),
                  },
                  address: parsedLocation.addressComponents
                    ? {
                        components: parsedLocation.addressComponents,
                      }
                    : null,
                  serviceArea: {
                    name: parsedLocation.label,
                    source: parsedLocation.mode === 'automatic' ? 'gps' : 'manual',
                    confidence: 'medium',
                  },
                  label: parsedLocation.label,
                  mode: parsedLocation.mode,
                });
              }
            }
          } catch (error) {
            console.warn('[AppState] Failed to parse saved location:', error);
          }
        }
        if (storedColorScheme === 'light' || storedColorScheme === 'dark') {
          setColorSchemeState(storedColorScheme);
        }
        if (storedFavorites) {
          try {
            const parsedFavorites = JSON.parse(storedFavorites);
            if (Array.isArray(parsedFavorites)) {
              const restored = parsedFavorites.filter(
                (item): item is string => typeof item === 'string',
              );
              favoritesRef.current = restored;
              setFavoritesState(restored);
            }
          } catch (error) {
            console.warn('[AppState] Failed to parse saved favorites:', error);
          }
        }
        if (storedDraft) {
          try {
            // Restoring the draft is what lets a reload put the user back on the
            // step they left instead of silently restarting at step one.
            setAgentDraft(sanitizePersistedDraft(JSON.parse(storedDraft)));
          } catch (error) {
            console.warn('[AppState] Failed to parse saved agent draft:', error);
          }
        }

        // Reconcile the cached account with the server once, on launch. The
        // cached copy can lag behind reality (a listing published just before the
        // app was killed, a role granted on another device), and that lag is
        // what would otherwise strand a real provider in the onboarding flow.
        if (storedUser && storedToken) {
          void refreshSessionUser(storedToken);
          // Reconcile saved listings with the account. Anything picked on this
          // device before it was signed in is merged up rather than discarded.
          //
          // Deferred to a microtask so this runs after the provider body has
          // finished defining syncFavorites, which is declared further down.
          queueMicrotask(() => {
            void syncFavoritesRef.current();
          });
        } else {
          // No cached session — nothing to reconcile, routing can proceed.
          setIsSessionReady(true);
        }
      } catch (error) {
        console.warn('[AppState] Failed to hydrate from storage:', error);
        // On any hydration failure, proceed with whatever cached state exists
        // rather than leaving the redirect guard hanging forever.
        setIsSessionReady(true);
      } finally {
        setIsHydrating(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Start the offline request queue listener so queued writes are retried on reconnect.
  useEffect(() => {
    const cleanup = startOfflineQueueListener();
    return cleanup;
  }, []);

  const setSelectedArea = (area: string) => {
    setSelectedAreaState(area);
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_AREA, area).catch(() => {});
  };

  const setCustomerLocation = (location: CustomerLocation | null) => {
    setCustomerLocationState(location);
    if (location) {
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_LOCATION, JSON.stringify(location)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMER_LOCATION).catch(() => {});
    }
  };

  const setServiceArea = (serviceArea: ServiceArea | null) => {
    setCustomerLocationState((current) => {
      if (!current) return current;
      const updated = { ...current, serviceArea };
      AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_LOCATION, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const setHasSeenOnboarding = (seen: boolean) => {
    setHasSeenOnboardingState(seen);
    AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, String(seen)).catch(() => {});
  };

  const setColorScheme = (scheme: 'light' | 'dark' | 'system') => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, scheme).catch(() => {});
  };

  const persistFavorites = useCallback((next: string[]) => {
    favoritesRef.current = next;
    setFavoritesState(next);
    AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next)).catch(() => {});
  }, []);

  /**
   * Saved listings are account-scoped, so a toggle writes locally first (the
   * heart must respond instantly) and then reconciles with the server.
   *
   * On a failure the optimistic value is rolled back, because a heart that says
   * "saved" when it is not — or the reverse — is worse than a brief delay. The
   * API is the source of truth; the local array is a cache.
   */
  const toggleFavorite = useCallback(
    async (listingId: string) => {
      let previous: string[] = [];
      let optimistic: string[] = [];

      setFavoritesState((current) => {
        previous = current;
        optimistic = current.includes(listingId)
          ? current.filter((item) => item !== listingId)
          : [...current, listingId];
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(optimistic)).catch(() => {});
        return optimistic;
      });

      const authToken = tokenRef.current;
      // No account means there is nowhere to save it to. The local list is kept
      // so a signed-out visitor does not lose their picks on the way to sign-up,
      // and they are merged up on first sign-in.
      if (!authToken) return;

      try {
        const wasRemoving = !optimistic.includes(listingId);
        const serverIds = wasRemoving
          ? await removeFavoriteRemote(listingId, authToken)
          : await addFavoriteRemote(listingId, authToken);
        persistFavorites(serverIds);
      } catch {
        persistFavorites(previous);
      }
    },
    [persistFavorites],
  );

  /**
   * Pulls the account's saved listings and reconciles the local cache.
   *
   * Local-only favourites (picked while signed out, or before this shipped) are
   * merged into the server list rather than discarded, so upgrading the app does
   * not silently delete someone's saved providers.
   */
  const syncFavorites = useCallback(async () => {
    const authToken = tokenRef.current;
    if (!authToken) return;
    try {
      const serverIds = await fetchFavoriteIds(authToken);
      const localOnly = favoritesRef.current.filter((id) => !serverIds.includes(id));

      if (localOnly.length === 0) {
        persistFavorites(serverIds);
        return;
      }

      // Push the local-only picks up one at a time; the server ignores ids it
      // already has, so this is safe to run on every sign-in.
      let merged = serverIds;
      for (const id of localOnly) {
        try {
          merged = await addFavoriteRemote(id, authToken);
        } catch {
          // A single rejected id (unpublished listing) should not stop the rest
          // from being saved.
        }
      }
      persistFavorites(merged);
    } catch {
      // Offline: keep whatever the cache holds.
    }
  }, [persistFavorites]);

  // Published to the ref so the boot-time hydration effect can reach it. Done in
  // an effect rather than during render, because writing a ref while rendering
  // is unsafe under concurrent rendering.
  useEffect(() => {
    syncFavoritesRef.current = syncFavorites;
  }, [syncFavorites]);

  const signIn = async (newUser: User) => {
    const userJson = JSON.stringify(newUser);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, userJson),
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newUser.token),
    ]);
    tokenRef.current = newUser.token;
    userRef.current = newUser;
    setUser(newUser);
    setToken(newUser.token);
    // Do not force hasSeenOnboarding here — it is hydrated from storage on
    // mount and should only be set true when the user actually completes
    // onboarding (via setHasSeenOnboarding).
    void syncFavorites();
  };

  const signOut = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
    ]);
    tokenRef.current = null;
    userRef.current = null;
    setUser(null);
    setToken(null);
    // The cache is cleared on sign-out because it now holds another account's
    // saved listings. Anything the person had picked while signed out lives on
    // the server only if they were signed in, so it is re-merged on next
    // sign-in.
    persistFavorites([]);
    void clearCachedListing();
    // Clear the agent onboarding draft so the next account on this device does
    // not inherit the previous user's in-progress registration.
    resetAgentDraftState();
    // Alerts are account-scoped too, and a report notification is sensitive: it
    // tells one provider that a specific person complained about them. Leaving
    // it on disk would show the next person to use this device who that was.
    void clearCachedNotifications();
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const resetAgentDraftState = () => {
    setAgentDraft({});
    AsyncStorage.removeItem(STORAGE_KEYS.AGENT_DRAFT).catch(() => {});
  };

  const updateAgentDraftState = useCallback((draft: Partial<AgentDraft>) => {
    setAgentDraft((current) => {
      const next = { ...current, ...draft };
      // Mirrored to disk on every step so an interrupted registration can be
      // resumed rather than lost.
      AsyncStorage.setItem(STORAGE_KEYS.AGENT_DRAFT, JSON.stringify(toPersistedDraft(next))).catch(() => {});
      return next;
    });
  }, []);

  const clearPendingReport = useCallback(() => setPendingReportId(null), []);

const value = useMemo<AppState>(
    () => ({
      selectedArea,
      customerLocation,
      splashVisible,
      hasSeenOnboarding,
      colorScheme,
      user,
      token,
      pendingReportId,
      agentDraft,
      isHydrating,
      isSessionReady,
      favorites,
      setSelectedArea,
      setCustomerLocation,
      setServiceArea,
      setSplashVisible,
      setHasSeenOnboarding,
      setColorScheme,
      signIn,
      signOut,
      beginReport: setPendingReportId,
        clearPendingReport: clearPendingReport,
      updateAgentDraft: updateAgentDraftState,
      resetAgentDraft: resetAgentDraftState,
      updateUser,
      toggleFavorite,
      syncFavorites,
    }),
    [
      selectedArea,
      customerLocation,
      splashVisible,
      hasSeenOnboarding,
      colorScheme,
      user,
      token,
      pendingReportId,
      agentDraft,
      isHydrating,
      isSessionReady,
      favorites,
      setSelectedArea,
      setCustomerLocation,
      setServiceArea,
      setSplashVisible,
      setHasSeenOnboarding,
      setColorScheme,
      signIn,
      signOut,
        clearPendingReport,
        updateAgentDraftState,
        resetAgentDraftState,
        clearPendingReport,
        toggleFavorite,
      syncFavorites,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
