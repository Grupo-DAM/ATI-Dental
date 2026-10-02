import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { DentalPiece, DentalCuadrant, getToothCombinedStateColor } from '@/components/clinical-history/DentalPiece';
import { useToothAsset } from '@/hooks/use-tooth-asset';

// ── 1. MOCKS DE INFRAESTRUCTURA Y COMPONENTES EXPO ──

// Mock de expo-image para evitar fallos con recursos binarios en Node/Jest
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View {...props} testID="mock-image" />,
  };
});

// Mock del hook del sistema de diseño (Temas)
const mockTheme = {
  backgroundElement: '#ffffff',
  cavity: '#ff0000',
  filled: '#0000ff',
  cardSeparator: '#cccccc',
  main: '#00aaff',
  text: '#000000',
  overMain: '#ffffff',
};
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockTheme,
}));

// Mock del hook que resuelve el asset visual del diente
jest.mock('@/hooks/use-tooth-asset', () => ({
  useToothAsset: jest.fn(),
}));

// Mock de los archivos de estilos inyectados
jest.mock('@/constants/styles/patients.style', () => ({
  createDentalPieceStyles: () => ({
    dentalPieceContainer: { padding: 4 },
    bottomDentalPieceContainer: { flexDirection: 'column-reverse' },
    numberPieceContainer: {},
    numberPieceSelectedContainer: { backgroundColor: '#00aaff' },
    numberPiece: {},
    numberPieceSelected: { fontWeight: 'bold' },
    stateDot: { width: 10 },
    stateDotHealthy: { borderColor: '#cccccc' },
    pressable: {},
    toothAsset: { width: 30 },
    flipToothAsset: { transform: [{ scaleX: -1 }] },
  }),
  createDentalCuadrantStyles: () => ({
    cuadrantRow: { flexDirection: 'row' },
    leftCuadrantRow: { flexDirection: 'row-reverse' },
  }),
}));

