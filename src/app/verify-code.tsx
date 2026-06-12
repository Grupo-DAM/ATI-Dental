import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Button, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { verifyCode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError(null);

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setError('No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.');
      return;
    }

    setLoading(true);
    try {
      await verifyCode();
      setSuccess(true);
      // Esperamos 2 segundos para que el usuario lea el mensaje de éxito antes de enviarlo al Home
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al verificar el correo. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>Verificación de correo</ThemedText>
        <Text style={styles.subtitle}>Hemos enviado un enlace de verificación a tu correo electrónico. Por favor revisa tu bandeja de entrada o spam, haz clic en el enlace y luego presiona el botón de abajo.</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {success ? (
          <Text style={styles.successText}>
            ¡Correo verificado con éxito! Ingresando a la aplicación...
          </Text>
        ) : (
          <View style={styles.form}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <Button title="Ya verifiqué mi correo" onPress={handleVerify} />
            )}
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
