import { renderHook, act } from '@testing-library/react-native';

const listeners: Record<string, Function> = {};

const mockModule = {
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockReturnValue(undefined),
};

jest.mock('@jamsch/expo-speech-recognition', () => ({
  __esModule: true,
  ExpoSpeechRecognitionModule: mockModule,
  useSpeechRecognitionEvent: (event: string, cb: Function) => {
    listeners[event] = cb;
  },
}));

import { useDentalVoice } from '@/hooks/use-dental-voice';

describe('useDentalVoice Native Module Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ejecuta llamadas nativas y listeners de SpeechRecognition', async () => {
    const onRecognized = jest.fn();
    const { result } = renderHook(() =>
      useDentalVoice({ onCommandRecognized: onRecognized, speechModule: mockModule })
    );

    // Esperar inicialización de permisos
    await act(async () => {
      await Promise.resolve();
    });

    // Iniciar con módulo nativo presente
    await act(async () => {
      await result.current.startListening();
    });
    expect(mockModule.start).toHaveBeenCalled();

    // Detener con módulo nativo presente
    act(() => {
      result.current.stopListening();
    });
    expect(mockModule.stop).toHaveBeenCalled();

    // Disparar listeners registrados
    act(() => {
      if (listeners['start']) listeners['start']();
      if (listeners['result']) {
        listeners['result']({
          results: [{ transcript: 'Diente 18 caries' }],
        });
      }
      if (listeners['error']) {
        listeners['error']({ error: 'test-error' });
      }
      if (listeners['end']) listeners['end']();
    });

    expect(onRecognized).toHaveBeenCalled();
  });

  it('maneja el caso de permisos denegados', async () => {
    const deniedModule = {
      getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
      requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockReturnValue(undefined),
    };

    const { result } = renderHook(() => useDentalVoice({ speechModule: deniedModule }));

    // Esperar inicialización de permisos
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.isListening).toBe(false);
  });
});