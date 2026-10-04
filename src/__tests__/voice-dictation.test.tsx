import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoiceDictationBar } from '@/components/clinical-history/VoiceDictationBar';

describe('US-15: VoiceDictationBar Component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('Escenario 1 & 5: Permite alternar la escucha al presionar el botón de dictado', () => {
      const { getByText } = render(
        <VoiceDictationBar
          isListening={true}
          transcript=""
          lastCommand={null}
          permissionError={null}
          onToggleListening={mockOnToggle}
        />
      );

      const btn = getByText('Detener');
      expect(btn).toBeTruthy();

      fireEvent.press(btn);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

  it('Escenario 1: Muestra indicador de "Escuchando..." cuando el micrófono está activo', () => {
    const { getByText } = render(
      <VoiceDictationBar
        isListening={true}
        transcript="Diente 18 caries"
        lastCommand={null}
        permissionError={null}
        onToggleListening={mockOnToggle}
      />
    );

    expect(getByText('Escuchando...')).toBeTruthy();
    expect(getByText('Detener')).toBeTruthy();
  });

  it('Escenario 3: Muestra en vivo la caja de transcripción con el texto capturado', () => {
    const { getByTestId, getByText } = render(
      <VoiceDictationBar
        isListening={true}
        transcript="Diente 24 endodoncia"
        lastCommand={null}
        permissionError={null}
        onToggleListening={mockOnToggle}
      />
    );

    const transcriptBox = getByTestId('voice-live-transcript');
    expect(transcriptBox).toBeTruthy();
    expect(getByText('Diente 24 endodoncia')).toBeTruthy();
  });

  it('Escenario 2: Despliega banner de alerta cuando el comando no es reconocido', () => {
    const { getByTestId, getByText } = render(
      <VoiceDictationBar
        isListening={false}
        transcript="diente noventa y nueve"
        lastCommand={{
          success: false,
          rawText: 'diente noventa y nueve',
          error: 'INVALID_COMMAND',
          feedbackMessage: 'No se detectó el número de diente en el comando',
        }}
        permissionError={null}
        onToggleListening={mockOnToggle}
      />
    );

    expect(getByTestId('voice-feedback-banner')).toBeTruthy();
    expect(getByText('No se detectó el número de diente en el comando')).toBeTruthy();
  });

  it('Escenario 4: Muestra mensaje informativo cuando se deniegan los permisos de audio', () => {
    const errorMsg = 'La función de voz requiere permisos de acceso al micrófono.';
    const { getByTestId, getByText } = render(
      <VoiceDictationBar
        isListening={false}
        transcript=""
        lastCommand={null}
        permissionError={errorMsg}
        onToggleListening={mockOnToggle}
      />
    );

    expect(getByTestId('voice-permission-error')).toBeTruthy();
    expect(getByText(errorMsg)).toBeTruthy();
  });
});