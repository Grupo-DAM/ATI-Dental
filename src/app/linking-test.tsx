import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Estructura de un log en la consola de diagnóstico
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function LinkingTestScreen({ onBack }: { onBack?: () => void }) {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  // Estados de entrada para el destinatario
  const [phone, setPhone] = useState('584120000000'); // Ejemplo sin el "+"
  const [message, setMessage] = useState(
    'Hola, te recordamos tu próxima cita de limpieza dental en ATI Dental. ¡Te esperamos!'
  );
  
  // Diagnóstico
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [whatsappSupported, setWhatsappSupported] = useState<boolean | null>(null);

  // Agregar un log en la consola de diagnóstico
  const addLog = (type: LogEntry['type'], msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: time, type, message: msg },
      ...prev,
    ]);
  };

  // Verificar la compatibilidad al iniciar
  useEffect(() => {
    addLog('info', `Spike iniciado en plataforma: ${Platform.OS.toUpperCase()}`);
    checkWhatsappSupport();
  }, []);

  const checkWhatsappSupport = async () => {
    try {
      const nativeUrl = 'whatsapp://send';
      addLog('info', `Ejecutando: Linking.canOpenURL('${nativeUrl}')`);
      const supported = await Linking.canOpenURL(nativeUrl);
      setWhatsappSupported(supported);
      if (supported) {
        addLog('success', 'El esquema whatsapp:// es soportado en este dispositivo.');
      } else {
        addLog('warning', 'Linking.canOpenURL devolvió false. Esto ocurre si WhatsApp no está instalado, o en simuladores / iOS sin whitelist.');
      }
    } catch (error: any) {
      addLog('error', `Error al validar canOpenURL: ${error?.message || error}`);
      setWhatsappSupported(false);
    }
  };

  // 1. Llamar por teléfono (tel:)
  const handleCall = async () => {
    const telUrl = `tel:${phone.trim()}`;
    addLog('info', `Intentando abrir llamada: ${telUrl}`);
    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      addLog('info', `Resultado canOpenURL('tel:'): ${canOpen}`);
      
      // En simuladores iOS, tel:// puede fallar. Intentamos abrir directamente.
      await Linking.openURL(telUrl);
      addLog('success', `Llamada iniciada con éxito a: ${phone}`);
    } catch (error: any) {
      addLog('error', `Fallo al iniciar llamada: ${error?.message || error}`);
    }
  };

  // 2. WhatsApp Nativo (whatsapp://)
  const handleWhatsappNative = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message);
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    
    addLog('info', `Intentando abrir WhatsApp Nativo: whatsapp://send`);
    try {
      await Linking.openURL(nativeUrl);
      addLog('success', 'WhatsApp Nativo abierto con éxito.');
    } catch (error: any) {
      addLog('error', `WhatsApp Nativo falló: ${error?.message || error}`);
    }
  };

  // 3. WhatsApp Web/Universal Link (https://wa.me/)
  const handleWhatsappUniversal = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message);
    const universalUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    addLog('info', `Intentando abrir Universal Link: ${universalUrl}`);
    try {
      await Linking.openURL(universalUrl);
      addLog('success', 'Enlace universal de WhatsApp abierto en navegador/app con éxito.');
    } catch (error: any) {
      addLog('error', `Enlace universal falló: ${error?.message || error}`);
    }
  };

  // 4. WhatsApp Inteligente (Auto-Fallback)
  const handleWhatsappSmart = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(message);
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    const universalUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    addLog('info', 'Iniciando flujo Inteligente (Auto-Fallback)...');
    try {
      // Intentamos verificar soporte nativo
      const isNativeSupported = await Linking.canOpenURL('whatsapp://send');
      
      if (isNativeSupported) {
        addLog('info', 'WhatsApp nativo reporta soporte. Abriendo esquema nativo...');
        await Linking.openURL(nativeUrl);
        addLog('success', 'Abierto vía WhatsApp Nativo.');
      } else {
        addLog('warning', 'WhatsApp nativo no soportado/detectado. Redirigiendo a enlace universal...');
        await Linking.openURL(universalUrl);
        addLog('success', 'Redirigido a Enlace Universal.');
      }
    } catch (error: any) {
      addLog('warning', `El flujo nativo arrojó error: "${error?.message || error}". Aplicando fallback universal...`);
      try {
        await Linking.openURL(universalUrl);
        addLog('success', 'Fallback ejecutado con éxito vía enlace universal.');
      } catch (fallbackError: any) {
        addLog('error', `Ambos métodos fallaron. Error fallback: ${fallbackError?.message || fallbackError}`);
      }
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, {
        paddingTop: Platform.OS === 'web' ? Spacing.five : insets.top,
        paddingBottom: insets.bottom,
      }]}
    >
      <ThemedView style={styles.container}>
        
        {/* Botón de volver */}
        {onBack && (
          <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.card}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor="#3c87f7"
                size={18}
              />
              <ThemedText type="linkPrimary" style={styles.backButtonText}>
                Volver al Inicio
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}
        
        {/* Cabecera del Spike */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.header}>
            <View style={styles.headerTitleRow}>
              <SymbolView
                name={{ ios: 'link', android: 'link', web: 'link' }}
                tintColor="#3c87f7"
                size={22}
              />
              <ThemedText type="subtitle" style={styles.headerTitle}>
                Spike: Deep Linking
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.headerDesc}>
              Prueba de concepto de comunicación utilizando la librería <ThemedText type="smallBold">expo-linking</ThemedText> de Expo SDK 55. Evaluamos compatibilidad y fallbacks seguros.
            </ThemedText>
          </ThemedView>
        </Animated.View>

        {/* Ficha Simulada del Paciente */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.patientCard}>
            <View style={styles.patientBadgeContainer}>
              <ThemedView type="backgroundSelected" style={styles.patientBadge}>
                <ThemedText type="code" style={styles.patientBadgeText}>
                  SIMULACIÓN PACIENTE
                </ThemedText>
              </ThemedView>
            </View>

            <View style={styles.patientInfoRow}>
              <SymbolView
                name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'person' }}
                tintColor={theme.text}
                size={48}
              />
              <View style={styles.patientNameDetails}>
                <ThemedText type="default" style={styles.patientName}>
                  Juan Pérez (Paciente Activo)
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ID Paciente: #ATI-99482
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Inputs de Configuración del Destinatario */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>
                Número Telefónico (Formato Internacional sin +):
              </ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Ej. 584120000000"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, {
                  color: theme.text,
                  backgroundColor: theme.backgroundSelected,
                  borderColor: theme.backgroundSelected,
                }]}
              />
              <ThemedText type="code" style={styles.inputTip}>
                Tip: Debe incluir el código de país. WhatsApp wa.me no admite el signo "+".
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>
                Mensaje de Recordatorio:
              </ThemedText>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                placeholder="Escribe el mensaje aquí..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, styles.textArea, {
                  color: theme.text,
                  backgroundColor: theme.backgroundSelected,
                  borderColor: theme.backgroundSelected,
                }]}
              />
            </View>
          </ThemedView>
        </Animated.View>

        {/* Acciones del Spike */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.actionsPanel}>
            <ThemedText type="smallBold" style={styles.panelTitle}>
              Ejecutar Acciones de Enlace
            </ThemedText>

            {/* Botón de Llamar */}
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [
                styles.actionButton,
                styles.callBtn,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'phone.fill', android: 'phone', web: 'phone' }}
                tintColor="#ffffff"
                size={16}
              />
              <ThemedText type="smallBold" style={styles.actionBtnText}>
                Llamar Paciente (tel:)
              </ThemedText>
            </Pressable>

            {/* Fila de Botones Específicos de WhatsApp */}
            <View style={styles.rowButtons}>
              <Pressable
                onPress={handleWhatsappNative}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.whatsappNativeBtn,
                  pressed && styles.pressed,
                  { flex: 1 },
                ]}
              >
                <SymbolView
                  name={{ ios: 'app.badge.fill', android: 'apps', web: 'chat' }}
                  tintColor="#ffffff"
                  size={14}
                />
                <ThemedText type="code" style={styles.actionBtnTextSmall}>
                  WA Nativo (Scheme)
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleWhatsappUniversal}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.whatsappWebBtn,
                  pressed && styles.pressed,
                  { flex: 1 },
                ]}
              >
                <SymbolView
                  name={{ ios: 'globe', android: 'public', web: 'public' }}
                  tintColor="#ffffff"
                  size={14}
                />
                <ThemedText type="code" style={styles.actionBtnTextSmall}>
                  WA Web (Universal)
                </ThemedText>
              </Pressable>
            </View>

            {/* Botón WhatsApp Inteligente / Recomendado */}
            <Pressable
              onPress={handleWhatsappSmart}
              style={({ pressed }) => [
                styles.actionButton,
                styles.whatsappSmartBtn,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'bolt.fill', android: 'bolt', web: 'offline_bolt' }}
                tintColor="#ffffff"
                size={18}
              />
              <ThemedText type="smallBold" style={styles.actionBtnText}>
                WhatsApp Inteligente (Auto-Fallback)
              </ThemedText>
            </Pressable>
            <ThemedText type="code" style={styles.smartBadgeText}>
              ⭐ RECOMENDADO: Prueba primero app nativa; redirige a web en caso de fallo.
            </ThemedText>
          </ThemedView>
        </Animated.View>

        {/* Consola de Diagnóstico */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.card}>
          <ThemedView type="backgroundElement" style={styles.diagnosticsPanel}>
            <View style={styles.diagnosticsHeader}>
              <View style={styles.diagnosticsTitleRow}>
                <SymbolView
                  name={{ ios: 'cpu', android: 'memory', web: 'developer_board' }}
                  tintColor={theme.text}
                  size={16}
                />
                <ThemedText type="smallBold">
                  Consola de Diagnóstico
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  setLogs([]);
                  addLog('info', 'Consola limpiada.');
                }}
                style={({ pressed }) => [
                  styles.clearLogsBtn,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText type="code" themeColor="textSecondary">
                  Limpiar Logs
                </ThemedText>
              </Pressable>
            </View>

            {/* Status Variables */}
            <View style={styles.statusBox}>
              <View style={styles.statusItem}>
                <ThemedText type="code" themeColor="textSecondary">canOpenURL('whatsapp://'):</ThemedText>
                <ThemedText
                  type="code"
                  style={{
                    color: whatsappSupported === true ? '#2ec4b6' : whatsappSupported === false ? '#e71d36' : '#ff9f1c',
                    marginLeft: 6
                  }}
                >
                  {whatsappSupported === null ? 'Validando...' : String(whatsappSupported)}
                </ThemedText>
              </View>
              <View style={styles.statusItem}>
                <ThemedText type="code" themeColor="textSecondary">Plataforma:</ThemedText>
                <ThemedText type="code" style={{ color: '#3c87f7', marginLeft: 6 }}>
                  {Platform.OS.toUpperCase()}
                </ThemedText>
              </View>
            </View>

            {/* Terminal de Logs */}
            <ThemedView type="backgroundSelected" style={styles.terminalContainer}>
              <ScrollView nestedScrollEnabled style={styles.terminalScroll}>
                {logs.length === 0 ? (
                  <ThemedText type="code" themeColor="textSecondary" style={styles.emptyLogs}>
                    Sin eventos. Haz clic en las acciones para registrar el diagnóstico.
                  </ThemedText>
                ) : (
                  logs.map((log) => {
                    let logColor = '#ffffff';
                    if (log.type === 'success') logColor = '#2ec4b6';
                    if (log.type === 'warning') logColor = '#ff9f1c';
                    if (log.type === 'error') logColor = '#e71d36';
                    if (log.type === 'info') logColor = theme.textSecondary;

                    return (
                      <View key={log.id} style={styles.logLine}>
                        <ThemedText type="code" style={styles.logTimestamp}>
                          [{log.timestamp}]
                        </ThemedText>
                        <ThemedText type="code" style={{ color: logColor, flex: 1 }}>
                          {' '}{log.message}
                        </ThemedText>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </ThemedView>
          </ThemedView>
        </Animated.View>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    gap: Spacing.four,
    paddingTop: Spacing.two,
  },
  card: {
    width: '100%',
  },
  header: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  headerDesc: {
    marginTop: Spacing.one,
  },
  patientCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  patientBadgeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  patientBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  patientBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  patientNameDetails: {
    flexDirection: 'column',
  },
  patientName: {
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#303035',
    marginVertical: Spacing.three,
    opacity: 0.2,
  },
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 12,
  },
  textInput: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputTip: {
    fontSize: 10,
    marginTop: 2,
  },
  actionsPanel: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  panelTitle: {
    fontSize: 14,
    marginBottom: Spacing.one,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  callBtn: {
    backgroundColor: '#3c87f7',
  },
  whatsappNativeBtn: {
    backgroundColor: '#128c7e',
  },
  whatsappWebBtn: {
    backgroundColor: '#075e54',
  },
  whatsappSmartBtn: {
    backgroundColor: '#25d366',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
  },
  actionBtnTextSmall: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  smartBadgeText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#25d366',
    fontWeight: 'bold',
    marginTop: -4,
  },
  pressed: {
    opacity: 0.8,
  },
  diagnosticsPanel: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagnosticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clearLogsBtn: {
    padding: Spacing.one,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalContainer: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    height: 150,
  },
  terminalScroll: {
    flex: 1,
  },
  logLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.half,
  },
  logTimestamp: {
    color: '#888888',
    fontSize: 11,
  },
  emptyLogs: {
    textAlign: 'center',
    marginTop: Spacing.five,
    fontSize: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
