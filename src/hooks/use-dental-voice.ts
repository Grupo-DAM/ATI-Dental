import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { parseDentalVoiceCommand, ParsedVoiceCommand } from '@/utils/dental-voice-parser';

let SpeechModule: any = null;
let useSpeechEvent: any = () => {};

try {
  const speechPkg = require('@jamsch/expo-speech-recognition');
  SpeechModule = speechPkg.ExpoSpeechRecognitionModule || speechPkg.default?.ExpoSpeechRecognitionModule;
  useSpeechEvent = speechPkg.useSpeechRecognitionEvent || speechPkg.default?.useSpeechRecognitionEvent;
} catch {
  // Fallback seguro para entorno de testing o plataformas no soportadas
}

interface UseDentalVoiceProps {
  isAdult?: boolean;
  onCommandRecognized?: (command: ParsedVoiceCommand) => void;
  inactivityTimeoutMs?: number;
  speechModule?: any;
}

export function useDentalVoice({
  isAdult = true,
  onCommandRecognized,
  inactivityTimeoutMs = 6000,
  speechModule = SpeechModule,
}: UseDentalVoiceProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      // Escenario 5: Pausa o detención por tiempo límite de inactividad
      stopListening();
    }, inactivityTimeoutMs);
  }, [inactivityTimeoutMs]);

  const processTranscription = useCallback(
    (text: string) => {
      setTranscript(text);
      resetSilenceTimer();

      const parsed = parseDentalVoiceCommand(text, isAdult);
      setLastCommand(parsed);

      if (parsed.success && onCommandRecognized) {
        onCommandRecognized(parsed);
      }
    },
    [isAdult, onCommandRecognized, resetSilenceTimer]
  );

  // Eventos de Speech Recognition nativos
  if (useSpeechEvent) {
    useSpeechEvent('start', () => setIsListening(true));
    useSpeechEvent('end', () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    });
    useSpeechEvent('result', (event: any) => {
      if (event?.results && event.results[0]) {
        processTranscription(event.results[0].transcript);
      }
    });
    useSpeechEvent('error', (event: any) => {
      console.warn('[useDentalVoice] Error en reconocimiento:', event);
      setIsListening(false);
    });
  }

  // Verificar permisos iniciales
  useEffect(() => {
    async function checkPermission() {
      if (!speechModule) return;
      try {
        const res = await speechModule.getPermissionsAsync();
        setHasPermission(res?.granted ?? false);
      } catch {
        setHasPermission(false);
      }
    }
    void checkPermission();

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [speechModule]);

  const requestPermission = async (): Promise<boolean> => {
    if (!speechModule) return false;
    try {
      const res = await speechModule.requestPermissionsAsync();
      const granted = res?.granted ?? false;
      setHasPermission(granted);
      if (!granted) {
        setPermissionError('La función de voz requiere permisos de acceso al micrófono.');
      } else {
        setPermissionError(null);
      }
      return granted;
    } catch {
      setHasPermission(false);
      setPermissionError('No se pudo solicitar permisos de audio en este dispositivo.');
      return false;
    }
  };

  const startListening = async () => {
    setTranscript('');
    setLastCommand(null);

    // Escenario 4: Verificar permisos antes de activar el micrófono en dispositivo real
    if (speechModule) {
      let granted = hasPermission;
      if (!granted) {
        granted = await requestPermission();
        if (!granted) return;
      }

      try {
        await speechModule.start({
          lang: 'es-ES',
          interimResults: true,
          continuous: true,
        });
        setIsListening(true);
        resetSilenceTimer();
      } catch (err: any) {
        console.error('[useDentalVoice] No se pudo iniciar el dictado:', err);
      }
    } else {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (speechModule) {
      try {
        speechModule.stop();
      } catch {}
    }
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      void startListening();
    }
  };

  // Método de simulación para pruebas manuales o emulador
  const simulateCommand = (simulatedText: string) => {
    processTranscription(simulatedText);
  };

  return {
    isListening,
    transcript,
    lastCommand,
    hasPermission,
    permissionError,
    startListening,
    stopListening,
    toggleListening,
    simulateCommand,
  };
}