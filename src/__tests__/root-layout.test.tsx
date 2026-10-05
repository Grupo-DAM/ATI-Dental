import React from 'react';
import { LogBox } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

const mockStack: any = jest.fn(({ children }: { children?: React.ReactNode }) => <>{children}</>);
mockStack.Screen = () => null;

jest.mock('expo-router', () => ({
  Stack: mockStack,
}));

const mockThemeProvider = jest.fn(({ children }: { children?: React.ReactNode }) => <>{children}</>);

jest.mock('@react-navigation/native', () => ({
  DarkTheme: { dark: true, colors: { primary: 'blue' } },
  DefaultTheme: { dark: false, colors: { primary: 'blue' } },
  ThemeProvider: (props: any) => mockThemeProvider(props),
}));

jest.mock('@/hooks/use-auth', () => ({
  AuthProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn();
  mockFirestore.FieldValue = {
    increment: jest.fn((value: number) => value),
  };
  return mockFirestore;
});

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        set: () => Promise.resolve(),
      }),
    }),
  }),
}));

jest.mock('@/i18n', () => ({}));

describe('RootLayout', () => {
  it('silencia el warning deprecado de Firebase al cargar el layout', () => {
    const ignoreSpy = jest.spyOn(LogBox, 'ignoreLogs').mockImplementation(() => undefined);
    jest.isolateModules(() => {
      const RootLayout = require('@/app/_layout').default;
      render(<RootLayout />);
    });

    expect(ignoreSpy).toHaveBeenCalledWith([
      'This method is deprecated (as well as all React Native Firebase namespaced API)',
    ]);
    ignoreSpy.mockRestore();
  });

  it('reporta crashes fatales y delega al handler original', async () => {
    const originalHandler = jest.fn();
    const mockSet = jest.fn(() => Promise.resolve());
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const getSpy = jest.spyOn(ErrorUtils, 'getGlobalHandler').mockReturnValue(originalHandler);
    const setSpy = jest.spyOn(ErrorUtils, 'setGlobalHandler').mockImplementation(() => undefined);
    let installedHandler: ((error: Error, isFatal?: boolean) => void) | undefined;
    setSpy.mockImplementation((handler) => {
      installedHandler = handler as (error: Error, isFatal?: boolean) => void;
    });

    jest.isolateModules(() => {
      jest.doMock('@/config/firebase', () => ({
        firestore: () => ({
          collection: () => ({
            doc: () => ({ set: mockSet }),
          }),
        }),
      }));
      require('@/app/_layout');
    });

    expect(installedHandler).toBeDefined();
    installedHandler?.(new Error('fatal'), true);
    installedHandler?.(new Error('non-fatal'), false);

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalled();
    });
    expect(originalHandler).toHaveBeenCalledTimes(2);

    mockSet.mockReturnValueOnce(Promise.reject(new Error('offline')));
    installedHandler?.(new Error('fatal-offline'), true);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    getSpy.mockRestore();
    setSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('configures Stack contentStyle and ThemeProvider with light background by default', () => {
    const React = require('react');
    const RootLayout = require('@/app/_layout').default;
    const { Colors } = require('@/constants/theme');

    render(<RootLayout />);

    expect(mockStack.mock.lastCall[0]).toEqual(
      expect.objectContaining({
        screenOptions: expect.objectContaining({
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
        }),
      })
    );

    expect(mockThemeProvider.mock.lastCall[0]).toEqual(
      expect.objectContaining({
        value: expect.objectContaining({
          dark: false,
          colors: expect.objectContaining({
            background: Colors.light.background,
          }),
        }),
      })
    );
  });

  it('configures Stack contentStyle and ThemeProvider with dark background when dark mode active', () => {
    const React = require('react');
    const ReactNative = require('react-native');
    const colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const RootLayout = require('@/app/_layout').default;
    const { Colors } = require('@/constants/theme');

    render(<RootLayout />);

    expect(mockStack.mock.lastCall[0]).toEqual(
      expect.objectContaining({
        screenOptions: expect.objectContaining({
          headerShown: false,
          contentStyle: { backgroundColor: Colors.dark.background },
        }),
      })
    );

    expect(mockThemeProvider.mock.lastCall[0]).toEqual(
      expect.objectContaining({
        value: expect.objectContaining({
          dark: true,
          colors: expect.objectContaining({
            background: Colors.dark.background,
          }),
        }),
      })
    );

    colorSchemeSpy.mockRestore();
  });
});
