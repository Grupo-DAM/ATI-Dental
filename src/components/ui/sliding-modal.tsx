import React, { useMemo } from 'react';
import {
  View,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createSlidingModalStyles } from '@/constants/styles/global.styles';
import { LinearGradient } from 'expo-linear-gradient';

export interface SlidingModalProps {
  visible: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  children: React.ReactNode;
}

/** Generic confirmation bottom sheet modal */
export function SlidingModal({
  visible,
  isSubmitting = false,
  onCancel,
  children
}: Readonly<SlidingModalProps>) {
    const theme = useTheme();
    const modalStyles = useMemo(() => createSlidingModalStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isSubmitting ? undefined : onCancel}
    >
      <Pressable style={modalStyles.overlay} onPress={isSubmitting ? undefined : onCancel}>
        <LinearGradient
            colors={theme.mainGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={modalStyles.wrapper}
        >
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          {children}
        </View>
        </LinearGradient>
      </Pressable>
    </Modal>
  );
}