import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import AppTabs from '../app-tabs';
import { Platform, StyleSheet } from 'react-native'; // <--- CORREGIDO: Importamos StyleSheet

// 1. Mock de expo-router
const mockTabs = jest.fn(({ children, tabBar }: any) => {
  // Comportamiento por defecto (Ruta 'home' activa)
  const fakeState = {
    routes: [{ name: 'home' }, { name: 'explore' }, { name: 'profile' }],
    index: 0,
  };
  return (
    <>
      {tabBar({ state: fakeState, descriptors: {}, navigation: { navigate: jest.fn() } })}
      {children}
    </>
  );
});

jest.mock('expo-router', () => ({
  Tabs: Object.assign((props: any) => mockTabs(props), {
    Screen: () => null,
  }),
}));

// 2. Mock del hook personalizado de temas
const mockColors = {
  main: '#4F46E5',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
};
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockColors,
}));

const mockUseSafeAreaInsets = jest.fn();
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

// 4. Mock de expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// ========================================================
// SUITE DE TESTS UNITARIOS
// ========================================================
describe('AppTabs Component & CustomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 16, top: 0, left: 0, right: 0 });
  });

  it('debe renderizar correctamente todos los textos del TabBar', () => {
    render(<AppTabs />);

    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Pacientes')).toBeTruthy();
    expect(screen.getByText('Agenda')).toBeTruthy();
    expect(screen.getByText('Perfil')).toBeTruthy();
  });

  it('should call the navigation function after pressing an available Tab', () => {
    const mockNavigate = jest.fn();

    mockTabs.mockImplementationOnce(({ tabBar }: any) =>
      tabBar({
        state: { routes: [{ name: 'home' }, { name: 'explore' }, { name: 'profile' }], index: 0 },
        descriptors: {},
        navigation: { navigate: mockNavigate }
      })
    );

    const { getByTestId } = render(<AppTabs />);

    const profileTab = getByTestId('profile-tab');
    fireEvent.press(profileTab);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('profile');
  });

  it('should not allow interaction or navigate if the tab is disabled (Agenda)', () => {
    const mockNavigate = jest.fn();

    mockTabs.mockImplementationOnce(({ tabBar }: any) =>
      tabBar({
        state: { routes: [{ name: 'home' }], index: 0 },
        descriptors: {},
        navigation: { navigate: mockNavigate }
      })
    );

    render(<AppTabs />);

    const agendaTab = screen.getByText('Agenda').parent;
    if (agendaTab) {
      fireEvent.press(agendaTab);
    }

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should apply correct focus colors based on active path', () => {
    mockTabs.mockImplementationOnce(({ tabBar }: any) => {
      mockUseSafeAreaInsets.mockReturnValue({ bottom: 0, top: 0, left: 0, right: 0 });

      return tabBar({
        state: {
          routes: [{ name: 'home' }, { name: 'explore' }, { name: 'profile' }],
          index: 1
        },
        descriptors: {},
        navigation: { navigate: jest.fn() }
      });
    });

    render(<AppTabs />);

    const textInicio = screen.getByText('Inicio');
    const textPacientes = screen.getByText('Pacientes');

    expect(StyleSheet.flatten(textInicio.props.style)).toMatchObject({ color: mockColors.textSecondary });
    expect(StyleSheet.flatten(textPacientes.props.style)).toMatchObject({ color: mockColors.main });
  });

  it('should apply adaptative paddingBottom on iOS when theres no insets on screen', () => {
    Platform.OS = 'ios';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 0, top: 0, left: 0, right: 0 });

    const { getByTestId } = render(<AppTabs />);

    const tabBarContainer = getByTestId('tabBar');
    expect(StyleSheet.flatten(tabBarContainer?.props.style)).toMatchObject({ paddingBottom: 24 });
  });

  it('should apply adaptative paddingBottom on Android adding compensation for insets', () => {
    Platform.OS = 'android';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 16, top: 0, left: 0, right: 0 });

    const { getByTestId } = render(<AppTabs />);

    const tabBarContainer = getByTestId('tabBar');
    expect(StyleSheet.flatten(tabBarContainer?.props.style)).toMatchObject({ paddingBottom: 20 });
  });

  it('should register the press event of the central button (+)', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { getByTestId } = render(<AppTabs />);

    const floatingButton = getByTestId('center-btn');
    fireEvent.press(floatingButton);

    expect(consoleSpy).toHaveBeenCalledWith("Central Floating Button pressed");
    consoleSpy.mockRestore();
  });
});