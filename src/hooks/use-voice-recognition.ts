import { useCallback, useRef, useState } from 'react';

export interface VoiceRecognitionState {
  /** Texto transcrito por el reconocimiento de voz */
  transcript: string;
  /** Indica si el micrófono está activo escuchando */
  isListening: boolean;
  /** Mensaje de error si algo falla */
  error: string | null;
}

export interface VoiceRecognitionActions {
  /** Inicia la escucha del micrófono */
  startListening: () => void;
  /** Detiene la escucha del micrófono */
  stopListening: () => void;
  /** Inyecta un transcript manualmente (útil para desarrollo y pruebas E2E) */
  injectTranscript: (text: string) => void;
  /** Reinicia el estado del hook */
  reset: () => void;
}

export type UseVoiceRecognitionReturn = VoiceRecognitionState & VoiceRecognitionActions;

/**
 * Hook personalizado que encapsula el servicio de reconocimiento de voz.
 *
 * En esta versión PoC, simula el reconocimiento con un retardo breve.
 * En producción, se conectará a una librería real de speech-to-text
 * como `expo-speech` o `@react-native-voice/voice`.
 */
export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startListening = useCallback(() => {
    setError(null);
    setIsListening(true);

    // Simulación: en producción, aquí se conectaría al servicio real de STT.
    // Por ahora, simplemente permanece en estado "escuchando" hasta que se
    // detenga manualmente o se inyecte un transcript.
    timeoutRef.current = setTimeout(() => {
      // Timeout de seguridad: detener después de 30 segundos sin resultado.
      setIsListening(false);
      setError('Tiempo de espera agotado. No se detectó voz.');
    }, 30000);
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsListening(false);
  }, []);

  const injectTranscript = useCallback((text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTranscript(text);
    setIsListening(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTranscript('');
    setIsListening(false);
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    injectTranscript,
    reset,
  };
}
