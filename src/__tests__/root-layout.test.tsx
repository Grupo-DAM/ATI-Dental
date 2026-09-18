import React from 'react';
import { LogBox } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  Stack.Screen = () => null;
  return { Stack };
});

jest.mock('@react-navigation/native', () => ({
  DarkTheme: { dark: true },
  DefaultTheme: { dark: false },
  ThemeProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
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
});
