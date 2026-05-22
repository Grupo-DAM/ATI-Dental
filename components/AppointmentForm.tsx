import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function AppointmentForm() {
  const { isConnected, type } = useNetworkStatus();
  const [patientName, setPatientName] = useState('');
  const [dentistName, setDentistName] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleBookAppointment = () => {
    if (!isConnected) {
      Alert.alert(
        'Acción bloqueada',
        'No puedes agendar citas sin conexión a internet.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (!patientName || !dentistName || !date) {
      Alert.alert('Campos obligatorios', 'Por favor llena los campos requeridos.', [
        { text: 'OK' },
      ]);
      return;
    }

    Alert.alert(
      'Cita Agendada',
      `¡Éxito! Cita agendada para ${patientName} con el Dr. ${dentistName} el ${date}.`,
      [{ text: 'Excelente' }]
    );

    // Clear form
    setPatientName('');
    setDentistName('');
    setDate('');
    setReason('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="calendar-outline" size={24} color="#60a5fa" />
            <Text style={styles.headerTitle}>Agendar Cita Médica</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Completa los datos para simular la reserva en tiempo real.
          </Text>
        </View>

        {/* Network Status indicator inside card */}
        <View
          style={[
            styles.networkBadge,
            isConnected ? styles.onlineBadge : styles.offlineBadge,
          ]}
        >
          <Ionicons
            name={isConnected ? 'wifi' : 'warning-outline'}
            size={14}
            color={isConnected ? '#4ade80' : '#f87171'}
          />
          <Text
            style={[
              styles.networkBadgeText,
              isConnected ? styles.onlineText : styles.offlineText,
            ]}
          >
            {isConnected
              ? `Online: Conectado a ${type.toUpperCase()}`
              : 'Offline: Sin conexión'}
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Paciente *</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dentista / Especialista *</Text>
          <TextInput
            style={styles.input}
            value={dentistName}
            onChangeText={setDentistName}
            placeholder="Ej. Dr. Carlos Cao"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha y Hora *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="Ej. 25 de Mayo, 10:00 AM"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Motivo de consulta (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Ej. Limpieza dental rutinaria"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            isConnected ? styles.buttonActive : styles.buttonDisabled,
          ]}
          onPress={handleBookAppointment}
          activeOpacity={0.8}
          disabled={!isConnected}
        >
          {isConnected ? (
            <>
              <Text style={styles.buttonText}>Agendar Cita</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={styles.buttonIcon} />
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color="#94a3b8" style={styles.buttonIconLeft} />
              <Text style={styles.buttonTextDisabled}>Botón Bloqueado (Offline)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Glass slate-900 background
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(51, 65, 85, 0.5)', // Slate-700 translucent border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
  },
  onlineBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  offlineBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  networkBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  onlineText: {
    color: '#4ade80',
  },
  offlineText: {
    color: '#f87171',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Slate-800 translucent
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  button: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#3b82f6', // Premium Dodger Blue
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  buttonIconLeft: {
    marginRight: 8,
  },
});
