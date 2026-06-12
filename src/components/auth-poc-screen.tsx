import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { getSessionToken } from '@/utils/secure-storage';

type AuthPocScreenProps = {
  showBackButton?: boolean;
};

export default function AuthPocScreen({ showBackButton = false }: AuthPocScreenProps) {
  const theme = useTheme();
  const { user, loading, error, loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [jwtPreview, setJwtPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setJwtPreview(null);
      return;
    }
    getSessionToken().then((token) => {
      if (!token) {
        setJwtPreview(null);
        return;
      }
      setJwtPreview(`${token.slice(0, 48)}…`);
    });
  }, [user]);

  const handleGoogleLogin = useCallback(async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch {
      // error expuesto en useAuth.error
    } finally {
      setBusy(false);
    }
  }, [loginWithGoogle]);

  const isWeb = Platform.OS === 'web';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {showBackButton ? (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ThemedText type="link">← Volver</ThemedText>
            </Pressable>
          ) : null}

          <ThemedText type="title" style={styles.title}>
            PoC: Google + Firebase Auth
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Google Sign-In → idToken → Firebase Auth → JWT en SecureStore → perfil
            Firestore
          </ThemedText>

          {isWeb && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="small">
                Esta PoC usa Google Sign-In nativo. Compila con{' '}
                <ThemedText type="code">npx expo run:android</ThemedText> (no Expo Go).
              </ThemedText>
            </ThemedView>
          )}

          {(loading || busy) && (
            <ActivityIndicator color={theme.text} style={styles.loader} />
          )}

          {error ? (
            <ThemedView style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </ThemedView>
          ) : null}

          {!user ? (
            <Pressable
              disabled={busy || loading || isWeb}
              onPress={handleGoogleLogin}
              style={({ pressed }) => [
                styles.googleButton,
                (pressed || busy || isWeb) && styles.pressed,
              ]}>
              <ThemedText style={styles.googleButtonText}>Continuar con Google</ThemedText>
            </Pressable>
          ) : (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="subtitle">Inicio de sesión exitoso</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                PoC completada. El flujo termina aquí (sin cierre de sesión ni borrado de cuenta).
              </ThemedText>
              <ThemedText type="small">
                UID: <ThemedText type="code">{user.uid}</ThemedText>
              </ThemedText>
              <ThemedText type="small">
                Email: <ThemedText type="code">{user.email ?? '—'}</ThemedText>
              </ThemedText>
              {user.nombre ? (
                <ThemedText type="small">
                  Nombre: <ThemedText type="code">{user.nombre}</ThemedText>
                </ThemedText>
              ) : null}
              <ThemedText type="small">
                Estado: <ThemedText type="code">{user.estado ?? '—'}</ThemedText>
              </ThemedText>
              {jwtPreview ? (
                <ThemedText type="small" style={styles.jwtPreview}>
                  JWT (preview):{'\n'}
                  <ThemedText type="code">{jwtPreview}</ThemedText>
                </ThemedText>
              ) : null}
            </ThemedView>
          )}
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.two,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  errorText: {
    color: '#991b1b',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  jwtPreview: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.75,
  },
});
