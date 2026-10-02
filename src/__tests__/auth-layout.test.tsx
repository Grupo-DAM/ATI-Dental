import React from 'react';
import { render } from '@testing-library/react-native';
import AuthLayout from '@/app/(auth)/_layout';

jest.mock('expo-router', () => {
  const React = require('react');
  const MockStack = jest.fn(({ children }: any) => <>{children}</>);
  MockStack.Screen = () => null;
  return {
    Stack: MockStack,
  };
});

const mockTheme = {
  background: '#F7F6F8',
};

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockTheme,
}));

describe('AuthLayout', () => {
  it('renders Stack with contentStyle background from theme', () => {
    const { Stack } = require('expo-router');
    render(<AuthLayout />);
    expect(Stack.mock.lastCall[0]).toEqual(
      expect.objectContaining({
        screenOptions: expect.objectContaining({
          headerShown: false,
          contentStyle: { backgroundColor: mockTheme.background },
        }),
      })
    );
  });
});
