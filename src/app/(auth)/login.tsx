import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { Platform, StyleSheet } from 'react-native';
import { TextInput, Button, Alert } from 'react-native';
import { router } from 'expo-router';

const EmailIcon = require('@/assets/icons/email.png');

export default function LoginScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const emptyErrorMessage = 'Por favor, rellena todos los campos.';
    const wrongCredentialsMessage = 'El correo o la contraseña son incorrectos.';
    const [emailError, setEmailError] = useState(false);
    const emailErrorMessage = 'El formato del correo no es válido.';

    const handleLogin = async () => {
        setHasError(false);
        setEmailError(false);

        let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

        if (email.trim().length === 0 || password.trim().length === 0) {
            setHasError(true)
            setErrorMessage(emptyErrorMessage);
            return
        }

        if (reg.test(email) === false) {
            setEmailError(true)
            return
        }

        try {
            await login(email, password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            setHasError(true);
            setErrorMessage(wrongCredentialsMessage);
        }
    };
    return (
        <ThemedView style={styles.container}>

            <ThemedText type='subtitle'>
                Bienvenido de nuevo
            </ThemedText>
            <ThemedText type='small'>
                Ingresa tus credenciales para acceder a tu panel
            </ThemedText>

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
                 error = {hasError || emailError}
                 errorMessage = {emailError? emailErrorMessage: ''}
              />
             <ThemedTextInput
                testID="password-input"
                placeholder="Contraseña"
                isSecure={true}
                fieldName="Contraseña"
                value={password}
                onChangeText={setPassword}
                error = {hasError}
             />
            {hasError && (
                <ThemedText style={styles.errorText}>
                    {errorMessage}
                </ThemedText>
            )}
            <Button
                testID = "login-button"
                title = "Iniciar sesión"
                onPress = {handleLogin}
            />

            <ThemedText>
                ¿No tienes una cuenta? Registrarse
            </ThemedText>

            <ThemedView style={styles.socialMediaBtns}>
                <Button
                    title = "Google"
                 />
                <Button
                    title = "Microsoft"
                 />
            </ThemedView>
        </ThemedView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        color: '#000',
    },
    socialMediaBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    errorText: {
        color: theme.error,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
    }
});