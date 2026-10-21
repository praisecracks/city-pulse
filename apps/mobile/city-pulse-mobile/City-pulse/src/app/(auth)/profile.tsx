import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, Modal, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListingPhoto } from '@/components/listing-photo';
import { SignOutConfirmationModal } from '@/components/sign-out-confirmation-modal';
import { useAppState } from '@/state/app-state';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { PickSource, pickImage, processAvatarImage, showImageSourceSheet } from '@/utils/image-upload';
import { getAgentResumePath } from '@/utils/agent-onboarding';
import { Category } from '@/data/product';
import { fetchMyListing } from '@/utils/listing-sync';
import { type Listing } from '@/data/product';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest, describeError } from '@/utils/api-client';
import { MOCK_API, resolveApiAssetUrl } from '@/utils/api-config';
import { uploadListingPhotos } from '@/utils/listing-photos';

// Brand-specific colors that have no theme token equivalent
const COLOR_WHITE = '#FFFFFF';
const COLOR_WHATSAPP = '#25D366';
const COLOR_HOUSE = '#8B5CF6';

// Category metadata for display
const CATEGORY_DISPLAY: Record<Category, { label: string; icon: string }> = {
  pos: { label: 'POS Cash Point', icon: 'card-outline' },
  gas: { label: 'Cooking Gas', icon: 'flame-outline' },
  food: { label: 'Food Spot / Bukka', icon: 'restaurant-outline' },
  house: { label: 'House Agent', icon: 'home-outline' },
};

type Theme = ReturnType<typeof useTheme>;

const getCategoryColor = (category: Category, theme: Theme): string => {
  const map: Record<Category, string> = {
    pos: theme.accent,
    gas: theme.warningText,
    food: theme.dangerText,
    house: COLOR_HOUSE,
  };
  return map[category];
};

