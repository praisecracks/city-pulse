import { router } from 'expo-router';
import { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Switch, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SignOutConfirmationModal } from '@/components/sign-out-confirmation-modal';
import { useAppState } from '@/state/app-state';
import { BOTTOM_TAB_HEIGHT } from '@/components/bottom-tab-bar';
import { API_BASE_URL } from '@/utils/api-config';

const COLOR_PRIMARY = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_CARD = '#FFFFFF';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_DANGER = '#EF4444';
const COLOR_WARNING = '#F59E0B';
const COLOR_WARNING_BG = '#FFFBEB';

type SettingItemProps = {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  iconColor?: string;
  tint?: 'default' | 'danger' | 'primary';
};

function SettingItem({ icon, label, sublabel, onPress, iconColor = COLOR_TEXT_MAIN, tint = 'default' }: SettingItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconBox, tint === 'primary' && styles.iconBoxPrimary, tint === 'danger' && styles.iconBoxDanger]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View>
          <ThemedText
            style={[
              styles.menuItemText,
              tint === 'primary' && styles.menuItemTextPrimary,
              tint === 'danger' && styles.menuItemTextDanger,
            ]}
          >
            {label}
          </ThemedText>
          {sublabel && <ThemedText style={styles.menuItemSubtext}>{sublabel}</ThemedText>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLOR_TEXT_MUTED} />
    </Pressable>
  );
}

type SettingToggleProps = {
  icon: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  iconColor?: string;
};

