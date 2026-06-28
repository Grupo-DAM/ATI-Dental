import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NavigationDrawer } from '@/components/navigation/navigation-drawer';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => ['(tabs)', 'explore'],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = jest.requireMock('@/hooks/use-auth');

describe('NavigationDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra items base para cualquier usuario', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'doc@test.com', rol: 'odontologo', nombre: 'Dr. Ramirez' },
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);

    expect(screen.getByTestId('nav-item-patients')).toBeTruthy();
    expect(screen.getByTestId('nav-item-register-patient')).toBeTruthy();
    expect(screen.queryByTestId('nav-admin-section')).toBeNull();
  });

  it('muestra sección de administración solo para admin', () => {
    useAuth.mockReturnValue({
      user: { uid: '1', email: 'admin@test.com', rol: 'admin', nombre: 'Admin' },
    });

    render(<NavigationDrawer visible onClose={jest.fn()} />);

    expect(screen.getByTestId('nav-admin-section')).toBeTruthy();
    fireEvent.press(screen.getByTestId('nav-item-admin-toggle'));
    expect(screen.getByTestId('nav-item-admin-users')).toBeTruthy();
  });
});
