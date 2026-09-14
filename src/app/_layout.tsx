import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import firestoreModule from '@react-native-firebase/firestore';
import { firestore } from '@/config/firebase';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/use-auth';
import '@/i18n';

// -------------------------------------------------------------
// CAPTURADOR GLOBAL DE ERRORES (Optimizado y No Bloqueante)
// -------------------------------------------------------------
const defaultHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (isFatal) {
    // 🔥 Fire-and-forget: No usar await aquí para no bloquear la salida del sistema ni la UI
    firestore()
      .collection('metricas_estabilidad')
      .doc('actual')
      .set(
        {
          totalCrashes: firestoreModule.FieldValue.increment(1),
          affectedUsers: firestoreModule.FieldValue.increment(1),
          ultimoFallo: Date.now(),
        },
        { merge: true }
      )
      .catch((e) => console.error('[GlobalErrorHandler] Error enviando crash:', e));
  }

  // Ejecución sincrónica e inmediata del handler original
  if (defaultHandler) {
    defaultHandler(error, isFatal);
  }
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Asegúrate de que este componente no se quede como un velo bloqueando toques */}
        <AnimatedSplashOverlay />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}