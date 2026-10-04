import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';
import { useDentalPiecesPerCuadrant } from '@/hooks/use-dental-pieces-per-cuadrant';

// ── 1. MOCKS DE INFRAESTRUCTURA DE RE-USE DE LA APP ──

// Mock seguro de i18next que devuelve la última sección de la llave o fallback
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.surface) return `translated-${options.surface}`;
      const parts = key.split('.');
      return parts[parts.length - 1];
    },
  }),
}));

// Mock del hook del sistema de diseño (Temas)
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#ffffff',
    overMain: '#000000',
    pageSubtitle: '#888888',
    breadcrumbSeparator: '#cccccc',
    cavity: '#ff0000',
    filled: '#0000ff',
  }),
}));

// Mock de estilos inyectados
jest.mock('@/constants/styles/patients.style', () => ({
  createOdontogramStyles: () => ({
    container: {},
    actionBtnsContainer: {},
    actionBtnShell: {},
    actionBtnShellActive: {},
    actionBtnText: {},
    actionBtnTextActive: {},
    legendContainer: {},
    legendItem: {},
    legendDot: {},
    legendText: {},
    odontogramScrollContainer: {},
    halfOdontogram: {},
  }),
}));

// Mock del componente dinámico hijo DentalCuadrant para aislar la prueba unitaria
jest.mock('@/components/clinical-history/DentalPiece', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    DentalCuadrant: ({ teeth, setSelectedTooth }: any) => (
      // Mapeamos los dientes ficticios inyectados por el hook mockeado para interactuar con ellos
      <>
        {teeth.map((t: any) => (
          <TouchableOpacity 
            key={t.number} 
            testID={`mock-tooth-${t.number}`}
            onPress={() => setSelectedTooth(t.number)}
          >
            <Text>{t.number}</Text>
          </TouchableOpacity>
        ))}
      </>
    ),
  };
});

// Mock reactivo del hook calculador de cuadrantes
jest.mock('@/hooks/use-dental-pieces-per-cuadrant', () => ({
  useDentalPiecesPerCuadrant: jest.fn(),
}));

describe('OdontogramContainer', () => {
  const mockOnToothSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuración por defecto del hook de cuadrantes para adultos (1, 2, 3, 4)
    (useDentalPiecesPerCuadrant as jest.Mock).mockReturnValue({
      1: [{ number: 11, generalStates: [] }, { number: 12, generalStates: [] }],
      2: [{ number: 21, generalStates: [] }],
      3: [{ number: 31, generalStates: [] }],
      4: [{ number: 41, generalStates: [] }],
    });
  });

  it('debe renderizar correctamente la estructura con datos específicos de Adulto', () => {
    render(
      <OdontogramContainer
        odontogram={{
          patientId: 'paciente_cova_123',
          status: 'ready',
          isAdult: true,
          teeth: {
            11: { number: 11, generalStates: ['cavity'] },
          },
        }}
        onToothSelect={mockOnToothSelect}
      />
    );

    // Validación del contenedor principal por testID
    expect(screen.getByTestId('odontogram-container')).toBeTruthy();

    // Comprobación de los textos informativos o botones de acción
    expect(screen.getByText(/adult/i)).toBeTruthy();
    expect(screen.getByText(/pediatric/i)).toBeTruthy();

    // Verificación de que la leyenda se puebla correctamente mapeando strings
    expect(screen.getByText(/cavity/i)).toBeTruthy();
    expect(screen.getByText(/filled/i)).toBeTruthy();
  });

  it('debe recurrir a DEFAULT_ODONTOGRAM (Adulto) de forma segura si odontogram prop es undefined', () => {
    render(<OdontogramContainer odontogram={undefined} onToothSelect={mockOnToothSelect} />);

    expect(screen.getByTestId('odontogram-container')).toBeTruthy();
    expect(screen.getByText(/adult/i)).toBeTruthy();
    
    // Verifica que se invoque el hook pasándole la bandera 'true' por defecto
    expect(useDentalPiecesPerCuadrant).toHaveBeenCalledWith(true, {});
  });

  it('debe alternar la configuración hacia cuadrantes pediátricos si isAdult viene en falso', () => {
    // Cambiamos el comportamiento del mock del hook para simular cuadrantes infantiles (5, 6, 7, 8)
    (useDentalPiecesPerCuadrant as jest.Mock).mockReturnValue({
      5: [{ number: 51, generalStates: [] }],
      6: [{ number: 61, generalStates: [] }],
      7: [{ number: 71, generalStates: [] }],
      8: [{ number: 81, generalStates: [] }],
    });

    render(
      <OdontogramContainer
        odontogram={{
          patientId: 'niño_paciente_456',
          status: 'ready',
          isAdult: false,
          teeth: {},
        }}
        onToothSelect={mockOnToothSelect}
      />
    );

    // Comprobamos que el hook se llame con la bandera en false
    expect(useDentalPiecesPerCuadrant).toHaveBeenCalledWith(false, {});
    
    // Verificamos que el renderizador pinte al menos un diente infantil mapeado
    expect(screen.getByTestId('mock-tooth-51')).toBeTruthy();
  });

  it('debe gatillar onToothSelect con datos existentes cuando se selecciona un diente', () => {
    const existingToothCondition = { number: 11, generalStates: ['filled'], notes: 'Tratado' };

    render(
      <OdontogramContainer
        odontogram={{
          patientId: 'paciente_cova_123',
          status: 'ready',
          isAdult: true,
          teeth: {
            11: existingToothCondition,
          },
        }}
        onToothSelect={mockOnToothSelect}
      />
    );

    // Simulamos la pulsación física sobre la pieza dental 11 de nuestro componente mockeado
    const toothComponent = screen.getByTestId('mock-tooth-11');
    fireEvent.press(toothComponent);

    // Verificamos que el callback de elevación de estados (SOLID) se ejecute con el payload exacto de la BD
    expect(mockOnToothSelect).toHaveBeenCalledTimes(1);
    expect(mockOnToothSelect).toHaveBeenCalledWith(existingToothCondition);
  });

  it('debe gatillar onToothSelect creando una estructura limpia (Sana) si el diente tocado no tenía registro previo en BD', () => {
    render(
      <OdontogramContainer
        odontogram={{
          patientId: 'paciente_cova_123',
          status: 'ready',
          isAdult: true,
          teeth: {}, // Sin registros guardados para la pieza 12
        }}
        onToothSelect={mockOnToothSelect}
      />
    );

    // Simulamos la pulsación sobre la pieza dental 12 (que el hook inyectó por defecto como sano)
    (useDentalPiecesPerCuadrant as jest.Mock).mockImplementation(() => ({
      1: [{ number: 12, generalStates: [] }],
    }));
    
    // Re-renderizamos para actualizar con el nuevo mock inline de dientes
    screen.rerender(
      <OdontogramContainer
        odontogram={{
          patientId: 'paciente_cova_123',
          status: 'ready',
          isAdult: true,
          teeth: {},
        }}
        onToothSelect={mockOnToothSelect}
      />
    );

    fireEvent.press(screen.getByTestId('mock-tooth-12'));

    // Debe retornar un objeto sano inicializado con el número de pieza correcto
    expect(mockOnToothSelect).toHaveBeenCalledTimes(1);
    expect(mockOnToothSelect).toHaveBeenCalledWith({
      number: 12,
      generalStates: [],
    });
  });
});