export default function ProfileScreen() {
  const { user, signOut, resetAgentDraft, updateUser, agentDraft, token } = useAppState();
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [myListing, setMyListing] = useState<Listing | null>(null);

  // Fetch the user's published listing from the API. The onboarding draft is
  // intentionally NOT used here — it is cleared after submission and its photos
  // are device-local cache URIs.
  const loadMyListing = useCallback(async () => {
    if (!token) {
      setMyListing(null);
      return;
    }
    try {
      const listing = await fetchMyListing(token);
      setMyListing(listing);
      if (typeof listing?.providerVerified === 'boolean' && listing.providerVerified !== user?.verified) {
        updateUser({ verified: listing.providerVerified });
      }
    } catch {
      setMyListing(null);
    }
  }, [token, updateUser, user]);

  useFocusEffect(
    useCallback(() => {
      void loadMyListing();
    }, [loadMyListing])
  );

  // Local state for editing and profile picture zoom modal
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; caption?: string } | null>(null);
  const [isBusinessProfileExpanded, setIsBusinessProfileExpanded] = useState(false);

  // Sync form fields when the user record changes (e.g. after a profile update)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) {
      router.replace('/auth-required');
    } else {
      setNameInput(user.name || '');
      setPhoneInput(user.phone || '');
      setAvatarInput(user.avatar || '');
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user) {
    return null;
  }

  const displayName = user.name || 'Neighbor';
  const displayPhone = user.phone || 'Not set';
  const displayAvatar = user.avatar ? resolveApiAssetUrl(user.avatar) : undefined;

  const isAgent = user.roles?.includes('agent');
  const listing = myListing ?? null;

  // Business display data derived from the live listing (not the onboarding draft)
  const agentCategory = listing?.category as Category | undefined;
  const agentIcon = (agentCategory ? CATEGORY_DISPLAY[agentCategory].icon : 'briefcase-outline') as any;
  const agentIconColor = agentCategory ? getCategoryColor(agentCategory, theme) : theme.accent;
  const agentLabel = agentCategory ? CATEGORY_DISPLAY[agentCategory].label : 'Service Provider';

  const confirmSignOut = async () => {
    setIsConfirmingSignOut(true);
    try {
      await signOut();
      resetAgentDraft();
      router.replace('/home-discover');
    } catch (error) {
      Alert.alert(
        'Unable to sign out',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsConfirmingSignOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const handleBecomeAgent = () => {
    if (isAgent) {
      router.push('/agent-dashboard');
      return;
    }

    // Already applied once and partway through: send them back to where they
    // stopped rather than making them create a second account.
    if (user?.agentIntent) {
      router.push((getAgentResumePath(agentDraft) || '/agent-registration-1') as never);
      return;
    }

    router.push('/auth-required?intent=agent');
  };

  const handleAvatarPick = async (source: PickSource) => {
    const asset = await pickImage(source);
    if (!asset) return;

    setIsAvatarLoading(true);
    try {
      const processed = await processAvatarImage(asset.uri);
      setAvatarInput(processed.uri);
    } catch (error: any) {
      Alert.alert('Image Error', error.message);
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarInput('');
  };

  const handleAvatarPress = () => {
    showImageSourceSheet(
      !!displayAvatar,
      handleAvatarPick,
      displayAvatar ? handleAvatarRemove : undefined,
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const name = nameInput.trim() || user.name;
      const phone = phoneInput.trim() || user.phone;
      const avatarChanged = avatarInput !== (user.avatar || '');

      if (MOCK_API) {
        updateUser({ name, phone, avatar: avatarInput || undefined });
      } else {
        if (!token) throw new Error('Your session has expired. Sign in again to save your profile.');

        let avatar: string | null | undefined;
        if (avatarChanged) {
          if (!avatarInput) {
            avatar = null;
          } else {
            const [uploaded] = await uploadListingPhotos(
              [{ id: 'profile-avatar', uri: avatarInput, caption: '' }],
              token,
            );
            if (!uploaded) throw new Error('Your profile photo could not be uploaded. Please try again.');
            avatar = uploaded.path;
          }
        }

        const payload = await apiRequest<{
          data?: { user?: { name?: string; phone?: string; avatar?: string } };
        }>('/auth/me', {
          method: 'PATCH',
          token,
          body: {
            name,
            phone,
            ...(avatarChanged ? { avatar } : {}),
          },
        });
        const savedUser = payload.data?.user;
        if (!savedUser) throw new Error('Your profile was not saved. Please try again.');

        updateUser({
          name: savedUser.name || name,
          phone: savedUser.phone || phone,
          avatar: savedUser.avatar ? resolveApiAssetUrl(savedUser.avatar) : undefined,
        });
      }
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        'Unable to save profile',
        error instanceof Error && error.name !== 'TypeError'
          ? error.message
          : describeError(error, 'Please check your connection and try again.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBusinessProfileExpanded = () => {
    setIsBusinessProfileExpanded((prev) => !prev);
  };

  const roleRowWithBorder = {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 8,
    paddingTop: 12,
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* Sleek Top Bar with Title Beside Arrow */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (router.canGoBack()) router.back();
              }}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textBody} />
            </Pressable>
            <ThemedText style={styles.topBarTitle}>Account & Profile</ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsEditing(true)}
            style={({ pressed }) => [styles.editActionBtn, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={18} color={theme.accent} />
            <ThemedText style={styles.editActionText}>Edit Profile</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Minimalist Profile Header with Tappable Avatar for Upload */}
          <View style={styles.profileHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View profile picture"
              onPress={() => setIsAvatarZoomed(true)}
              style={({ pressed }) => [styles.avatarContainer, pressed && styles.pressed]}
            >
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={40} color={theme.accent} />
                </View>
              )}
              <View style={styles.avatarOnlineDot} />
            </Pressable>

            <View style={styles.profileInfoTextContainer}>
              <ThemedText style={styles.userName}>{displayName}</ThemedText>
              <ThemedText style={styles.userPhone}>{displayPhone}</ThemedText>
            </View>

            <View style={[styles.verifiedBadge, !user.verified && styles.pendingVerificationBadge]}>
              <Ionicons
                name={user.verified ? 'shield-checkmark' : 'time-outline'}
                size={15}
                color={user.verified ? theme.accent : theme.textSecondary}
              />
              <ThemedText style={[styles.verifiedText, !user.verified && styles.pendingVerificationText]}>
                {user.verified ? 'Verified Neighbor' : 'Awaiting admin verification'}
              </ThemedText>
            </View>
          </View>

          {/* Active Platform Roles Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ACTIVE PLATFORM ROLES</ThemedText>
            <View style={styles.roleCardInner}>
              <View style={styles.roleRow}>
                <View style={styles.roleIconBox}>
                  <Ionicons name="person-outline" size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.roleLabel}>Customer Account</ThemedText>
                  <ThemedText style={styles.roleSubtext}>Browsing area pulse, POS cash, and services</ThemedText>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
              </View>

              {isAgent && (
                <View style={[styles.roleRow, roleRowWithBorder]}>
                  <View style={styles.roleIconBox}>
                    <Ionicons name="briefcase-outline" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.roleLabel}>Service Provider / Agent</ThemedText>
                    <ThemedText style={styles.roleSubtext}>
                      {listing?.reviewStatus === 'pending_review'
                        ? 'Listing awaiting admin review'
                        : listing?.reviewStatus === 'rejected'
                          ? 'Listing requires admin follow-up'
                          : 'Active listing on neighborhood network'}
                    </ThemedText>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                </View>
              )}
            </View>
          </View>

          {/* Agent Business Details Section - only when a listing exists */}
          {isAgent && listing && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <ThemedText style={styles.sectionTitle}>BUSINESS PROFILE</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isBusinessProfileExpanded ? 'Collapse business profile' : 'Expand business profile'}
                  onPress={handleToggleBusinessProfileExpanded}
                  style={({ pressed }) => [styles.sectionTitleToggle, pressed && styles.pressed]}
                >
                <Ionicons
                  name={isBusinessProfileExpanded ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={theme.textSecondary}
                />
                </Pressable>
              </View>
              {isBusinessProfileExpanded && (
                <View style={styles.businessCard}>
                  <View style={styles.businessHeader}>
                    <View style={styles.businessIconBox}>
                      <Ionicons
                        name={agentIcon}
                        size={22}
                        color={agentIconColor}
                      />
                    </View>
                    <View style={styles.businessInfo}>
                      <ThemedText style={styles.businessCategory}>
                        {agentLabel}
                      </ThemedText>
                      {listing.name && (
                        <ThemedText style={styles.businessName}>{listing.name}</ThemedText>
                      )}
                    </View>
                  </View>

                {listing.phone && (
                  <View style={styles.businessDetailRow}>
                    <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.businessDetailText}>{listing.phone}</ThemedText>
                  </View>
                )}
                {listing.email && (
                  <View style={styles.businessDetailRow}>
                    <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.businessDetailText}>{listing.email}</ThemedText>
                  </View>
                )}
                {listing.whatsapp && (
                  <View style={styles.businessDetailRow}>
                    <Ionicons name="chatbox-outline" size={16} color={COLOR_WHATSAPP} />
                    <ThemedText style={styles.businessDetailText}>{listing.whatsapp}</ThemedText>
                  </View>
                )}
                {listing.area && (
                  <View style={styles.businessDetailRow}>
                    <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.businessDetailText} numberOfLines={1}>{listing.area}</ThemedText>
                  </View>
                )}
                {listing.address && (
                  <View style={styles.businessDetailRow}>
                    <Ionicons name="map-outline" size={16} color={theme.textSecondary} />
                    <ThemedText style={styles.businessDetailText} numberOfLines={1}>{listing.address}</ThemedText>
                  </View>
                )}

                {/* Trust Score */}
                <View style={[styles.businessDetailRow, { marginTop: 4 }]}>
                  <Ionicons name="star" size={16} color={theme.trustText} />
                  <ThemedText style={styles.businessDetailText}>
                    {listing.trust.toFixed(1)} Trust Score
                  </ThemedText>
                </View>

                {/* Service Details (price line from the listing) */}
                {listing.price && (
                  <View style={styles.serviceDetailsContainer}>
                    <ThemedText style={styles.serviceDetailsTitle}>Service Details</ThemedText>
                    <View style={styles.serviceDetailRow}>
                      <ThemedText style={styles.serviceDetailLabel}>Rate</ThemedText>
                      <ThemedText style={styles.serviceDetailValue}>{listing.price}</ThemedText>
                    </View>
                  </View>
                )}

                {/* Listing Photos Gallery */}
                {listing.photos && listing.photos.length > 0 && (
                  <View style={[styles.serviceDetailsContainer, { marginTop: 12, borderTopWidth: 0, paddingTop: 0 }]}>
                    <ThemedText style={styles.serviceDetailsTitle}>
                      Listing Photos ({listing.photos.length})
                    </ThemedText>
                    <View style={styles.photoGrid}>
                      {listing.photos.map((photo, index) => (
                        <Pressable
                          key={index}
                          accessibilityRole="imagebutton"
                          accessibilityLabel={
                            photo.caption || `Listing photo ${index + 1} of ${listing.photos?.length}`
                          }
                          onPress={() => {
                            setPreviewPhoto({ uri: photo.url, caption: photo.caption });
                          }}
                          style={({ pressed }) => [pressed && styles.pressed]}
                        >
                          <ListingPhoto uri={photo.url} style={styles.profilePhotoThumb} />
                        </Pressable>
                      ))}
                    </View>
                    <ThemedText style={styles.photoGridHint}>
                      Tap a photo to view it full screen.
                    </ThemedText>
</View>
                )}
              </View>
            )}
          </View>
        )}

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              onPress={handleBecomeAgent}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.roleIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={isAgent ? 'grid-outline' : 'rocket-outline'} size={20} color={theme.accent} />
                </View>
                <View>
                  <ThemedText style={styles.menuItemText}>
                    {isAgent ? 'Open Agent Dashboard' : 'Become a Service Provider'}
                  </ThemedText>
                  <ThemedText style={styles.menuItemSubtext}>
                    {isAgent ? 'Manage live inventory, cash reserves & requests' : 'List your POS, gas supplies, or shop for neighbors'}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Preferences & Settings Directory Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>PREFERENCES & SETTINGS</ThemedText>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/settings' as any)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.roleIconBox}>
                  <Ionicons name="settings-outline" size={18} color={theme.textBody} />
                </View>
                <View>
                  <ThemedText style={styles.menuItemText}>App Settings Directory</ThemedText>
                  <ThemedText style={styles.menuItemSubtext}>System config, saved areas & guidelines</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/manual-area' as any)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.roleIconBox}>
                  <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
                </View>
                <ThemedText style={styles.menuItemStandardText}>Preferred Location</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/support' as any)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.roleIconBox}>
                  <Ionicons name="help-buoy-outline" size={18} color={theme.textSecondary} />
                </View>
                <ThemedText style={styles.menuItemStandardText}>Help & Community Guidelines</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Account Logout Section */}
          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out of this device"
              hitSlop={6}
              onPress={() => setShowSignOutConfirm(true)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.roleIconBox, { backgroundColor: theme.dangerBg }]}>
                  <Ionicons name="log-out-outline" size={18} color={theme.dangerText} />
                </View>
                <ThemedText style={[styles.menuItemStandardText, styles.signOutText]}>Sign Out of Device</ThemedText>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Social Media Style Fullscreen Avatar Inspection Viewer Modal */}
      <Modal
        visible={isAvatarZoomed}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAvatarZoomed(false)}
      >
        <Pressable style={styles.avatarZoomOverlay} onPress={() => setIsAvatarZoomed(false)}>
          <View style={styles.avatarZoomContainer}>
            <View style={styles.zoomHeaderBar}>
              <ThemedText style={styles.zoomHeaderTitle}>{displayName + "'s Profile Picture"}</ThemedText>
              <Pressable onPress={() => setIsAvatarZoomed(false)} style={styles.zoomCloseBtn}>
                <Ionicons name="close" size={20} color={COLOR_WHITE} />
              </Pressable>
            </View>

            <View style={styles.zoomImageWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.zoomedImageContent} contentFit="contain" />
              ) : (
                <View style={styles.zoomedAvatarPlaceholder}>
                  <Ionicons name="person" size={80} color={theme.accent} />
                </View>
              )}
            </View>

            <ThemedText style={styles.zoomFooterHint}>Tap anywhere or close to return</ThemedText>
          </View>
        </Pressable>
      </Modal>

      {/* Advanced Full-Featured Edit Profile Modal Sheet */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>Edit Profile & Account</ThemedText>
                <ThemedText style={styles.modalSubtitle}>Update your personal profile details and picture</ThemedText>
              </View>
              <Pressable onPress={() => setIsEditing(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textBody} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              <View style={styles.modalAvatarSection}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleAvatarPress}
                  style={({ pressed }) => [styles.modalAvatarPreviewBox, pressed && styles.pressed]}
                >
                  {avatarInput ? (
                    <Image source={{ uri: resolveApiAssetUrl(avatarInput) }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Ionicons name="person" size={36} color={theme.accent} />
                    </View>
                  )}
                  <View style={styles.modalCameraIconBadge}>
                    <Ionicons name="camera" size={14} color={COLOR_WHITE} />
                  </View>
                </Pressable>

                {isAvatarLoading && (
                  <View style={styles.avatarLoadingRow}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <ThemedText style={styles.avatarLoadingText}>Processing image...</ThemedText>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [styles.changePhotoBtn, pressed && styles.pressed]}
                  onPress={handleAvatarPress}
                >
                  <Ionicons name="camera-outline" size={16} color={theme.accent} />
                  <ThemedText style={styles.changePhotoBtnText}>Change Profile Picture</ThemedText>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Full Name or Business Display</ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    keyboardType="phone-pad"
                    placeholder="08030000000"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                onPress={() => setIsEditing(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLOR_WHITE} size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Listing photo lightbox */}
      <Modal
        visible={Boolean(previewPhoto)}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo preview"
          style={styles.photoPreviewOverlay}
          onPress={() => setPreviewPhoto(null)}
        >
          <View style={styles.photoPreviewCloseBar}>
            <ThemedText style={styles.zoomHeaderTitle}>
              {previewPhoto?.caption || 'Listing photo'}
            </ThemedText>
            <Pressable onPress={() => setPreviewPhoto(null)} style={styles.zoomCloseBtn}>
              <Ionicons name="close" size={20} color={COLOR_WHITE} />
            </Pressable>
          </View>

          {previewPhoto && (
            <ListingPhoto
              uri={previewPhoto.uri}
              style={styles.photoPreviewFrame}
              contentFit="contain"
              fallbackLabel="This photo could not be loaded"
            />
          )}

          <ThemedText style={styles.zoomFooterHint}>Tap anywhere to close</ThemedText>
        </Pressable>
      </Modal>

      <SignOutConfirmationModal
        visible={showSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={confirmSignOut}
        isConfirming={isConfirmingSignOut}
      />
    </ThemedView>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingBottom: 8,
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textBody,
    },
    editActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    editActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.accent,
    },
    scrollContent: {
      paddingTop: 16,
      paddingBottom: BOTTOM_TAB_HEIGHT,
      gap: 16,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 10,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 2,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: theme.accent,
    },
    avatarOnlineDot: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.successText,
      borderWidth: 2,
      borderColor: theme.background,
    },
    profileInfoTextContainer: {
      alignItems: 'center',
      gap: 2,
    },
    userName: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textBody,
    },
    userPhone: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginTop: 2,
    },
    pendingVerificationBadge: {
      backgroundColor: theme.backgroundElement,
    },
    verifiedText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.accent,
    },
    pendingVerificationText: {
      color: theme.textSecondary,
    },
    section: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    sectionTitleToggle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.backgroundHover,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roleCardInner: {
      gap: 4,
    },
    roleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    roleIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.backgroundHover,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roleLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textBody,
    },
    roleSubtext: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textBody,
    },
    menuItemSubtext: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    menuItemStandardText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textBody,
    },
    signOutText: {
      color: theme.dangerText,
    },
    pressed: {
      opacity: 0.8,
    },
    avatarZoomOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarZoomContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    zoomHeaderBar: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    zoomHeaderTitle: {
      color: COLOR_WHITE,
      fontSize: 15,
      fontWeight: '700',
    },
    zoomCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImageWrapper: {
      width: '100%',
      maxWidth: 360,
      aspectRatio: 1,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    zoomedImageContent: {
      width: '100%',
      height: '100%',
    },
    zoomedAvatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomFooterHint: {
      color: theme.textTertiary,
      fontSize: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundElement,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      maxHeight: '85%',
      paddingBottom: 36,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textBody,
    },
    modalSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.backgroundHover,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScrollBody: {
      gap: 16,
      paddingBottom: 16,
    },
    modalAvatarSection: {
      alignItems: 'center',
      gap: 12,
      marginVertical: 8,
    },
    modalAvatarPreviewBox: {
      position: 'relative',
      padding: 2,
    },
    modalCameraIconBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: theme.accent,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.backgroundElement,
    },
    avatarLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    avatarLoadingText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    changePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.backgroundHover,
    },
    changePhotoBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    textInputWithIcon: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.textBody,
    },
    modalFooterActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.backgroundHover,
      borderRadius: 12,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.textBody,
      fontSize: 14,
      fontWeight: '700',
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 12,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      color: COLOR_WHITE,
      fontSize: 14,
      fontWeight: '700',
    },

    /* Business Profile Styles */
    businessCard: {
      backgroundColor: theme.accentGlow,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    businessHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    businessIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundElement,
      justifyContent: 'center',
      alignItems: 'center',
    },
    businessInfo: {
      flex: 1,
    },
    businessCategory: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    businessName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textBody,
      marginTop: 2,
    },
    businessDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    businessDetailText: {
      fontSize: 14,
      color: theme.textBody,
      flex: 1,
    },
    serviceDetailsContainer: {
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    serviceDetailsTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    serviceDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.backgroundElement,
      borderRadius: 8,
    },
    serviceDetailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    serviceDetailValue: {
      fontSize: 12,
      color: theme.textBody,
      fontWeight: '700',
    },
    photoGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    photoGridHint: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 8,
    },
    profilePhotoThumb: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: theme.backgroundHover,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    photoPreviewOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      justifyContent: 'space-between',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    photoPreviewCloseBar: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    photoPreviewFrame: {
      width: '100%',
      flex: 1,
      borderRadius: 16,
    },
  });
