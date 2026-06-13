import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Registra tu pantalla de login aquí dentro */}
      <Stack.Screen name="login" />
    </Stack>
  );
}