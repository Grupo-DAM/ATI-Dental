import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function DialogSpike() {
  const showConfirmation = () => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de que deseas realizar esta acción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: () => console.log('Aceptado') },
      ]
    );
  };

  const showSuccess = () => {
    Alert.alert(
      'Éxito',
      'La operación se completó correctamente.',
      [{ text: 'OK', onPress: () => console.log('OK presionado') }]
    );
  };

  const showError = () => {
    Alert.alert(
      'Error',
      'Ocurrió un error inesperado al procesar tu solicitud.',
      [{ text: 'Cerrar', style: 'cancel' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Spike: Diálogos y Alertas</ThemedText>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={showConfirmation}>
          <ThemedText style={styles.buttonText}>Alerta de Confirmación</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={showSuccess}>
          <ThemedText style={styles.buttonText}>Mensaje de Éxito</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={showError}>
          <ThemedText style={styles.buttonText}>Mensaje de Error</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759', 
  },
  errorButton: {
    backgroundColor: '#FF3B30', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
