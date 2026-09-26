import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated as RNAnimated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface NotificationToastProps {
  visible: boolean;
  type?: 'success' | 'error';
  message: string;
  title: string;
  onDismiss: () => void;
}

export function NotificationToast({
  visible,
  type = 'success',
  message,
  title,
  onDismiss,
}: Readonly<NotificationToastProps>) {
  const translateY = useRef(new RNAnimated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        RNAnimated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, onDismiss]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const accentColor = isSuccess ? '#10B981' : '#EF4444';
  const iconName = isSuccess ? 'checkmark-circle' : 'alert-circle';

  return (
    <RNAnimated.View
      testID="notification-toast"
      style={[
        toastStyles.container,
        { transform: [{ translateY }], borderLeftColor: accentColor },
      ]}
    >
      <View style={toastStyles.iconCircle}>
        <Ionicons name={iconName} size={24} color={accentColor} />
      </View>
      <View style={toastStyles.textContainer}>
        <Text style={toastStyles.title}>{title}</Text>
        <Text style={toastStyles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={toastStyles.closeBtn} testID="btn-dismiss-toast">
        <Ionicons name="close" size={20} color="#6B7280" />
      </TouchableOpacity>
    </RNAnimated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    borderLeftWidth: 4,
  },
  iconCircle: { marginRight: 12 },
  textContainer: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  message: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    marginTop: 2,
  },
  closeBtn: { padding: 4 },
});
