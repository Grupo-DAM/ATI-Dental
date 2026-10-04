import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSubmitting?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const createConfirmationModalStyles = (theme: any, insets?: { bottom?: number }) => {
  const bottomInset = insets?.bottom ?? 0;
  const paddingBottom = Math.max(bottomInset, 24);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.backgroundElement,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom,
      alignItems: 'center',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.cardSeparator,
      borderRadius: 2,
      marginBottom: 20,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
      paddingHorizontal: 12,
    },
    confirmBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    confirmText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'Open Sans',
    },
    cancelBtn: {
      width: '100%',
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary || theme.cardSeparator,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.fieldLabel,
      fontFamily: 'Open Sans',
    },
  });
};

/** Generic confirmation bottom sheet modal supporting dark mode and safe area insets */
export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  icon = 'help-circle-outline',
  isSubmitting = false,
  isDestructive = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmationModalProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const modalStyles = useMemo(() => createConfirmationModalStyles(theme, insets), [theme, insets]);

  const iconColor = isDestructive ? theme.error : theme.main;
  const iconBgColor = isDestructive
    ? `${theme.error}20`
    : (theme.accentBackground || `${theme.main}20`);
  const confirmBgColor = isDestructive ? theme.error : theme.main;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isSubmitting ? undefined : onCancel}
    >
      <Pressable style={modalStyles.overlay} onPress={isSubmitting ? undefined : onCancel}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />

          <View style={[modalStyles.iconCircle, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={40} color={iconColor} />
          </View>

          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>

          <TouchableOpacity
            testID="modal-confirm-btn"
            style={[
              modalStyles.confirmBtn, 
              { backgroundColor: confirmBgColor },
              isSubmitting && { opacity: 0.7 }
            ]}
            onPress={onConfirm}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={modalStyles.confirmText}>{confirmText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="modal-cancel-btn"
            style={modalStyles.cancelBtn}
            onPress={onCancel}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
