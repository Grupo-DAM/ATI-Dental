import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SlidingModal } from '@/components/ui/sliding-modal';
import { createSlidingModalStyles } from '@/constants/styles/global.styles';
import { Colors } from '@/constants/theme';
import * as SafeAreaContext from 'react-native-safe-area-context';

// ── 1. MOCKS DE INFRAESTRUCTURA DE LA APP ──

// Mock de expo-linear-gradient para evitar fallos de renderizado en Node/Jest
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) => <View style={style} testID="mock-gradient">{children}</View>,
  };
});

// Mock del hook de Temas
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    mainGradient: ['#000000', '#ffffff'],
    backgroundElement: '#ffffff',
    cardSeparator: '#cccccc',
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  }),
}));

describe('SlidingModal Component Suite', () => {
  const mockOnCancel = jest.fn();
  const mockChildText = 'Contenido Clínico de Prueba';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar el contenido estructural si la propiedad visible es falsa', () => {
    render(
      <SlidingModal visible={false} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    // En React Native, el componente Modal nativo oculta todo su árbol de subnodos si visible es false
    expect(screen.queryByText(mockChildText)).toBeNull();
  });

  it('debe renderizar el tirador (handle), el gradiente y sus componentes hijos correctamente cuando está visible', () => {
    render(
      <SlidingModal visible={true} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    expect(screen.getByTestId('mock-gradient')).toBeTruthy();
    expect(screen.getByText(mockChildText)).toBeTruthy();
  });

  it('debe ejecutar el callback onCancel de forma limpia al presionar sobre el fondo oscuro traslúcido (overlay)', () => {
    render(
      <SlidingModal visible={true} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    // Buscamos de forma unificada el overlay por su testID único
    const overlayElement = screen.getByTestId('modal-overlay');
    expect(overlayElement).toBeTruthy();
    
    // Invocamos directamente la prop del evento para evitar solapamientos en el árbol virtual
    fireEvent(overlayElement, 'press');
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('no debe ejecutar onCancel si la propiedad isSubmitting está en verdadero al pulsar el overlay', () => {
    render(
      <SlidingModal visible={true} isSubmitting={true} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    const overlayElement = screen.getByTestId('modal-overlay');
    expect(overlayElement).toBeTruthy();
    
    fireEvent(overlayElement, 'press');
    
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('debe absorber los toques y no cerrar el modal si el usuario pulsa dentro de la tarjeta de contenido', () => {
    render(
      <SlidingModal visible={true} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    // Presionamos de forma segura el contenedor interno de la tarjeta que tiene el callback vacío
    const innerCardPressable = screen.getByTestId('modal-card-content');
    expect(innerCardPressable).toBeTruthy();
    
    fireEvent(innerCardPressable, 'press');

    // El evento es absorbido por el callback vacío y NO dispara el cierre
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('debe integrar useSafeAreaInsets dinámicamente al renderizar el modal', () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValueOnce({
      top: 0,
      left: 0,
      right: 0,
      bottom: 48,
    });

    render(
      <SlidingModal visible={true} onCancel={mockOnCancel}>
        <Text>{mockChildText}</Text>
      </SlidingModal>
    );

    expect(screen.getByText(mockChildText)).toBeTruthy();
  });

  describe('createSlidingModalStyles unit tests', () => {
    const mockTheme = {
      ...Colors.light,
      backgroundElement: '#FFFFFF',
      cardSeparator: '#D1D5DB',
    };

    it('aplica paddingBottom mínimo cuando insets.bottom es 0 o indefinido (gestures o fallback)', () => {
      const stylesZero = createSlidingModalStyles(mockTheme, { bottom: 0 });
      expect(stylesZero.sheet.paddingBottom).toBeGreaterThanOrEqual(16);

      const stylesUndefined = createSlidingModalStyles(mockTheme, undefined);
      expect(stylesUndefined.sheet.paddingBottom).toBeGreaterThanOrEqual(16);
    });

    it('adapta dinámicamente paddingBottom para la barra de navegación de 3 botones de Android (48px)', () => {
      const stylesAndroid = createSlidingModalStyles(mockTheme, { bottom: 48 });
      expect(stylesAndroid.sheet.paddingBottom).toBe(48);
    });

    it('adapta dinámicamente paddingBottom para el Home Indicator de iOS (34px)', () => {
      const stylesIOS = createSlidingModalStyles(mockTheme, { bottom: 34 });
      expect(stylesIOS.sheet.paddingBottom).toBe(34);
    });

    it('soporta modo oscuro en el fondo del sheet y el tirador handle', () => {
      const stylesDark = createSlidingModalStyles(Colors.dark);
      expect(stylesDark.sheet.backgroundColor).toBe(Colors.dark.backgroundElement);
      expect(stylesDark.handle.backgroundColor).toBe(Colors.dark.cardSeparator);
    });
  });
});
