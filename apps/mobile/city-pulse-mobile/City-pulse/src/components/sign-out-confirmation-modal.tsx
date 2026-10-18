import { Pressable, StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const COLOR_DANGER = '#EF4444';
const COLOR_DANGER_BG = '#FEE2E2';

type SignOutConfirmationModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
};

export function SignOutConfirmationModal({ visible, onCancel, onConfirm, isConfirming = false }: SignOutConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLOR_DANGER_BG }]}>
              <Ionicons name="log-out-outline" size={24} color={COLOR_DANGER} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: theme.textBody }]}>Sign Out of Device</ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.modalText}>
            You will be signed out of this device. You will need to sign in again to access your account.
          </ThemedText>

          <View style={styles.modalButtons}>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, pressed && styles.pressed]}
              onPress={onCancel}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <ThemedText style={[styles.modalBtnSecondaryText, { color: theme.textBody }]}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed]}
              onPress={onConfirm}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              {isConfirming ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.modalBtnPrimaryText}>Sign Out</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  modalBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBtnPrimary: {
    backgroundColor: COLOR_DANGER,
    shadowColor: COLOR_DANGER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
