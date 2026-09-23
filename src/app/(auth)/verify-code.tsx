import React, { useState, useMemo } from 'react';
import { Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthLayout } from '@/components/auth/auth-layout';
import { NetworkErrorBanner } from '@/components/auth/network-error-banner';

import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { createAuthStyles } from '@/constants/styles/auth.styles';

export default function VerifyCodeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createAuthStyles(theme), [theme]);
  const router = useRouter();
  const { verifyCode } = useAuth();
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError(null);
    setNetworkError(false);

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setNetworkError(true);
      setError(
        t(
          'verifyCode.errors.noNetwork',
          'No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.'
        )
      );
      return;
    }

    setLoading(true);
    try {
      await verifyCode();
      setSuccess(true);
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (err: any) {
      setError(
        err?.message ||
          t(
            'verifyCode.errors.generic',
            'Error al verificar el correo. Intenta nuevamente.'
          )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('verifyCode.title', 'Verificación de correo')}
      subtitle={t(
        'verifyCode.subtitle',
        'Hemos enviado un enlace de verificación a tu correo electrónico. Por favor revisa tu bandeja de entrada o spam, haz clic en el enlace y luego presiona el botón de abajo.'
      )}
      topContent={networkError && (
        <NetworkErrorBanner
          title={t('verifyCode.errors.networkTitle', 'Error de conexión')}
          message={t(
            'verifyCode.errors.networkMessage',
            'Error de conexión con el servidor. Intente más tarde.'
          )}
        />
      )}
    >

      <ThemedView>
        {error && !networkError && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}

        {success ? (
          <ThemedText style={styles.successText}>
            {t(
              'verifyCode.success',
              '¡Correo verificado con éxito! Ingresando a la aplicación...'
            )}
          </ThemedText>
        ) : (
          <Pressable
            testID="verify-button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.overMain} />
            ) : (
              <ThemedText style={styles.buttonText}>
                {t('verifyCode.verifyButton', 'Ya verifiqué mi correo')}
              </ThemedText>
            )}
          </Pressable>
        )}
      </ThemedView>
    </AuthLayout>
  );
}