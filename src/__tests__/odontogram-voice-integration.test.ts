import React from 'react';
import { render, act } from '@testing-library/react-native';

let capturedOnCommand: ((cmd: any) => void) | null = null;

jest.mock('@/hooks/use-dental-voice', () => ({
  useDentalVoice: (props: any) => {
    if (props?.onCommandRecognized) {
      capturedOnCommand = props.onCommandRecognized;
    }
    return {
      isListening: true,
      transcript: 'Diente 18 caries oclusal',
      lastCommand: null,
      permissionError: null,
      toggleListening: jest.fn(),
      simulateCommand: jest.fn(),
    };
  },
}));

import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';

describe('OdontogramContainer Voice Full Integration', () => {
  beforeEach(() => {
    capturedOnCommand = null;
  });

  it('ejecuta la lógica de voz para caries, obturado, temporal y sano', () => {
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

    // 1. Caries con superficie
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'cavity',
        surface: 'oclusal',
      });
    });

    // 2. Obturado con superficie
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'filled',
        surface: 'distal',
      });
    });

    // 3. Temporal con superficie
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'temporal',
        surface: 'mesial',
      });
    });

    // 4. Diente sano (vaciado de afecciones)
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 18,
        state: 'sano',
      });
    });

    // 5. Diente que no existía previamente en el odontograma
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 21,
        state: 'cavity',
      });
    });
  });
});
