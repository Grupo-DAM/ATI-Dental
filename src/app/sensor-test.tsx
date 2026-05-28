import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const DEFAULT_DATA: AccelerometerMeasurement = { x: 0, y: 0, z: 0, timestamp: 0 };
const UPDATE_INTERVAL_MS = 100;

export default function SensorTestScreen() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const stopListening = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setErrorMessage(null);

    if (isAvailable === false) {
      setErrorMessage('El acelerómetro no está disponible en este dispositivo o navegador.');
      return;
    }

    try {
      const permission = await Accelerometer.requestPermissionsAsync();
      setPermissionStatus(permission.status);

      if (!permission.granted) {
        setErrorMessage(
          Platform.OS === 'web'
            ? 'Permiso denegado. En web suele hacer falta HTTPS y activar Motion & Orientation en Safari.'
            : 'Permiso denegado para acceder al acelerómetro.',
        );
        return;
      }

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscriptionRef.current = Accelerometer.addListener(setData);
      setIsListening(true);
    } catch {
      setErrorMessage('No se pudo iniciar la lectura del acelerómetro.');
    }
  }, [isAvailable]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!cancelled) {
          setIsAvailable(available);
          if (!available) {
            setErrorMessage('Sensor no disponible en esta plataforma.');
          }
        }
      } catch {
        if (!cancelled) {
          setIsAvailable(false);
          setErrorMessage('No se pudo comprobar la disponibilidad del sensor.');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopListening();
    };
  }, [stopListening]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="subtitle">SensorTest (Spike)</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Pantalla aislada para validar expo-sensors con el acelerómetro. Inclina o mueve el
            dispositivo y comprueba que x, y y z cambian en tiempo real.
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Estado</ThemedText>
            <ThemedText type="small">Plataforma: {Platform.OS}</ThemedText>
            <ThemedText type="small">
              Disponible: {isAvailable === null ? 'comprobando…' : isAvailable ? 'sí' : 'no'}
            </ThemedText>
            <ThemedText type="small">Permiso: {permissionStatus}</ThemedText>
            <ThemedText type="small">Escuchando: {isListening ? 'sí' : 'no'}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Acelerómetro (g)</ThemedText>
            <ThemedText type="code">x: {data.x.toFixed(4)}</ThemedText>
            <ThemedText type="code">y: {data.y.toFixed(4)}</ThemedText>
            <ThemedText type="code">z: {data.z.toFixed(4)}</ThemedText>
          </ThemedView>

          {errorMessage ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Aviso</ThemedText>
              <ThemedText type="small">{errorMessage}</ThemedText>
            </ThemedView>
          ) : null}

          <Pressable
            onPress={isListening ? stopListening : startListening}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <ThemedView type="backgroundSelected" style={styles.buttonInner}>
              <ThemedText type="smallBold">
                {isListening ? 'Detener medición' : 'Iniciar medición'}
              </ThemedText>
            </ThemedView>
          </Pressable>

          {Platform.OS === 'web' ? (
            <ThemedText themeColor="textSecondary" type="small">
              En web, el permiso solo se puede pedir tras un clic. En Chrome DevTools puedes
              simular orientación en More tools → Sensors.
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    alignSelf: 'stretch',
  },
  buttonInner: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
