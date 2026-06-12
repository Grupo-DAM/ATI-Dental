import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { HorizontalLogo } from '@/components/horizontal-logo';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { Platform, StyleSheet, Image } from 'react-native';
import { TextInput, Pressable, Button, Alert } from 'react-native';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

const EmailIcon = require('@/assets/icons/email.png');
const GoogleIcon = require('@/assets/icons/Google.png');
const MicrosoftIcon = require('@/assets/icons/Microsoft.png');
const WarningIcon = require('@/assets/icons/warning.png');

export default function LoginScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    const emptyErrorMessage = 'Por favor, rellena todos los campos.';
    const wrongCredentialsMessage = 'El correo o la contraseña son incorrectos.';
    const emailErrorMessage = 'El formato del correo no es válido.';

    const handleLogin = async () => {
        setHasError(false);
        setEmailError(false);
        setNetworkError(false);

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

        setIsLoading(true);

        try {
            const state = await NetInfo.fetch();
            if (state.isConnected === false) {
                setNetworkError(true);
                setIsLoading(false);
                return;
            }
            await login(email, password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            setHasError(true);
            setErrorMessage(wrongCredentialsMessage);
        } finally {
            setIsLoading(false);
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
                    Bienvenido de nuevo
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    Ingresa tus credenciales para acceder a tu panel
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
                     error = {hasError || emailError}
                     errorMessage = {emailError? emailErrorMessage: ''}
                     editable={!isLoading}
                  />
                 <ThemedTextInput
                    testID="password-input"
                    placeholder="Contraseña"
                    isSecure={true}
                    fieldName="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    error = {hasError}
                    editable={!isLoading}
                 />
                {hasError && (
                    <ThemedText style={styles.errorText}>
                        {errorMessage}
                    </ThemedText>
                )}
                <Pressable
                    testID="login-button"
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <ThemedText style={styles.buttonText}>
                        Iniciar sesión
                    </ThemedText>
                </Pressable>
            </ThemedView>

            <ThemedView style={{gap: 16}}>
                <ThemedView style={styles.labelContainer}>
                    <ThemedText style={styles.label}>
                        ¿No tienes una cuenta?
                    </ThemedText>
                    <ThemedText
                        style={styles.signInLink}
                        onPress={() => Linking.openURL('https://reactnative.dev')}>
                        Registrarse
                    </ThemedText>
                </ThemedView>

                <ThemedText style={styles.label}>
                    O CONTINÚA CON
                </ThemedText>

                <ThemedView style={styles.socialMediaBtns}>
                    <Pressable
                        style={({ pressed }) => [
                        styles.socialMediaBtn,
                        pressed && styles.buttonPressed
                        ]}
                        disabled={isLoading}
                    >
                        <Image
                            source={GoogleIcon}
                            style={[styles.icon]}
                        />
                        <ThemedText style={styles.buttonText}>
                            Google
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                        styles.socialMediaBtn,
                        pressed && styles.buttonPressed
                        ]}
                        disabled={isLoading}
                    >
                        <Image
                            source={MicrosoftIcon}
                            style={[styles.icon]}
                        />
                        <ThemedText style={styles.buttonText}>
                            Microsoft
                        </ThemedText>
                    </Pressable>
                </ThemedView>
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
        justifyContent: 'center',
        gap: 16
    },
    errorText: {
        color: theme.error,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
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
        opacity: 0.8,                // Se atenúa ligeramente al hacer clic
    },
    buttonText: {
        color: '#ffffff',            // Asegúrate de que contraste con theme.main
        fontSize: 16,
        fontWeight: '600',
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
    signInLink: {
        color: theme.main,
        fontSize: 14,
        fontWeight: 'bold'
    },
    socialMediaBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.backgroundColor,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
        width: '40%'
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