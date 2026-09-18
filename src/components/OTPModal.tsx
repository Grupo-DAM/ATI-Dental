import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Spacing } from '../constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface VerificationLinkModalProps {
  visible: boolean;
  email: string;
  onResend: () => Promise<void>;
  onClose: () => void;
}

export const VerificationLinkModal = ({ visible, email, onResend, onClose }: VerificationLinkModalProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const theme = useTheme();
  useEffect(() => {
      if (visible) {
        setMessage('');
        setLoading(false);
      }
    }, [visible]);
    const handleResend = async () => {
      setLoading(true);
      setMessage('');
      try {
        await onResend();
        setMessage('¡Enlace reenviado con éxito!');
      } catch (error: any) {
        if (error.code === 'auth/network-request-failed' || error.message === 'Sin conexión a internet') {
          setMessage('Sin conexión a internet. Intenta de nuevo.');
        } else {
          setMessage('Error al reenviar el enlace. Intenta de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    };

    const renderStatusContent = () => {
      if (loading) {
        return <ActivityIndicator color={theme.main} style={{ marginBottom: Spacing.three }} />;
      }

      if (message) {
        return (
          <Text style={{ color: theme.main, marginBottom: Spacing.three, fontWeight: '600' }}>
            {message}
          </Text>
        );
      }

      return null;
    };

  return (
    <Modal visible={visible} transparent testID="modal-verification">
      <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.four, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: theme.backgroundElement, padding: Spacing.four, borderRadius: 8, alignItems: 'center' }}>

          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: Spacing.two, color: theme.pageTitle }}>Confirmación de Correo</Text>

          <Text style={{ fontSize: 14, color: theme.pageSubtitle, textAlign: 'center', marginBottom: Spacing.three }}>
            Hemos enviado un enlace de verificación a: {'\n'}
            <Text style={{ fontWeight: 'bold', color: theme.main }}>{email}</Text>
          </Text>

          <Text style={{ fontSize: 13, color: theme.pageSubtitle, textAlign: 'center', marginBottom: Spacing.four }}>
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para completar la actualización de tu perfil.
          </Text>

          {renderStatusContent()}

          <TouchableOpacity
            testID="btn-resend-link"
            onPress={handleResend}
            style={{ marginBottom: Spacing.three }}
          >
            <Text style={{ color: theme.main, fontWeight: '600' }}>Reenviar Enlace</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-close-modal"
            onPress={onClose}
            style={{ backgroundColor: theme.main, paddingVertical: 10, paddingHorizontal: 30, borderRadius: 6 }}
          >
            <Text style={{ color: theme.overMain, fontWeight: 'bold' }}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
