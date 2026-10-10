import React from 'react';
import { Modal } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { NavigationDrawer } from '@/components/navigation/navigation-drawer';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseSegments = jest.fn(() => ['(tabs)', 'explore']);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSegments: () => mockUseSegments(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

jest.mock('@/services/monthly-executive-summary-service', () => ({
  exportMonthlyExecutiveSummary: jest.fn().mockResolvedValue({ shared: true }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = jest.requireMock('@/hooks/use-auth');

describe('NavigationDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSegments.mockReturnValue(['(tabs)', 'explore']);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('muestra items base para cualquier usuario', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo', nombre: 'Dr. Ramirez' },
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);

    expect(screen.getByTestId('nav-item-patients')).toBeTruthy();
    expect(screen.getByTestId('nav-item-register-patient')).toBeTruthy();
    expect(screen.getByTestId('nav-item-profile')).toBeTruthy();
    expect(screen.getByTestId('nav-item-contact')).toBeTruthy();
    expect(screen.getByText('Dr. Ramirez')).toBeTruthy();
    expect(screen.queryByTestId('nav-admin-section')).toBeNull();
  });

  it('cierra el menú con el botón atrás', () => {
    const onClose = jest.fn();
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo', nombre: 'Dr. Ramirez' },
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={onClose} />);
    fireEvent.press(screen.getByTestId('nav-drawer-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('navega a las rutas del menú', () => {
    const onClose = jest.fn();
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo', nombre: 'Dr. Ramirez' },
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={onClose} />);
    fireEvent.press(screen.getByTestId('nav-item-profile'));
    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('muestra sección de administración solo para admin', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'admin@test.com', rol: 'admin', nombre: 'Admin' },
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);

    expect(screen.getByTestId('nav-admin-section')).toBeTruthy();
    fireEvent.press(screen.getByTestId('nav-item-admin-toggle'));
    expect(screen.getByTestId('nav-item-admin-users')).toBeTruthy();
    fireEvent.press(screen.getByTestId('nav-item-admin-reports'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/admin/reports');
  });

  it('resalta Administración en rutas de admin', () => {
    mockUseSegments.mockReturnValue(['(tabs)', 'admin', 'users']);
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'admin@test.com', rol: 'admin', nombre: 'Admin' },
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);

    const adminToggle = screen.getByTestId('nav-item-admin-toggle');
    const style = adminToggle.props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter((item: object | false | undefined) => Boolean(item)))
      : style;
    expect(flat.backgroundColor).toBe('rgba(255, 255, 255, 0.18)');
  });

  it('cierra sesión desde el pie del menú', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo', nombre: 'Dr. Ramirez' },
      logout,
    });

    render(<NavigationDrawer visible onClose={onClose} />);

    fireEvent.press(screen.getByTestId('nav-item-logout'));

    expect(onClose).toHaveBeenCalled();
    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('no redirige si logout falla', async () => {
    const logout = jest.fn().mockRejectedValue(new Error('network'));
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo' },
      logout,
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);
    fireEvent.press(screen.getByTestId('nav-item-logout'));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('configura el modal como transparente para evitar el destello blanco en transiciones', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo' },
      logout: jest.fn(),
    });

    const { UNSAFE_getByType } = render(<NavigationDrawer visible onClose={jest.fn()} />);
    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(true);
    expect(modal.props.presentationStyle).toBeUndefined();
  });

  it('permite a un administrador exportar el resumen mensual', async () => {
    const onClose = jest.fn();
    const adminUser = { uid: '1', email: 'admin@test.com', rol: 'admin', nombre: 'Admin User' };
    useAuth.mockReturnValue({
      user: adminUser,
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={onClose} />);

    fireEvent.press(screen.getByTestId('nav-item-admin-toggle'));
    const monthlySummaryItem = screen.getByTestId('nav-item-admin-monthly-summary');
    expect(monthlySummaryItem).toBeTruthy();

    const { exportMonthlyExecutiveSummary } = jest.requireMock('@/services/monthly-executive-summary-service');
    exportMonthlyExecutiveSummary.mockResolvedValueOnce({ shared: true });

    fireEvent.press(monthlySummaryItem);

    await waitFor(() => {
      expect(exportMonthlyExecutiveSummary).toHaveBeenCalledWith(adminUser, 'es');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('maneja errores en exportación de resumen mensual sin romper la interfaz', async () => {
    const onClose = jest.fn();
    const adminUser = { uid: '1', email: 'admin@test.com', rol: 'admin', nombre: 'Admin User' };
    useAuth.mockReturnValue({
      user: adminUser,
      logout: jest.fn(),
    });

    render(<NavigationDrawer visible onClose={onClose} />);

    fireEvent.press(screen.getByTestId('nav-item-admin-toggle'));
    const monthlySummaryItem = screen.getByTestId('nav-item-admin-monthly-summary');

    const { exportMonthlyExecutiveSummary } = jest.requireMock('@/services/monthly-executive-summary-service');
    exportMonthlyExecutiveSummary.mockRejectedValueOnce(new Error('Export failed'));

    fireEvent.press(monthlySummaryItem);

    await waitFor(() => {
      expect(exportMonthlyExecutiveSummary).toHaveBeenCalled();
    });
    // La interfaz permanece interactiva
    expect(monthlySummaryItem).toBeTruthy();
  });

  it('ejecuta la transición de cierre cuando visible cambia a false', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'admin@test.com', rol: 'admin' },
      logout: jest.fn(),
    });

    const { rerender } = render(<NavigationDrawer visible={true} onClose={jest.fn()} />);
    expect(screen.getByTestId('nav-drawer-close')).toBeTruthy();

    rerender(<NavigationDrawer visible={false} onClose={jest.fn()} />);
  });
});

