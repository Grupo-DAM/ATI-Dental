import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ParsedVoiceCommand } from '@/utils/dental-voice-parser';

interface VoiceDictationBarProps {
  isListening: boolean;
  transcript: string;
  lastCommand: ParsedVoiceCommand | null;
  permissionError: string | null;
  onToggleListening?: () => void;
}

export function VoiceDictationBar({
  isListening,
  transcript,
  lastCommand,
  permissionError,
  onToggleListening,
}: Readonly<VoiceDictationBarProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Si no está escuchando, ni hay errores ni último comando, no mostramos nada
  if (!isListening && !lastCommand && !permissionError) {
    return null;
  }

  return (
    <View style={styles.container}>
    {/* Indicador de Escuchando con botón Detener */}
    {isListening && (
      <View style={[styles.listeningRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={theme.alert} />
          <Text style={styles.listeningText}>Escuchando...</Text>
        </View>
        {onToggleListening && (
          <TouchableOpacity
            onPress={onToggleListening}
            style={{
              backgroundColor: theme.alert,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="stop" size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Detener</Text>
          </TouchableOpacity>
        )}
      </View>
    )}

      {/* Alerta de permisos denegados */}
      {permissionError && (
        <View style={styles.errorBanner} testID="voice-permission-error">
          <Ionicons name="alert-circle-outline" size={16} color={theme.alert} />
          <Text style={styles.errorText}>{permissionError}</Text>
        </View>
      )}

      {/* Transcripción en vivo */}
      {isListening && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>Audio detectado:</Text>
          <Text style={styles.transcriptText} testID="voice-live-transcript">
            {transcript || 'Diga por ejemplo: "Diente 18 caries" o "24 endodoncia"'}
          </Text>
        </View>
      )}

      {/* Feedback del comando procesado */}
      {lastCommand && (
        <View
          testID="voice-feedback-banner"
          style={[
            styles.feedbackBanner,
            { borderColor: lastCommand.success ? theme.positive : theme.alert },
          ]}
        >
          <Ionicons
            name={lastCommand.success ? 'checkmark-circle' : 'warning'}
            size={18}
            color={lastCommand.success ? theme.positive : theme.alert}
          />
          <Text
            style={[
              styles.feedbackText,
              { color: lastCommand.success ? theme.positive : theme.alert },
            ]}
          >
            {lastCommand.feedbackMessage}
          </Text>
        </View>
      )}

        {/* Hint / Guía para el usuario */}
        {isListening && (
          <View style={styles.hintCard}>
            <View style={styles.hintHeader}>
              <Ionicons name="bulb-outline" size={16} color={theme.main} />
              <Text style={styles.hintTitle}>¿Cómo dictar el comando?</Text>
            </View>
            <Text style={styles.hintFormula}>
              Estructura: <Text style={styles.hintBold}>Diente [número] [estado] [cara opcional]</Text>
            </Text>
            <View style={styles.hintExamples}>
              <Text style={styles.hintExample}>• "Diente 18 caries"</Text>
              <Text style={styles.hintExample}>• "Pieza 24 endodoncia"</Text>
              <Text style={styles.hintExample}>• "16 obturado oclusal"</Text>
              <Text style={styles.hintExample}>• "Diente 31 sano" (para limpiar)</Text>
            </View>
          </View>
        )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.cardSeparator,
      gap: 8,
    },
    listeningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
    },
    listeningText: {
      color: theme.alert,
      fontSize: 12,
      fontWeight: '600',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.errorBackground,
      padding: 10,
      borderRadius: 8,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      flex: 1,
    },
    transcriptBox: {
      backgroundColor: theme.backgroundSecondary,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    transcriptLabel: {
      fontSize: 10,
      color: theme.pageSubtitle,
      fontWeight: '600',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    transcriptText: {
      fontSize: 13,
      color: theme.text,
      fontStyle: 'italic',
    },
    feedbackBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.backgroundSecondary,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    feedbackText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    hintCard: {
          backgroundColor: theme.accentBackground || theme.backgroundElement,
          borderColor: theme.cardSeparator,
          borderWidth: 1,
          borderRadius: 10,
          padding: 10,
          gap: 4,
        },
        hintHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        hintTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.main,
        },
        hintFormula: {
          fontSize: 12,
          color: theme.textSecondary,
          marginTop: 2,
        },
        hintBold: {
          fontWeight: '700',
          color: theme.pageTitle || theme.main,
        },
        hintExamples: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 4,
        },
        hintExample: {
          fontSize: 11,
          color: theme.textSecondary,
          backgroundColor: theme.backgroundElement,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          borderWidth: 0.5,
          borderColor: theme.cardSeparator,
        },
  });