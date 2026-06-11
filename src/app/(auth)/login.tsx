import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/themed-text-input';
import { useAuth } from '@/hooks/use-auth';
import { Platform, StyleSheet } from 'react-native';
import { TextInput, Button, Alert } from 'react-native';
import { router } from 'expo-router';

const EmailIcon = require('@/assets/icons/email.png');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            // Llama al método del hook (este ya se encarga de Firebase y SecureStore por detrás)
            await login(email, password);
            // Si no falla, redirige
            router.replace('/home');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Credenciales incorrectas');
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
              />
             <ThemedTextInput
                testID="password-input"
                placeholder="Contraseña"
                isSecure={true}
                fieldName="Contraseña"
                value={password}
                onChangeText={setPassword}
             />
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

const styles = StyleSheet.create({
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

    }
});