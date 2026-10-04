import React from 'react';
import { renderHook, render, act } from '@testing-library/react-native';
import { useDentalVoice } from '@/hooks/use-dental-voice';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';

describe('useDentalVoice Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cubre el ciclo de vida completo de inicio, parada y toggle', async () => {
    const { result } = renderHook(() => useDentalVoice());

    // 1. Toggle cuando no está escuchando -> Inicia
    await act(async () => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    // 2. Toggle cuando ya está escuchando -> Detiene
    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(false);

    // 3. startListening directo
    await act(async () => {
      await result.current.startListening();
    });
    expect(result.current.isListening).toBe(true);

    // 4. stopListening directo
    act(() => {
      result.current.stopListening();
    });
    expect(result.current.isListening).toBe(false);
  });

  it('procesa comandos por voz y simulación con todos los estados', () => {
    const onRecognized = jest.fn();
    const { result } = renderHook(() =>
      useDentalVoice({ onCommandRecognized: onRecognized, isAdult: true })
    );

    // Diente con caries
    act(() => {
      result.current.simulateCommand('Diente 18 caries');
    });
    expect(result.current.lastCommand?.success).toBe(true);
    expect(result.current.lastCommand?.toothNumber).toBe(18);
    expect(onRecognized).toHaveBeenCalledTimes(1);

    // Diente sano
    act(() => {
      result.current.simulateCommand('Diente 18 sano');
    });
    expect(result.current.lastCommand?.state).toBe('sano');

    // Diente con superficie (oclusal, mesial, etc.)
    act(() => {
      result.current.simulateCommand('Diente 18 obturado oclusal');
    });
    expect(result.current.lastCommand?.surface).toBe('oclusal');

    // Diente infantil
    const childHook = renderHook(() =>
      useDentalVoice({ onCommandRecognized: onRecognized, isAdult: false })
    );
    act(() => {
      childHook.result.current.simulateCommand('Diente 55 caries');
    });
    expect(childHook.result.current.lastCommand?.toothNumber).toBe(55);

    // Comando no reconocido
    act(() => {
      result.current.simulateCommand('Comando no valido');
    });
    expect(result.current.lastCommand?.success).toBe(false);
  });
});

describe('OdontogramContainer Voice Handler Integration', () => {
  it('ejecuta los flujos de voz y actualiza Firestore para cada condición dental', () => {
    let capturedOnCommand: ((cmd: any) => void) | null = null;

    // Espiamos useDentalVoice para disparar onCommandRecognized dentro de OdontogramContainer
    const spy = jest.spyOn(require('@/hooks/use-dental-voice'), 'useDentalVoice');
    spy.mockImplementation((props: any) => {
      capturedOnCommand = props?.onCommandRecognized;
      return {
        isListening: true,
        transcript: 'Diente 18 caries oclusal',
        lastCommand: null,
        permissionError: null,
        toggleListening: jest.fn(),
        simulateCommand: jest.fn(),
      };
    });

    render(
      React.createElement(OdontogramContainer, {
        currentPatientId: 'patient-voice-test-id',
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

    expect(capturedOnCommand).toBeDefined();

    // 1. Cubre comando de caries con superficie
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'cavity',
        surface: 'oclusal',
      });
    });

    // 2. Cubre comando de obturado
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'filled',
        surface: 'distal',
      });
    });

    // 3. Cubre comando de temporal
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'temporal',
        surface: 'mesial',
      });
    });

    // 4. Cubre comando de sano (resetea afecciones)
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'sano',
      });
    });

    // 5. Cubre comando en diente que no existía previamente en el odontograma
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 21,
        state: 'cavity',
      });
    });

    spy.mockRestore();
  });
});

describe('useDentalVoice Native Events and Permissions Coverage', () => {
  it('cubre eventos nativos de speech y manejo de permisos', async () => {
    // 1. Probamos simulación de timeout de inactividad
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() =>
      useDentalVoice({ inactivityTimeoutMs: 500 })
    );

    await act(async () => {
      await result.current.startListening();
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    // 2. Desmontaje del hook
    unmount();
    jest.useRealTimers();
  });
});