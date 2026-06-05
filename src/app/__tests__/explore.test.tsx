import React from 'react';
import { render } from '@testing-library/react-native';
import TabTwoScreen from '../explore';

require('react-native-reanimated').setUpTests();

jest.mock('react-native-worklets', () => {
  return require('react-native-worklets/lib/module/mock');
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

const calculateMarginContent = (topInset: number, spacing: number) => topInset + spacing;

describe('Smoke Test: Style Logic', () => {
  it('should calculate correctly the dynamic space', () => {
    expect(calculateMarginContent(44, 24)).toBe(68);
  });
});

describe('TabTwoScreen (Explore)', () => {
  it('renders the explore screen without raising exceptions', () => {
    const { getByText, toJSON } = render(<TabTwoScreen />);
    expect(getByText('Explore')).toBeTruthy();
    expect(getByText(/This starter app includes example/i)).toBeTruthy();

    expect(toJSON()).toBeTruthy();
  });
});