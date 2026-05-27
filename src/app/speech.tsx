import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from '@jamsch/expo-speech-recognition';

const DIENTES_INICIALES = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28];

interface EstadoDientes {
  [key: number]: 'sano' | 'caries' | 'normal';
}

export default function SpeechToTextPoC() {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [dientes, setDientes] = useState<EstadoDientes>({});

  const regexDiente = /(?:diente|pieza)\s+(\d{2})\s+(caries|sano)/i;
  const regexGuardar = /\b(guardar|salvar)\b/i;
  const regexLimpiar = /\b(limpiar|reiniciar|resetear)\b/i;

  const procesarComandosDeVoz = (texto: string) => {
    const textoLimpio = texto.toLowerCase().trim();

    const matchDiente = textoLimpio.match(regexDiente);
    if (matchDiente) {
      const numeroDiente = parseInt(matchDiente[1], 10);
      const estadoDiente = matchDiente[2] as 'caries' | 'sano';

      if (DIENTES_INICIALES.includes(numeroDiente)) {
        setDientes(prev => ({ ...prev, [numeroDiente]: estadoDiente }));
      }
    }

    if (regexLimpiar.test(textoLimpio)) {
      setDientes({});
      setTranscript('');
    }

    if (regexGuardar.test(textoLimpio)) {
      ExpoSpeechRecognitionModule.stop();
      Alert.alert("💾 Sistema ATI-Dental", "¡Estado del odontograma guardado con éxito!");
    }
  };

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results[0]) {
      const resultadoTexto = event.results[0].transcript;
      setTranscript(resultadoTexto);
      procesarComandosDeVoz(resultadoTexto);
    }
  });

  useEffect(() => {
    async function checkPermissions() {
      const response = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setHasPermission(response.granted);
    }
    checkPermissions();
  }, []);

  const startListening = async () => {
    setTranscript('');
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: true,
        continuous: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Se requieren permisos de micrófono.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Dictado Clínico Inteligente</Text>

        <Text style={styles.sectionLabel}>Odontograma en Tiempo Real</Text>
        <View style={styles.gridOdontograma}>
          {DIENTES_INICIALES.map((num) => {
            const estado = dientes[num] || 'normal';
            return (
              <View
                key={num}
                style={[
                  styles.dienteBox,
                  estado === 'caries' && styles.dienteCaries,
                  estado === 'sano' && styles.dienteSano
                ]}
              >
                <Text style={[styles.dienteTexto, estado !== 'normal' && styles.textoIluminado]}>
                  {num}
                </Text>
                <Text style={styles.dienteSubtexto}>
                  {estado === 'caries' ? '🔴' : estado === 'sano' ? '🔵' : '⚪'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          {!recognizing ? (
            <Button title="🎙️ Activar Reconocimiento" onPress={startListening} color="#208AEF" />
          ) : (
            <Button title="🛑 Detener Micrófono" onPress={() => ExpoSpeechRecognitionModule.stop()} color="#FF3B30" />
          )}

          {recognizing && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#208AEF" />
              <Text style={styles.listeningText}>Diga comandos: "Diente 14 caries", "Limpiar" o "Guardar"</Text>
            </View>
          )}
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Audio capturado actualmente:</Text>
          <Text style={styles.resultText}>
            {transcript || 'Esperando comandos de voz nativos...'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40, // Espacio extra al final para que Android no corte la última tarjeta
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8'
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#0A2540', marginTop: 10 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10, textTransform: 'uppercase' },
  gridOdontograma: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1E6F8'
  },
  dienteBox: {
    width: 50,
    height: 60,
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B9DAF6'
  },
  dienteCaries: { backgroundColor: '#FFD3D3', borderColor: '#FF3B30' },
  dienteSano: { backgroundColor: '#D1E7DD', borderColor: '#0F5132' },
  dienteTexto: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dienteSubtexto: { fontSize: 10, marginTop: 2 },
  textoIluminado: { color: '#000' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 20, elevation: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'center' },
  listeningText: { marginLeft: 8, color: '#208AEF', fontSize: 12, fontWeight: '600', textAlign: 'center', flex: 1 },
  resultBox: { padding: 16, backgroundColor: '#FFF', borderRadius: 16, minHeight: 100, borderLeftWidth: 4, borderLeftColor: '#208AEF' },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  resultText: { fontSize: 15, color: '#333', fontStyle: 'italic' }, // Corregido: fontStyle en vez de italic
  errorText: { textAlign: 'center', color: '#FF3B30', fontSize: 16 }
});