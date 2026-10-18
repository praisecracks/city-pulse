import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ConfirmActionModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Set for destructive actions. The confirm button turns red. */
  destructive?: boolean;
  /**
   * Shown inside the modal when the action failed. Shown here rather than only
   * on the screen behind, because the modal covers that screen and a failure
   * the user cannot see reads as a button that does nothing.
   */
  error?: string | null;
};

/**
 * Generic confirmation for an action that cannot be undone by tapping back.
 *
 * Separate from SignOutConfirmationModal because the copy, the icon and the
 * confirm label all vary per action, and hardcoding one of them into the modal
 * is what makes a shared dialog get reused for the wrong thing.
 */
export function ConfirmActionModal({
  visible,
  onCancel,
  onConfirm,
  isConfirming = false,
  title,
  message,
  confirmLabel,
  icon = 'help-circle-outline',
  destructive = false,
  error = null,
}: ConfirmActionModalProps) {
  const theme = useTheme();

  const iconColor = destructive ? theme.dangerText : theme.accent;
  const iconBackground = destructive ? theme.dangerBg : theme.accentSoft;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
              <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: theme.textBody }]}>{title}</ThemedText>
          </View>

          <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>{message}</ThemedText>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerBg }]}>
              <Ionicons name="alert-circle" size={16} color={theme.dangerText} />
              <ThemedText style={[styles.errorText, { color: theme.dangerText }]}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.modalButtons}>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]}
              onPress={onCancel}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <ThemedText style={[styles.modalBtnSecondaryText, { color: theme.textBody }]}>
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: destructive ? theme.dangerText : theme.accent },
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
              disabled={isConfirming}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {isConfirming ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.modalBtnPrimaryText}>{confirmLabel}</ThemedText>
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
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
    backgroundColor: 'rgba(128, 128, 128, 0.18)',
  },
  pressed: {
    opacity: 0.8,
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