function SettingToggle({ icon, label, sublabel, value, onValueChange, iconColor = COLOR_TEXT_MAIN }: SettingToggleProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconBox, styles.iconBoxMuted]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View>
          <ThemedText style={styles.menuItemText}>{label}</ThemedText>
          {sublabel && <ThemedText style={styles.menuItemSubtext}>{sublabel}</ThemedText>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? COLOR_PRIMARY : '#F1F5F9'}
        trackColor={{ false: '#E2E8F0', true: '#E8F6F6' }}
        ios_backgroundColor={COLOR_BORDER}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut, colorScheme, setColorScheme, user, token } = useAppState();
  const [showDarkModeNotice, setShowDarkModeNotice] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSetDarkMode = (enabled: boolean) => {
    if (enabled) {
      setShowDarkModeNotice(true);
    } else {
      setColorScheme('light');
    }
  };

  const confirmDarkMode = () => {
    setColorScheme('dark');
    setShowDarkModeNotice(false);
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    setIsConfirmingSignOut(true);
    try {
      await signOut();
      router.replace('/home-discover');
    } finally {
      setIsConfirmingSignOut(false);
      setShowSignOutConfirm(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !token) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: user.phone ? JSON.stringify({ phone: user.phone }) : undefined,
      });

      const payload = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !payload.success) {
        if (__DEV__) {
          await signOut();
          setShowDeleteConfirm(false);
          router.replace('/home-discover');
          return;
        }
        throw new Error(payload.message || 'Failed to delete account. Please try again.');
      }

      await signOut();
      setShowDeleteConfirm(false);
      router.replace('/home-discover');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('connect')) {
        setDeleteError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setDeleteError(message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) router.back();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={COLOR_TEXT_MAIN} />
          </Pressable>
          <ThemedText style={styles.topBarTitle}>Settings</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>APPEARANCE</ThemedText>
            <SettingToggle
              icon="moon-outline"
              label="Dark Mode"
              sublabel="Override system theme"
              value={colorScheme === 'dark'}
              onValueChange={handleSetDarkMode}
            />
            <SettingItem
              icon="color-palette-outline"
              label="Language"
              sublabel="English (default)"
              onPress={() => {}}
            />
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>NOTIFICATIONS</ThemedText>
            <SettingToggle
              icon="notifications-outline"
              label="Push Notifications"
              value={true}
              onValueChange={() => {}}
            />
            <SettingToggle
              icon="cash-outline"
              label="Price Drop Alerts"
              value={true}
              onValueChange={() => {}}
            />
            <SettingToggle
              icon="megaphone-outline"
              label="Service Provider Updates"
              value={false}
              onValueChange={() => {}}
            />
          </View>

          {/* Saved Locations */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>LOCATION</ThemedText>
            <SettingItem
              icon="location-outline"
              label="Preferred Location"
              onPress={() => router.push('/manual-area' as any)}
            />
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>SUPPORT</ThemedText>
            <SettingItem
              icon="help-buoy-outline"
              label="Help & Community Guidelines"
              onPress={() => router.push('/support' as any)}
            />
            <SettingItem
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => router.push('/privacy-policy' as any)}
            />
            <SettingItem
              icon="document-attach-outline"
              label="Terms of Service"
              onPress={() => router.push('/terms' as any)}
            />
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ABOUT</ThemedText>
            <View style={styles.aboutRow}>
              <ThemedText style={styles.menuItemText}>App Version</ThemedText>
              <ThemedText style={styles.versionText}>1.0.0</ThemedText>
            </View>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, styles.iconBoxDanger]}>
                <Ionicons name="log-out-outline" size={18} color={COLOR_DANGER} />
              </View>
              <ThemedText style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Sign Out of Device
              </ThemedText>
            </View>
          </Pressable>
          </View>

          {/* Delete Account */}
          <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDeleteConfirm(true)}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, styles.iconBoxDanger]}>
                <Ionicons name="trash-outline" size={18} color={COLOR_DANGER} />
              </View>
              <ThemedText style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Delete Account
              </ThemedText>
            </View>
          </Pressable>
          </View>
        </ScrollView>

        {/* Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContentWide, { gap: 16, alignItems: 'stretch' }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning-outline" size={24} color={COLOR_DANGER} />
                <ThemedText style={styles.modalTitle}>Delete Account</ThemedText>
              </View>
              <ThemedText style={styles.modalText}>
                This will permanently delete your account and all associated data. This action cannot be undone.
              </ThemedText>
              {deleteError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLOR_DANGER} />
                  <ThemedText style={styles.errorBannerText}>{deleteError}</ThemedText>
                </View>
              )}
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, pressed && styles.pressed]}
                  onPress={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={isDeleting}
                >
                  <ThemedText style={styles.modalBtnSecondaryText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed, { backgroundColor: COLOR_DANGER }]}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.modalBtnPrimaryText}>Delete</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Dark Mode Coming Soon Notice */}
        <Modal
          visible={showDarkModeNotice}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDarkModeNotice(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentWide}>
              <View style={styles.modalHeader}>
                <Ionicons name="moon-outline" size={24} color={COLOR_WARNING} />
                <ThemedText style={styles.modalTitle}>Dark Mode Preview</ThemedText>
              </View>
              <ThemedText style={styles.modalText}>
                Dark mode is under active development. Some screens may not render correctly.
              </ThemedText>
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, pressed && styles.pressed]}
                  onPress={() => setShowDarkModeNotice(false)}
                >
                  <ThemedText style={styles.modalBtnSecondaryText}>Not Now</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed]}
                  onPress={confirmDarkMode}
                >
                  <ThemedText style={styles.modalBtnPrimaryText}>Try It</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
       </Modal>

       <SignOutConfirmationModal
         visible={showSignOutConfirm}
         onCancel={() => setShowSignOutConfirm(false)}
         onConfirm={confirmSignOut}
         isConfirming={isConfirmingSignOut}
       />

       </SafeAreaView>
     </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOR_BG,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLOR_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_TAB_HEIGHT,
    gap: 16,
  },
  section: {
    backgroundColor: COLOR_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLOR_TEXT_MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
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
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxPrimary: {
    backgroundColor: '#E8F6F6',
  },
  iconBoxDanger: {
    backgroundColor: '#FEE2E2',
  },
  iconBoxMuted: {
    backgroundColor: '#F8FAFC',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_TEXT_MAIN,
  },
  menuItemTextPrimary: {
    color: COLOR_PRIMARY,
    fontWeight: '700',
  },
  menuItemTextDanger: {
    color: COLOR_DANGER,
  },
  menuItemSubtext: {
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_TEXT_MUTED,
  },
  pressed: {
    opacity: 0.8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLOR_DANGER,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWide: {
    backgroundColor: COLOR_CARD,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 16,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLOR_TEXT_MAIN,
  },
  modalText: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: COLOR_BG,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
  },
  modalBtnPrimary: {
    backgroundColor: COLOR_PRIMARY,
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR_TEXT_MAIN,
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
