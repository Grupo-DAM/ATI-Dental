import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useVoiceRecognition } from '@/hooks/use-voice-recognition';

/**
 * Parsea un comando de voz con el formato "Diente {número} {diagnóstico}".
 * Retorna el número del diente y el diagnóstico, o null si no coincide.
 */
export function parseVoiceCommand(transcript: string): { tooth: string; diagnosis: string } | null {
  // Patrón: "Diente <número> <diagnóstico>"
  const match = transcript.match(/diente\s+(\d{1,2})\s+(.+)/i);
  if (!match) return null;
  return {
    tooth: match[1],
    diagnosis: match[2].trim().toLowerCase(),
  };
}

/**
 * Componente de demostración que integra el reconocimiento de voz
 * con un parser de comandos para el odontograma.
 *
 * Incluye un panel de inyección de desarrollo (visible solo en __DEV__)
 * que permite simular la entrada de voz manualmente, tanto para pruebas
 * manuales como para flujos E2E con Maestro.
 */
export function VoiceCommandDemo() {
  const voice = useVoiceRecognition();
  const [injectionText, setInjectionText] = useState('');

  const parsedCommand = useMemo(() => {
    if (!voice.transcript) return null;
    return parseVoiceCommand(voice.transcript);
  }, [voice.transcript]);

  const handleInject = () => {
    if (injectionText.trim()) {
      voice.injectTranscript(injectionText.trim());
      setInjectionText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} testID="demo-title">Comando de Voz — Odontograma</Text>

      {/* Botón principal de escucha */}
      <Pressable
        style={[styles.button, voice.isListening && styles.buttonActive]}
        onPress={voice.isListening ? voice.stopListening : voice.startListening}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {voice.isListening ? 'Detener' : 'Escuchar'}
        </Text>
      </Pressable>

      {/* Estado actual */}
      {voice.isListening && (
        <Text style={styles.status}>🎙️ Escuchando...</Text>
      )}

      {voice.error && (
        <Text style={styles.error}>{voice.error}</Text>
      )}

      {/* Transcript recibido */}
      {voice.transcript !== '' && (
        <View style={styles.resultSection}>
          <Text style={styles.label}>Transcript:</Text>
          <Text style={styles.transcript}>{voice.transcript}</Text>
        </View>
      )}

      {/* Resultado del parseo del comando */}
      {parsedCommand && (
        <View style={styles.resultSection}>
          <Text style={styles.resultText} testID="result-tooth">Diente: {parsedCommand.tooth}</Text>
          <Text style={styles.resultText} testID="result-diagnosis">Diagnóstico: {parsedCommand.diagnosis}</Text>
        </View>
      )}

      {/* Panel de inyección para desarrollo y E2E (solo visible en __DEV__) */}
      {__DEV__ && (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle} testID="dev-panel-title">🛠️ Panel de Desarrollo</Text>
          <TextInput
            style={styles.devInput}
            value={injectionText}
            onChangeText={setInjectionText}
            placeholder="Ej: Diente 46 extraccion"
            placeholderTextColor="#999"
            accessibilityLabel="Comando de voz simulado"
            testID="dev-voice-input"
          />
          <Pressable
            style={styles.devButton}
            onPress={handleInject}
            accessibilityRole="button"
            testID="dev-inject-button"
          >
            <Text style={styles.devButtonText}>Inyectar</Text>
          </Pressable>

          {/* Botón de reinicio */}
          <Pressable
            style={[styles.devButton, styles.resetButton]}
            onPress={voice.reset}
            accessibilityRole="button"
            testID="dev-reset-button"
          >
            <Text style={styles.devButtonText}>Reiniciar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#E53935',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    color: '#208AEF',
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    color: '#E53935',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  transcript: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  resultSection: {
    padding: 16,
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    gap: 4,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // -- Panel de desarrollo --
  devPanel: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD54F',
    gap: 10,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57F17',
  },
  devInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  devButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#757575',
  },
  devButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
