import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import ProfileScreen from '../profile';

// 1. Mock estricto para NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

// 2. Mock estricto para Firebase Auth
const mockUpdateEmail = jest.fn();
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: {
      email: 'dr.smith@atidental.com',
      updateEmail: mockUpdateEmail,
      getIdToken: jest.fn(() => Promise.resolve('mock-jwt-token')),
    },
  });
});

// 3. Mock estricto para SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
}));

describe('ProfileScreen - Actualización de Correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto, simulamos que hay internet
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    // Por defecto, simulamos que Firebase responde bien
    mockUpdateEmail.mockResolvedValue(true);
  });

  it('Caso Borde 3: Falla validación síncrona si el correo es inválido', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'correo_malo');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('Formato de correo inválido')).toBeTruthy();
      expect(mockUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Caso Borde 2: Inestabilidad de red bloquea actualización', async () => {
    // Simulamos que no hay internet solo para esta prueba
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.changeText(getByTestId('input-email'), 'nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(mockUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Abre Modal OTP si el correo es diferente', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'valido@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByTestId('modal-otp')).toBeTruthy();
      expect(mockUpdateEmail).toHaveBeenCalledWith('valido@atidental.com');
    });
  });
});
