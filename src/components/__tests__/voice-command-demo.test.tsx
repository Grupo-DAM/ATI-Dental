import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';

import { VoiceCommandDemo, parseVoiceCommand } from '../voice-command-demo';

// ──────────────────────────────────────────────────────────────────
// Mock del hook useVoiceRecognition
// ──────────────────────────────────────────────────────────────────
// Reemplazamos el módulo completo del hook para controlar su comportamiento
// de forma determinista desde el test, sin depender de hardware real.

const mockStartListening = jest.fn();
const mockStopListening = jest.fn();
const mockInjectTranscript = jest.fn();
const mockReset = jest.fn();

let mockState = {
  transcript: '',
  isListening: false,
  error: null as string | null,
};

jest.mock('@/hooks/use-voice-recognition', () => ({
  useVoiceRecognition: () => ({
    ...mockState,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    injectTranscript: mockInjectTranscript,
    reset: mockReset,
  }),
}));

// ──────────────────────────────────────────────────────────────────
// Tests del parser de comandos de voz (Prueba Unitaria Pura)
// ──────────────────────────────────────────────────────────────────

describe('parseVoiceCommand', () => {
  it('parsea correctamente "Diente 14 caries"', () => {
    const result = parseVoiceCommand('Diente 14 caries');
    expect(result).toEqual({ tooth: '14', diagnosis: 'caries' });
  });

  it('parsea correctamente "diente 46 extracción" (case-insensitive)', () => {
    const result = parseVoiceCommand('diente 46 extracción');
    expect(result).toEqual({ tooth: '46', diagnosis: 'extracción' });
  });

  it('parsea diagnósticos con múltiples palabras', () => {
    const result = parseVoiceCommand('Diente 21 fractura parcial');
    expect(result).toEqual({ tooth: '21', diagnosis: 'fractura parcial' });
  });

  it('retorna null si el formato no coincide', () => {
    expect(parseVoiceCommand('mover diente')).toBeNull();
    expect(parseVoiceCommand('hola mundo')).toBeNull();
    expect(parseVoiceCommand('')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────
// Tests de integración del componente VoiceCommandDemo
// ──────────────────────────────────────────────────────────────────

describe('VoiceCommandDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reiniciar el estado del mock antes de cada test
    mockState = {
      transcript: '',
      isListening: false,
      error: null,
    };
  });

  it('renderiza el botón "Escuchar" inicialmente', () => {
    render(<VoiceCommandDemo />);
    expect(screen.getByText('Escuchar')).toBeTruthy();
  });

  it('llama a startListening al presionar "Escuchar"', () => {
    render(<VoiceCommandDemo />);

    fireEvent.press(screen.getByText('Escuchar'));

    expect(mockStartListening).toHaveBeenCalledTimes(1);
  });

  it('muestra "Detener" y el indicador de escucha cuando isListening es true', () => {
    mockState.isListening = true;

    render(<VoiceCommandDemo />);

    expect(screen.getByText('Detener')).toBeTruthy();
    expect(screen.getByText('🎙️ Escuchando...')).toBeTruthy();
  });

  it('llama a stopListening al presionar "Detener"', () => {
    mockState.isListening = true;

    render(<VoiceCommandDemo />);
    fireEvent.press(screen.getByText('Detener'));

    expect(mockStopListening).toHaveBeenCalledTimes(1);
  });

  // ────────────────────────────────────────────────────────────────
  // TEST CLAVE DE LA PoC: Simula el reconocimiento de voz completo
  // ────────────────────────────────────────────────────────────────
  it('muestra el diente y diagnóstico correctos cuando el transcript es "Diente 14 caries"', () => {
    // Simulamos que el hook de voz ya resolvió con el transcript
    mockState.transcript = 'Diente 14 caries';

    render(<VoiceCommandDemo />);

    // Verificamos que el componente parseó y muestra la información correcta
    expect(screen.getByText('Diente: 14')).toBeTruthy();
    expect(screen.getByText('Diagnóstico: caries')).toBeTruthy();
  });

  it('muestra el diente y diagnóstico correctos para "Diente 46 extracción"', () => {
    mockState.transcript = 'Diente 46 extracción';

    render(<VoiceCommandDemo />);

    expect(screen.getByText('Diente: 46')).toBeTruthy();
    expect(screen.getByText('Diagnóstico: extracción')).toBeTruthy();
  });

  it('muestra un mensaje de error cuando el hook reporta un error', () => {
    mockState.error = 'Tiempo de espera agotado. No se detectó voz.';

    render(<VoiceCommandDemo />);

    expect(screen.getByText('Tiempo de espera agotado. No se detectó voz.')).toBeTruthy();
  });

  it('no muestra resultados si el transcript no sigue el formato esperado', () => {
    mockState.transcript = 'hola mundo';

    render(<VoiceCommandDemo />);

    // El transcript se muestra tal cual
    expect(screen.getByText('hola mundo')).toBeTruthy();
    // Pero no se generan resultados de diente/diagnóstico
    expect(screen.queryByText(/Diente:/)).toBeNull();
    expect(screen.queryByText(/Diagnóstico:/)).toBeNull();
  });
});
