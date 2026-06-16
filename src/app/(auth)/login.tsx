import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { HorizontalLogo } from '@/components/horizontal-logo';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const emptyErrorMessage = t('login.errors.empty');
    const wrongCredentialsMessage = t('login.errors.wrongCredentials');
    const emailErrorMessage = t('login.errors.invalidEmail');

    const handleLogin = async () => {
        setHasError(false);
        setEmailError(false);
        setNetworkError(false);

        let reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
        } catch {
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
                        {t('login.errors.networkTitle')}
                    </ThemedText>
                    <ThemedText style={[styles.label, {color: theme.error, textAlign: 'left'}]}>
                        {t('login.errors.networkMessage')}
                    </ThemedText>
                </ThemedView>
            </ThemedView>)}

            <ThemedView style={styles.titleContainer}>
                <HorizontalLogo/>
                <ThemedText style={styles.title}>
                    {t('login.title')}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    {t('login.subtitle')}
                </ThemedText>
            </ThemedView>

            <ThemedView>
                <ThemedTextInput
                     testID="email-input"
                     placeholder={t('login.emailPlaceholder')}
                     value={email}
                     onChangeText={setEmail}
                     keyboardType="email-address"
                     autoCapitalize="none"
                     autoCorrect={false}
                     icon={EmailIcon}
                     fieldName={t('login.emailLabel')}
                     error = {hasError || emailError}
                     errorMessage = {emailError? emailErrorMessage: ''}
                     editable={!isLoading}
                  />
                 <ThemedTextInput
                    testID="password-input"
                    placeholder={t('login.passwordPlaceholder')}
                    isSecure={true}
                    login = {true}
                    fieldName={t('login.passwordLabel')}
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
                        {t('login.loginButton')}
                    </ThemedText>
                </Pressable>
            </ThemedView>

            <ThemedView style={{gap: 16}}>
                <ThemedView style={styles.labelContainer}>
                    <ThemedText style={styles.label}>
                        {t('login.noAccount')}
                    </ThemedText>
                    <ThemedText
                        testID = "signIn-link"
                        style={styles.signInLink}
                        onPress={() => router.replace('/register')}>
                        {t('login.register')}
                    </ThemedText>
                </ThemedView>

                <ThemedText style={styles.label}>
                    {t('login.orContinueWith')}
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
                        <ThemedText style={[styles.buttonText, {color: theme.text}]}>
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
                        <ThemedText style={[styles.buttonText, {color: theme.text}]}>
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