import React, { useState, useMemo } from 'react';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
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
const GoogleIcon = require('@/assets/icons/Google.svg');
const MicrosoftIcon = require('@/assets/icons/Microsoft.svg');

export default function LoginScreen() {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { login } = useAuth();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    const handleLogin = async () => {
        setHasError(false);
        setEmailError(false);
        setNetworkError(false);

        if (email.trim().length === 0 || password.trim().length === 0) {
            setHasError(true);
            setErrorMessage(t('login.errors.empty'));
            return;
        }

        if (!isValidEmail(email)) {
            setEmailError(true);
            return;
        }

        setIsLoading(true);

        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
                setNetworkError(true);
                return;
            }

            await login(email, password);
            router.replace('/(tabs)/home');
        } catch (err: any) {
            setHasError(true);
            if (err?.message === 'ACCOUNT_DEACTIVATED' || err?.code === 'auth/account-deactivated') {
                setErrorMessage(
                t(
                    'login.errors.accountDeactivated',
                    'Su cuenta ha sido desactivada. Póngase en contacto con el administrador'
                )
                );
            } else {
                setErrorMessage(t('login.errors.wrongCredentials'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('login.title')}
            subtitle={t('login.subtitle')}
            titleTestID="login-title"
        >
            {networkError && (
                <NetworkErrorBanner
                title={t('login.errors.networkTitle')}
                message={t('login.errors.networkMessage')}
                />
            )}

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
                error={hasError || emailError}
                errorMessage={emailError ? t('login.errors.invalidEmail') : ''}
                editable={!isLoading}
                />
                <ThemedTextInput
                testID="password-input"
                placeholder={t('login.passwordPlaceholder')}
                isSecure={true}
                login={true}
                fieldName={t('login.passwordLabel')}
                value={password}
                onChangeText={setPassword}
                error={hasError}
                editable={!isLoading}
                />

                {hasError && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}

                <Pressable
                testID="login-button"
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={handleLogin}
                disabled={isLoading}
                >
                <ThemedText style={styles.buttonText}>{t('login.loginButton')}</ThemedText>
                </Pressable>
            </ThemedView>

            <ThemedView style={{ gap: 16 }}>
                <ThemedView style={styles.labelContainer}>
                <ThemedText style={styles.label}>{t('login.noAccount')}</ThemedText>
                <ThemedText
                    testID="signIn-link"
                    style={styles.signInLink}
                    onPress={() => router.replace('/register')}
                >
                    {t('login.register')}
                </ThemedText>
                </ThemedView>

                <ThemedText style={styles.label}>{t('login.orContinueWith')}</ThemedText>

                <ThemedView style={styles.socialMediaBtns}>
                <Pressable
                    style={({ pressed }) => [styles.socialMediaBtn, pressed && styles.buttonPressed]}
                    disabled={isLoading}
                >
                    <Image source={GoogleIcon} style={[styles.icon]} />
                    <ThemedText style={[styles.buttonText, { color: theme.text }]}>Google</ThemedText>
                </Pressable>
                <Pressable
                    style={({ pressed }) => [styles.socialMediaBtn, pressed && styles.buttonPressed]}
                    disabled={isLoading}
                >
                    <Image source={MicrosoftIcon} style={[styles.icon]} />
                    <ThemedText style={[styles.buttonText, { color: theme.text }]}>Microsoft</ThemedText>
                </Pressable>
                </ThemedView>
            </ThemedView>
        </AuthLayout>
    );
}