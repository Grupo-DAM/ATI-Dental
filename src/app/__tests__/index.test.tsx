import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '@/hooks/use-auth';
import HomeScreen from '../index';

describe('HomeScreen (Auth PoC)', () => {
  it('renders the Google auth PoC as the initial screen', () => {
    const { getByText, toJSON } = render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>,
    );
    expect(getByText(/PoC: Google \+ Firebase Auth/i)).toBeTruthy();
    expect(getByText(/Continuar con Google/i)).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });
});
