import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';

// 1. Importamos tu componente de prueba usando el alias del proyecto
import ImagePickerTest from '@/components/ImagePickerTest';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* 2. Insertamos el Spike aquí para que pinte directo en la pantalla */}
        <ImagePickerTest />

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
    width: '100%',
  },
});