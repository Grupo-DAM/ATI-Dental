import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import firestoreModule from '@react-native-firebase/firestore'; // Importación para FieldValue
import { firestore } from '@/config/firebase';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/use-auth';
import '@/i18n';

// -------------------------------------------------------------
// CAPTURADOR GLOBAL DE ERRORES (Frontend / Sin Backend)
// -------------------------------------------------------------
const defaultHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler(async (error, isFatal) => {
  // Solo registramos si es un cierre fatal/inesperado
  if (isFatal) {
    try {
      // Escritura atómica correcta usando firestoreModule.FieldValue
      await firestore()
        .collection('metricas_estabilidad')
        .doc('actual')
        .set(
          {
            totalCrashes: firestoreModule.FieldValue.increment(1),
            affectedUsers: firestoreModule.FieldValue.increment(1),
            ultimoFallo: Date.now(),
          },
          { merge: true }
        );
    } catch (e) {
      console.error('[GlobalErrorHandler] No se pudo guardar el crash:', e);
    }
  }

  // Ejecuta la respuesta normal del sistema (cerrar la app o mostrar diálogo)
  if (defaultHandler) {
    defaultHandler(error, isFatal);
  }
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />

        {/* Un Stack raíz invisible que decide si mostrar el grupo (auth) o (tabs) */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}