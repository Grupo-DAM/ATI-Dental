import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Button, Text, ActivityIndicator, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { ThemedTextInput } from '@/components/themed-text-input';
import { HorizontalLogo } from '@/components/horizontal-logo';

const EmailIcon = require('@/assets/icons/email.png');
const WarningIcon = require('@/assets/icons/warning.png');

export default function RegisterScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [matchError, setMatchError] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const isValidEmail = (email: string) => {
    // Expresión regular optimizada contra ataques ReDoS (SonarCloud hotspot)
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleRegister = async () => {
    setError(null);
    setEmailError(false);
    setPasswordError(false);
    setMatchError(false);
    setNetworkError(false);

    if (email.trim().length === 0 || password.trim().length === 0 || confirmPassword.trim().length === 0) {
        setError('Por favor, rellena todos los campos.');
        return
    }

    if (!isValidEmail(email)) {
      setError('El formato de correo no es válido.');
      setEmailError(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setMatchError(true);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setPasswordError(true);
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setError('No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.');
      setNetworkError(true);
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      // Tras un registro exitoso, el usuario queda en estado pendiente y se le envía el OTP simulado.
      router.push('/verify-code');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya se encuentra registrado.');
      } else {
        setError(err.message || 'Error al intentar registrar el usuario.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
        {networkError && (<ThemedView style={styles.errorPopup}>
            <Image
                source={WarningIcon}
                style={[styles.icon]}
            />
            <ThemedView style={{width: '90%', backgroundColor: theme.errorBackground}}>
                <ThemedText style={styles.popupTitle}>
                    Error de conexión
                </ThemedText>
                <ThemedText style={[styles.label, {color: theme.error, textAlign: 'left'}]}>
                    Error de conexión con el servidor. Intente
                    más tarde.
                </ThemedText>
            </ThemedView>
        </ThemedView>)}

        <ThemedView style={styles.titleContainer}>
            <HorizontalLogo/>
            <ThemedText style={styles.title}>
                Registro
            </ThemedText>
            <ThemedText style={styles.subtitle}>
                Ingresa tus credenciales para crear tu cuenta
            </ThemedText>
        </ThemedView>

        <ThemedView>
            <ThemedTextInput
                 testID="email-input"
                 placeholder="ejemplo@correo.com"
                 value={email}
                 onChangeText={setEmail}
                 keyboardType="email-address"
                 autoCapitalize="none"
                 autoCorrect={false}
                 icon={EmailIcon}
                 fieldName="Correo electrónico"
                 error = {(error || emailError) && !matchError && !passwordError && !networkError}
                 errorMessage = {emailError? error: ''}
                 editable={!loading}
              />
             <ThemedTextInput
                testID="password-input"
                placeholder="Mínimo 6 caracteres"
                isSecure={true}
                fieldName="Contraseña"
                value={password}
                onChangeText={setPassword}
                error = {(error || passwordError || matchError) && !emailError && !networkError}
                errorMessage = {passwordError? error: ''}
                editable={!loading}
             />
             <ThemedTextInput
                testID="confirm-password-input"
                placeholder="Vuelve a escribir la contraseña"
                isSecure={true}
                fieldName="Confirmar Contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error = {(error || matchError) && !emailError && !passwordError && !networkError}
                errorMessage = {matchError? error: ''}
                editable={!loading}
             />
            {error && !emailError && !matchError && !passwordError && !networkError && (
                <ThemedText style={styles.errorText}>
                    {error}
                </ThemedText>
            )}
            <Pressable
                testID="signIn-button"
                style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed
                ]}
                onPress={handleRegister}
                disabled={loading}
            >
                <ThemedText style={styles.buttonText}>
                    Registrarse
                </ThemedText>
            </Pressable>
        </ThemedView>

        <ThemedView style={styles.labelContainer}>
          <ThemedText style={styles.label}>
              ¿Ya tienes cuenta?
          </ThemedText>
          <ThemedText
              style={styles.signInLink}
              onPress={() => router.replace('/login')}>
              Iniciar sesión
          </ThemedText>
        </ThemedView>
    </ThemedView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      gap: 32
  },
  errorText: {
    color: theme.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  signInLink: {
    color: theme.main,
    fontSize: 14,
    fontWeight: 'bold'
  },
  labelContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8
  },
  label: {
      color: theme.accentText,
      fontSize: 14,
      fontWeight: 'regular',
      textAlign: 'center'
  },
    titleContainer: {
        gap: 8
    },
    title: {
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold'
    },
    subtitle: {
        textAlign: 'center',
        color: theme.accentText,
        fontSize: 16,
        fontWeight: 'regular'
    },
    button: {
        backgroundColor: theme.main,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 48,
        marginTop: 8,
        marginBottom: 16,
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    popupTitle: {
        color: theme.error,
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorPopup: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.error,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: theme.errorBackground
    }
});