describe('DentalPiece & DentalCuadrant Component Suite', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuración por defecto para el asset del diente
    (useToothAsset as jest.Mock).mockReturnValue({
      dentalPieceSource: 'source-path-mock',
      flip: false,
    });
  });

  // ── PRUEBAS UNITARIAS DE LA FUNCIÓN PURA (UTILITY) ──
  describe('getToothCombinedStateColor', () => {
    it('debe devolver backgroundElement si el arreglo de estados está vacío (Sano)', () => {
      const color = getToothCombinedStateColor(mockTheme, []);
      expect(color).toBe(mockTheme.backgroundElement);
    });

    it('debe devolver el color del primer estado que encuentre en la lista', () => {
      const color = getToothCombinedStateColor(mockTheme, ['cavity', 'filled']);
      expect(color).toBe(mockTheme.cavity);
    });
  });

  // ── PRUEBAS UNITARIAS DE DENTALPIECE ──
  describe('DentalPiece', () => {
    const healthyTooth = { number: 11, generalStates: [] };
    const cavityTooth = { number: 46, generalStates: ['cavity'] };

    it('debe renderizar correctamente un diente sano mostrando el número de pieza', () => {
      render(<DentalPiece tooth={healthyTooth} />);
      
      expect(screen.getByText('11')).toBeTruthy();
      expect(screen.getByTestId('mock-image')).toBeTruthy();
    });

    it('debe ocultar el número si la propiedad showNumber viene en false', () => {
      render(<DentalPiece tooth={healthyTooth} showNumber={false} />);
      
      expect(screen.queryByText('11')).toBeNull();
      expect(screen.getByTestId('mock-image')).toBeTruthy();
    });

    it('debe aplicar estilos específicos cuando el diente está seleccionado', () => {
      render(<DentalPiece tooth={healthyTooth} isSelected={true} />);
      
      // 💡 CORRECCIÓN 1: Buscamos directamente el contenedor del número usando el nuevo testID
      const numberContainer = screen.getByTestId('tooth-number-container');
      expect(numberContainer).toBeTruthy();
      
      // ✨ SOLUCIÓN ULTRA ROBUSTA: Usamos la herramienta oficial de React Native para aplanar estilos
      const flatStyle = StyleSheet.flatten(numberContainer.props.style);
      
      // Validamos que el fondo coincida con el color del tema mockeado (#00aaff equivale a theme.main)
      expect(flatStyle.backgroundColor).toBe('#00aaff');
    });

    it('debe reflejar el color de afección en el punto de estado cuando no está sano', () => {
      const { UNSAFE_root } = render(<DentalPiece tooth={cavityTooth} />);
      
      // Buscamos todas las instancias de View dentro del árbol del componente
      const views = UNSAFE_root.findAllByType('View');
      
      // El punto de estado (stateDot) es el último nodo View de la estructura de DentalPiece
      const stateDotNode = views[views.length - 1];
      expect(stateDotNode).toBeTruthy();
      
      // ✨ SOLUCIÓN ULTRA ROBUSTA: Aplanamos el estilo del indicador redondo
      const flatStyle = StyleSheet.flatten(stateDotNode.props.style);
      expect(flatStyle.backgroundColor).toBe(mockTheme.cavity);
    });

    it('debe aplicar el efecto espejo flip al asset si el hook useToothAsset lo requiere', () => {
      (useToothAsset as jest.Mock).mockReturnValue({
        dentalPieceSource: 'source-path-mock',
        flip: true,
      });

      render(<DentalPiece tooth={healthyTooth} />);
      const imageNode = screen.getByTestId('mock-image');
      
      expect(imageNode.props.style).toContainEqual({ transform: [{ scaleX: -1 }] });
    });

    it('debe gatillar el evento onPress al presionar la ilustración del diente', () => {
      render(<DentalPiece tooth={healthyTooth} onPress={mockOnPress} />);
      
      const pressableElement = screen.getByTestId('mock-image').parent;
      fireEvent.press(pressableElement);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  // ── PRUEBAS UNITARIAS DE DENTALCUADRANT (LIST RENDERING) ──
  describe('DentalCuadrant', () => {
    const mockTeethList = [
      { number: 11, generalStates: [] },
      { number: 12, generalStates: ['filled'] },
      { number: 13, generalStates: [] },
    ];
    const mockSetSelectedTooth = jest.fn();

    it('debe renderizar la lista completa de piezas dentales inyectadas por el cuadrante', () => {
      render(
        <DentalCuadrant
          teeth={mockTeethList}
          isLeftCuadrant={false}
          isBottomCuadrant={false}
          selectedTooth={null}
          setSelectedTooth={mockSetSelectedTooth}
        />
      );

      expect(screen.getByText('11')).toBeTruthy();
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText('13')).toBeTruthy();
    });

    it('debe tolerar listas de dientes undefined o vacías de forma segura sin lanzar crashes', () => {
      render(
        <DentalCuadrant
          teeth={undefined as any}
          isLeftCuadrant={false}
          isBottomCuadrant={false}
          selectedTooth={null}
          setSelectedTooth={mockSetSelectedTooth}
        />
      );

      // Al usar el encadenamiento opcional teeth?.map, el contenedor renderiza una View vacía sin explotar
      expect(screen.toJSON()).toBeTruthy();
    });

    it('debe propagar la selección del número de pieza correcto hacia el padre al presionar un elemento de la lista', () => {
      render(
        <DentalCuadrant
          teeth={mockTeethList}
          isLeftCuadrant={false}
          isBottomCuadrant={false}
          selectedTooth={null}
          setSelectedTooth={mockSetSelectedTooth}
        />
      );

      // Buscamos el Pressable que envuelve la imagen del diente 12
      const imageNodes = screen.getAllByTestId('mock-image');
      fireEvent.press(imageNodes[1].parent); // Presionamos el segundo diente (índice 1 -> Pieza 12)

      expect(mockSetSelectedTooth).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedTooth).toHaveBeenCalledWith(12);
    });
  });
});
