import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';

// Una utilidad matemática simple para verificar que Jest ejecuta lógica pura sin problemas.
const sumValues = (a: number, b: number) => a + b;

describe('Smoke Test: Pure Logic', () => {
  it('should calculate the sum correctly', () => {
    expect(sumValues(10, 5)).toBe(15);
  });
});

describe('HomeScreen', () => {
  it('renders correctly and contains welcome text', () => {
    const { getByText, toJSON } = render(<HomeScreen />);
    expect(getByText(/Welcome to/i)).toBeTruthy();
    //assert to verify the render is not null
    expect(toJSON()).toBeTruthy();
  });
});
