import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface OTPModalProps {
  visible: boolean;
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

export const OTPModal = ({ visible, onConfirm, onCancel }: OTPModalProps) => {
  const [code, setCode] = useState('');
  const currentColors = Colors.light; // o consumir tu hook de tema

  return (
    <Modal visible={visible} transparent testID="modal-otp">
      <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.four, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: currentColors.background, padding: Spacing.four, borderRadius: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Código de Confirmación</Text>
          <TextInput
            testID="input-otp"
            value={code}
            onChangeText={setCode}
            style={{ borderWidth: 1, padding: Spacing.two, marginVertical: Spacing.two }}
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity testID="btn-confirm-otp" onPress={() => onConfirm(code)}>
            <Text>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
