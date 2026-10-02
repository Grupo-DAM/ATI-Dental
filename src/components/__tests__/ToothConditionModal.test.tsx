import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ToothConditionModal } from '@/components/clinical-history/ToothConditionModal';
import { ToothCondition } from '@/types/clinical-record';

// ── 1. MOCKS DE INFRAESTRUCTURA Y UI GENERAL ──

// Mock de i18next que devuelve la última sección de la llave para aserciones legibles
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.surface) return `translated-${options.surface}`;
      const parts = key.split('.');
      return parts[parts.length - 1];
    },
  }),
}));

// Mock del hook de Temas
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#ffffff',
    main: '#00aaff',
    text: '#000000',
    overMain: '#ffffff',
    cardSeparator: '#cccccc',
    cavity: '#ff0000',
    filled: '#0000ff',
    temporal: '#ffff00',
  }),
}));

// Mock aislado de los archivos de estilos del componente
jest.mock('@/constants/styles/patients.style', () => ({
  createToothConditionModalStyles: () => ({
    container: {},
    horizontalContainer: {},
    dentalPieceSection: {},
    pieceNumberText: {},
    dentalPieceSectionText: {},
    dentalPieceContainer: {},
    stateSection: {},
    label: {},
    buttonGroupRow: {},
    stateButton: {},
    legendDot: {},
    stateButtonText: {},
    surfaceStateSelectorBox: {},
    tinyLabel: {},
    actionBtns: {},
  }),
}));

// Mock de los subcomponentes atómicos inyectados
jest.mock('@/components/ui/sliding-modal', () => ({
  SlidingModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));

jest.mock('@/components/ui/form-field', () => {
  const { TouchableOpacity, Text, TextInput } = require('react-native');
  return {
    FormActionButton: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    FormTextField: ({ label, value, onChangeText, placeholder, testID }: any) => (
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    ),
  };
});

// Mock de DentalPiece para no arrastrar dependencias de recursos de imágenes o assets
jest.mock('@/components/clinical-history/DentalPiece', () => {
  const { View, Text } = require('react-native');
  return {
    DentalPiece: ({ tooth }: any) => (
      <View testID={`preview-tooth-${tooth.number}`}>
        <Text>Preview Tooth {tooth.number}</Text>
      </View>
    ),
    getToothCombinedStateColor: () => '#ffffff',
  };
});

describe('ToothConditionModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const mockTooth: ToothCondition = {
    number: 46,
    generalStates: ['filled'],
    surfacesStates: { oclusal: 'cavity' },
    notes: 'Molestia leve al masticar',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar nada si visible es falso', () => {
    render(
      <ToothConditionModal
        visible={false}
        tooth={mockTooth}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.queryByTestId('preview-tooth-46')).toBeNull();
  });

  it('debe renderizar la información inicial del diente de forma correcta al abrirse', () => {
    render(
      <ToothConditionModal
        visible={true}
        tooth={mockTooth}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('46')).toBeTruthy();
    expect(screen.getByText('selectedPiece')).toBeTruthy();
    expect(screen.getByTestId('preview-tooth-46')).toBeTruthy();
  });

  it('debe conmutar (toggle) los estados generales al hacer clic en los botones correspondientes', () => {
    render(
      <ToothConditionModal
        visible={true}
        tooth={mockTooth}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Buscamos el botón de 'cavity' en los estados y lo presionamos para agregarlo
    const cavityButton = screen.getByText('cavity');
    fireEvent.press(cavityButton);

    // Presionamos el botón Guardar Cambios para interceptar el estado intermedio modificado
    fireEvent.press(screen.getByText('saveChange'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        number: 46,
        // El diente ahora contiene tanto 'filled' (inicial) como 'cavity' (agregado)
        generalStates: ['filled', 'cavity'],
      })
    );
  });

  it('debe desplegar el menú de superficies específicas al seleccionar una cara dental', () => {
    render(
      <ToothConditionModal
        visible={true}
        tooth={mockTooth}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Seleccionamos la cara 'mesial' para desplegar el micro-menú
    const mesialButton = screen.getByText('mesial');
    fireEvent.press(mesialButton);

    // El micro-menú reactivo se despliega indicando que se aplicará a la cara seleccionada
    expect(screen.getByText('translated-mesial')).toBeTruthy();

    // 💡 CORRECCIÓN: Buscamos todas las instancias del texto 'temporal'.
    // Al mapear ALL_TOOTH_STATES, el primer 'temporal' pertenece al estado general.
    // El segundo pertenece a la opción específica de superficie. Seleccionamos el último [1]
    const temporalButtons = screen.getAllByText('temporal');
    fireEvent.press(temporalButtons[temporalButtons.length - 1]);

    fireEvent.press(screen.getByText('saveChange'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        number: 46,
        surfacesStates: {
          oclusal: 'cavity', // Conserva el inicial gracias al useEffect
          mesial: 'temporal', // Registra la nueva afección
        },
      })
    );
  });

  it('debe ejecutar el callback onCancel de forma limpia al pulsar el botón secundario', () => {
    render(
      <ToothConditionModal
        visible={true}
        tooth={mockTooth}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(screen.getByText('cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});