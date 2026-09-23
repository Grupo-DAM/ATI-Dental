import React, { useState, useMemo } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { AuthLayout } from '@/components/auth/auth-layout';
import { NetworkErrorBanner } from '@/components/auth/network-error-banner';

import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { createStyles } from '@/constants/styles/auth.styles';
import { isValidEmail } from '@/utils/validation';

const EmailIcon = require('@/assets/icons/email.svg');

export default function RegisterScreen() {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const router = useRouter();
    const { register } = useAuth();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [matchError, setMatchError] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    const handleRegister = async () => {
        router.push('/verify-code'); //JUST FOR TESTING DELETE

        setError(null);
        setEmailError(false);
        setPasswordError(false);
        setMatchError(false);
        setNetworkError(false);

        if (email.trim().length === 0 || password.trim().length === 0 || confirmPassword.trim().length === 0) {
        setError(t('register.errors.empty', 'Por favor, rellena todos los campos.'));
        return;
        }

        if (!isValidEmail(email)) {
        setError(t('register.errors.invalidEmail', 'El formato de correo no es válido.'));
        setEmailError(true);
        return;
        }

        if (password !== confirmPassword) {
        setError(t('register.errors.match', 'Las contraseñas no coinciden.'));
        setMatchError(true);
        return;
        }

        if (password.length < 6) {
        setError(t('register.errors.shortPassword', 'La contraseña debe tener al menos 6 caracteres.'));
        setPasswordError(true);
        return;
        }

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
        setError(t('register.errors.noNetwork', 'No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.'));
        setNetworkError(true);
        return;
        }

        setLoading(true);
        try {
        await register(email, password);
        router.push('/verify-code');
        } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError(t('register.errors.emailInUse', 'El correo electrónico ya se encuentra registrado.'));
        } else {
            setError(err.message || t('register.errors.generic', 'Error al intentar registrar el usuario.'));
        }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
        title={t('register.title', 'Registro')}
        subtitle={t('register.subtitle', 'Ingresa tus credenciales para crear tu cuenta')}
        topContent= {networkError && (
            <NetworkErrorBanner
            title={t('register.errors.networkTitle', 'Error de conexión')}
            message={t('register.errors.networkMessage', 'Error de conexión con el servidor. Intente más tarde.')}
            />
        )}
        >

        <ThemedView>
            <ThemedTextInput
            testID="email-input"
            placeholder={t('register.emailPlaceholder', 'ejemplo@correo.com')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon={EmailIcon}
            fieldName={t('register.emailLabel', 'Correo electrónico')}
            error={(error || emailError) && !matchError && !passwordError && !networkError}
            errorMessage={emailError ? error || '' : ''}
            editable={!loading}
            />
            <ThemedTextInput
            testID="password-input"
            placeholder={t('register.passwordPlaceholder', 'Mínimo 6 caracteres')}
            isSecure={true}
            fieldName={t('register.passwordLabel', 'Contraseña')}
            value={password}
            onChangeText={setPassword}
            error={(error || passwordError || matchError) && !emailError && !networkError}
            errorMessage={passwordError ? error || '' : ''}
            editable={!loading}
            />
            <ThemedTextInput
            testID="confirm-password-input"
            placeholder={t('register.confirmPasswordPlaceholder', 'Vuelve a escribir la contraseña')}
            isSecure={true}
            fieldName={t('register.confirmPasswordLabel', 'Confirmar Contraseña')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={(error || matchError) && !emailError && !passwordError && !networkError}
            errorMessage={matchError ? error || '' : ''}
            editable={!loading}
            />

            {error && !emailError && !matchError && !passwordError && !networkError && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            )}

            <Pressable
            testID="signIn-button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleRegister}
            disabled={loading}
            >
            <ThemedText style={styles.buttonText}>
                {t('register.registerButton', 'Registrarse')}
            </ThemedText>
            </Pressable>
        </ThemedView>

        <ThemedView style={styles.labelContainer}>
            <ThemedText style={styles.label}>
            {t('register.hasAccount', '¿Ya tienes cuenta?')}
            </ThemedText>
            <ThemedText style={styles.signInLink} onPress={() => router.replace('/login')}>
            {t('register.loginLink', 'Iniciar sesión')}
            </ThemedText>
        </ThemedView>
        </AuthLayout>
    );
}