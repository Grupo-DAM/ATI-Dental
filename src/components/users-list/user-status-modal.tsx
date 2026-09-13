import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';

export interface UserStatusModalProps {
  visible: boolean;
  userName: string;
  targetStatus: 'activo' | 'inactivo';
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UserStatusModal({
  visible,
  userName,
  targetStatus,
  loading,
  onConfirm,
  onCancel,
}: Readonly<UserStatusModalProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const isActivating = targetStatus === 'activo';

  const title = isActivating
    ? t('admin-users.confirmActivateTitle', 'Activar usuario')
    : t('admin-users.confirmDeactivateTitle', 'Desactivar usuario');

  const defaultMessage = isActivating
    ? `¿Estás seguro de que deseas activar a ${userName}? Tendrá acceso al sistema administrativo.`
    : `¿Estás seguro de que deseas desactivar a ${userName}? Se revocarán sus accesos al sistema administrativo.`;

  const translatedMessage = isActivating
    ? t('admin-users.confirmActivateMessage', { name: userName, defaultValue: defaultMessage })
    : t('admin-users.confirmDeactivateMessage', { name: userName, defaultValue: defaultMessage });

  const message = typeof translatedMessage === 'string' ? translatedMessage : defaultMessage;

  const confirmText = isActivating
    ? t('admin-users.confirmActivateBtn', 'Activar')
    : t('admin-users.confirmDeactivateBtn', 'Desactivar');

  const confirmBgColor = isActivating ? theme.main : theme.error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="user-status-modal"
    >
      <View style={styles.overlay} testID="user-status-modal-overlay">
        <View style={styles.card} testID="user-status-modal-card">
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isActivating
                  ? `${theme.main}1A`
                  : `${theme.error}1A`,
              },
            ]}
          >
            <Ionicons
              name={isActivating ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={36}
              color={isActivating ? theme.main : theme.error}
            />
          </View>

          <Text style={styles.title} testID="modal-status-title">
            {title}
          </Text>

          <Text style={styles.message} testID="modal-status-message">
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              testID="modal-cancel-btn"
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {t('admin-users.cancel', 'Cancelar')}
              </Text>
            </Pressable>

            <Pressable
              testID="modal-confirm-btn"
              style={({ pressed }) => [
                styles.confirmButton,
                { backgroundColor: confirmBgColor },
                pressed && styles.confirmButtonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" testID="modal-loading-indicator" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.backgroundElement || '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: theme.border || '#E5E7EB',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.pageTitle || '#1F2937',
      textAlign: 'center',
      marginBottom: 10,
      fontFamily: 'Open Sans',
    },
    message: {
      fontSize: 14,
      color: theme.pageSubtitle || '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      fontFamily: 'Open Sans',
    },
    buttonRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border || '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    cancelButtonPressed: {
      opacity: 0.7,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary || '#4B5563',
    },
    confirmButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmButtonPressed: {
      opacity: 0.85,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
