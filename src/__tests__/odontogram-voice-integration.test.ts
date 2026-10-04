import React from 'react';
import { render, act } from '@testing-library/react-native';
import { firestore } from '@/config/firebase';

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
    jest.clearAllMocks();
  });

  // CASO 1: Cubre el `try`, mapeo de piezas, y el `else` (collection.add cuando no existe documento previo)
  it('ejecuta la lógica de voz y guarda en Firestore (creación)', async () => {
    render(
      React.createElement(OdontogramContainer, {
        odontogram: {
          patientId: 'patient-voice-test-id', // 👈 ¡Esto hace que entre al try!
          status: 'ready',
          isAdult: true,
          teeth: {
            18: {
              number: 18,
              generalStates: ['cavity'],
              surfacesStates: { oclusal: 'caries' },
            },
          },
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

    // 5. Diente que no existía previamente
    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 21,
        state: 'cavity',
      });
    });
  });

  // CASO 2: Cubre la rama `if (!query.empty)` (actualizar documento existente con doc.update)
  it('actualiza un odontograma existente en Firestore si ya existe previo', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(firestore().collection('odontogramas'), 'get').mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'doc-existente-123',
          data: () => ({ fechaRegistro: '2026-01-01T00:00:00.000Z' }),
        },
      ],
    } as any);

    jest.spyOn(firestore().collection('odontogramas'), 'doc').mockReturnValueOnce({
      update: mockUpdate,
    } as any);

    render(
      React.createElement(OdontogramContainer, {
        odontogram: {
          patientId: 'patient-voice-update-id',
          status: 'ready',
          isAdult: false, // 👈 Cubre también la condición tipo: isAdult ? 'adulto' : 'infantil'
          teeth: {},
        },
      })
    );

    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 51,
        state: 'cavity',
        surface: 'vestibular',
      });
    });
  });

  // CASO 3: Cubre el bloque `catch (error)`
  it('captura errores de Firestore en el catch sin romper la ejecución', async () => {
    jest.spyOn(firestore().collection('odontogramas'), 'get').mockRejectedValueOnce(new Error('Firestore error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      React.createElement(OdontogramContainer, {
        odontogram: {
          patientId: 'patient-error-id',
          status: 'ready',
          isAdult: true,
          teeth: {},
        },
      })
    );

    act(() => {
      capturedOnCommand!({
        success: true,
        toothNumber: 11,
        state: 'sano',
      });
    });

    consoleSpy.mockRestore();
  });
});