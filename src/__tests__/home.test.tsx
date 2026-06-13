import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { AuthProvider } from '@/hooks/use-auth';

// Una utilidad matemática simple para verificar que Jest ejecuta lógica pura sin problemas.
const sumValues = (a: number, b: number) => a + b;

describe('Smoke Test: Pure Logic', () => {
  it('should calculate the sum correctly', () => {
    expect(sumValues(10, 5)).toBe(15);
  });
});

describe('HomeScreen', () => {
  it('renders correctly and contains welcome text', async () => {
    const { getByText, toJSON } = render(
        <AuthProvider>
            <HomeScreen />
        </AuthProvider>
    );
    await waitFor(() => {
      expect(getByText(/Welcome to/i)).toBeTruthy();
    });
    //assert to verify the render is not null
    expect(toJSON()).toBeTruthy();
  });
});
