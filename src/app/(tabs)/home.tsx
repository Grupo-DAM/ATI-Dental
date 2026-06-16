import * as Device from 'expo-device';
import { Platform, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const { logout } = useAuth(); // 💡 Extraemos la función de cerrar sesión de tu hook

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
        // Redirigimos al flujo de login (asumiendo tu estructura de carpetas de Expo Router)
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText testID="welcome-header" type="title" style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          get started
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Try editing"
            hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Fresh start"
            hint={<ThemedText type="code">npm run reset-project</ThemedText>}
          />
        </ThemedView>

        {/* BOTÓN PARA PANTALLA DE EJEMPLO DE CONTACTO */}
        <Pressable
          style={({ pressed }) => [
            styles.exampleButton,
            pressed && styles.logoutButtonPressed
          ]}
          onPress={() => router.push('/contact-example')}
        >
          <ThemedText style={styles.exampleText}>
            Ver Pantalla de Ejemplo (Contacto)
          </ThemedText>
        </Pressable>

        {/* 💡 BOTÓN DE CERRAR SESIÓN */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed
          ]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>
            Cerrar sesión
          </ThemedText>
        </Pressable>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  // ESTILOS DEL BOTÓN DE CERRAR SESIÓN PLACEHOLDER
  logoutButton: {
    alignSelf: 'stretch',
    backgroundColor: '#FF3B30',
    borderRadius: Spacing.four,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exampleButton: {
    alignSelf: 'stretch',
    backgroundColor: '#5B2D8B', // Eminence Colors
    borderRadius: Spacing.four,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  exampleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});