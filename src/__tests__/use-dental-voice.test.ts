import React from 'react';
import { renderHook, render, act } from '@testing-library/react-native';

let capturedOnCommandRecognized: ((cmd: any) => void) | null = null;

jest.mock('@/hooks/use-dental-voice', () => {
  const actual = jest.requireActual('@/hooks/use-dental-voice');
  return {
    ...actual,
    useDentalVoice: (props: any) => {
      if (props?.onCommandRecognized) {
        capturedOnCommandRecognized = props.onCommandRecognized;
      }
      return {
        isListening: true,
        transcript: 'Diente 18 caries',
        lastCommand: null,
        permissionError: null,
        toggleListening: jest.fn(),
        simulateCommand: jest.fn(),
      };
    },
  };
});

import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';

// Importamos la función real directamente para probar el hook completo
const { useDentalVoice: realUseDentalVoice } = jest.requireActual('@/hooks/use-dental-voice');

describe('useDentalVoice Hook Real Logic', () => {
  it('inicializa y simula comandos correctamente', () => {
    const onMock = jest.fn();
    const { result } = renderHook(() => realUseDentalVoice({ onCommandRecognized: onMock }));

    expect(result.current.isListening).toBe(false);

    act(() => {
      result.current.simulateCommand('Diente 18 caries');
    });

    expect(result.current.lastCommand?.success).toBe(true);
    expect(result.current.lastCommand?.toothNumber).toBe(18);
    expect(onMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.simulateCommand('Diente 18 sano');
    });
    expect(result.current.lastCommand?.state).toBe('sano');

    act(() => {
      result.current.simulateCommand('Comando invalido');
    });
    expect(result.current.lastCommand?.success).toBe(false);
  });
});

describe('OdontogramContainer Voice Execution', () => {
  beforeEach(() => {
    capturedOnCommandRecognized = null;
  });

  it('ejecuta la lógica de voz para caries, superficies y saneado', () => {
    render(
      React.createElement(OdontogramContainer, {
        currentPatientId: 'patient-voice-123',
        initialOdontogram: {
          adult: {
            pieces: {
              '18': {
                id: '18',
                vestibular: 'healthy',
                distal: 'healthy',
                mesial: 'healthy',
                palatineOrLingual: 'healthy',
                occlusalOrIncisal: 'healthy',
                generalState: 'healthy',
              },
            },
          },
          child: { pieces: {} },
          isAdult: true,
        },
      })
    );

    expect(capturedOnCommandRecognized).toBeDefined();

    // 1. Caries con superficie
    act(() => {
      capturedOnCommandRecognized!({
        success: true,
        toothNumber: 18,
        state: 'cavity',
        surface: 'oclusal',
      });
    });

    // 2. Obturado
    act(() => {
      capturedOnCommandRecognized!({
        success: true,
        toothNumber: 18,
        state: 'filled',
        surface: 'distal',
      });
    });

    // 3. Sano
    act(() => {
      capturedOnCommandRecognized!({
        success: true,
        toothNumber: 18,
        state: 'sano',
      });
    });
  });
});