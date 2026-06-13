// src/app/index.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ThemedView } from '@/components/themed-view';

export default function Index() {
  const { user, loading } = useAuth();

  // 1. Mientras Firebase y el SecureStore verifican si hay una sesión activa...
  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </ThemedView>
    );
  }

  // 2. Si hay un usuario autenticado, lo mandamos al flujo de la App (con Bottom Tabs)
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  // 3. Si NO está autenticado, lo mandamos directo al Login (sin Bottom Tabs)
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});