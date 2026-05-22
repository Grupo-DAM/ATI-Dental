import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from '@jamsch/expo-speech-recognition';

// Lista de dientes simulados para la PoC (puedes añadir más números de la nomenclatura dental)
const DIENTES_INICIALES = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28];

interface EstadoDientes {
  [key: number]: 'sano' | 'caries' | 'normal';
}

export default function SpeechToTextPoC() {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  // Estado para controlar la reacción visual de los dientes
  const [dientes, setDientes] = useState<EstadoDientes>({});

  // EXPRESIONES REGULARES PARA LOS COMANDOS
  // Captura: "diente o pieza [número] [estado]" -> Ej: "diente 14 caries" o "pieza 22 sano"
  const regexDiente = /(?:diente|pieza)\s+(\d{2})\s+(caries|sano)/i;
  const regexGuardar = /\b(guardar|salvar)\b/i;
  const regexLimpiar = /\b(limpiar|reiniciar|resetear)\b/i;

  // Lógica para procesar el texto en tiempo real buscando comandos
  const procesarComandosDeVoz = (texto: string) => {
    const textoLimpio = texto.toLowerCase().trim();

    // COMANDO 1: "Diente [Número] [Estado]"
    const matchDiente = textoLimpio.match(regexDiente);
    if (matchDiente) {
      const numeroDiente = parseInt(matchDiente[1], 10);
      const estadoDiente = matchDiente[2] as 'caries' | 'sano';

      if (DIENTES_INICIALES.includes(numeroDiente)) {
        setDientes(prev => ({ ...prev, [numeroDiente]: estadoDiente }));
      }
    }

    // "Limpiar"
    if (regexLimpiar.test(textoLimpio)) {
      setDientes({});
      setTranscript('');
    }

    if (regexGuardar.test(textoLimpio)) {
      // Detenemos el micrófono para que el alert no interrumpa la escucha de fondo
      ExpoSpeechRecognitionModule.stop();
      Alert.alert("💾 Sistema ATI-Dental", "¡Estado del odontograma guardado con éxito!");
    }
  };

  // Eventos del Reconocimiento de Voz
  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results[0]) {
      const resultadoTexto = event.results[0].transcript;
      setTranscript(resultadoTexto);

      // Ejecutar el motor de expresiones regulares con cada palabra procesada
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
        interimResults: true, // Crucial para que procese el comando MIENTRAS el usuario habla
        continuous: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Se requieren permisos de micrófono.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dictado Clínico Inteligente</Text>

      {/* GRÁFICO REACTIVO DEL ODONTOGRAMA SIMULADO */}
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

      {/* PANEL DE CONTROL */}
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

      {/* TEXTO DE TRANSCRIPCIÓN ACTUAL */}
      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>Audio capturado actualmente:</Text>
        <Text style={styles.resultText}>
          {transcript || 'Esperando comandos de voz nativos...'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F0F4F8' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#0A2540' },
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
  resultText: { fontSize: 15, color: '#333', italic: true } as any,
  errorText: { textAlign: 'center', color: '#FF3B30', fontSize: 16 }
});
