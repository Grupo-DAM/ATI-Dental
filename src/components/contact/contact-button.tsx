import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/theme';

export type ContactButtonProps = {
  type: 'email' | 'phone' | 'whatsapp';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ContactButton({ type, onPress, style }: Readonly<ContactButtonProps>) {
  let backgroundColor = Colors.light.main;
  let text = 'Enviar Correo';
  let iconName: keyof typeof Ionicons.glyphMap = 'mail';

  if (type === 'phone') {
    backgroundColor = '#8F6BB3'; // Wisteria
    text = 'Llamada';
    iconName = 'call';
  } else if (type === 'whatsapp') {
    backgroundColor = '#34C759'; // WhatsApp Green
    text = 'WhatsApp';
    iconName = 'logo-whatsapp';
  }

  return (
    <TouchableOpacity
      testID={`btn-contact-${type}`}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, { backgroundColor }, style]}
    >
      <Ionicons name={iconName} size={20} color="white" style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    minWidth: 240,
    borderRadius: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignSelf: 'stretch',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Open Sans',
    textAlign: 'center',
  },
});
