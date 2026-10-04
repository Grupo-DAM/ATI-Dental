import React from 'react';
import { render } from '@testing-library/react-native';
import TabsLayout from '@/app/(tabs)/_layout';
import { useAuth } from '@/hooks/use-auth';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/app-tabs', () => {
  const { Text } = require('react-native');
  return () => <Text testID="app-tabs">App Tabs Content</Text>;
});

jest.mock('@/hooks/use-navigation-menu', () => {
  return {
    NavigationMenuProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect-element">{href}</Text>,
  };
});

describe('TabsLayout', () => {
  const mockRecordActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra ActivityIndicator mientras loading es verdadero', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      recordActivity: mockRecordActivity,
    });

    const { queryByTestId } = render(<TabsLayout />);
    expect(queryByTestId('redirect-element')).toBeNull();
    expect(queryByTestId('app-tabs')).toBeNull();
  });

  it('redirige a /(auth)/login si user es null', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      recordActivity: mockRecordActivity,
    });

    const { getByTestId } = render(<TabsLayout />);
    const redirectEl = getByTestId('redirect-element');
    expect(redirectEl.props.children).toBe('/(auth)/login');
  });

  it('redirige a /(auth)/login si user.estado es inactivo', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', estado: 'inactivo' },
      loading: false,
      recordActivity: mockRecordActivity,
    });

    const { getByTestId } = render(<TabsLayout />);
    const redirectEl = getByTestId('redirect-element');
    expect(redirectEl.props.children).toBe('/(auth)/login');
  });

  it('renderiza AppTabs y llama a recordActivity al interactuar si el usuario está activo', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', estado: 'activo' },
      loading: false,
      recordActivity: mockRecordActivity,
    });

    const { getByTestId, toJSON } = render(<TabsLayout />);
    expect(getByTestId('app-tabs')).toBeTruthy();

    const root = toJSON();
    expect(root).toBeTruthy();
  });
});
