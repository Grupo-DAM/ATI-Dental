import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import VerifyCodeScreen from '../app/(auth)/verify-code';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

describe('VerifyCodeScreen', () => {
  const mockVerifyCode = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      verifyCode: mockVerifyCode,
    });
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  it('renders correctly and matches snapshot', async () => {
    const { toJSON } = render(<VerifyCodeScreen />);

    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });

    expect(toJSON()).toMatchSnapshot();
  });

  it('shows error on network instability', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const { getByText, findByText } = render(<VerifyCodeScreen />);

    await act(async () => {
      fireEvent.press(getByText('Ya verifiqué mi correo'));
    });

    expect(await findByText('No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.')).toBeTruthy();
    expect(mockVerifyCode).not.toHaveBeenCalled();
  });

  it('calls verifyCode and redirects to home on success', async () => {
    jest.useFakeTimers();
    const { getByText, findByText } = render(<VerifyCodeScreen />);

    await act(async () => {
      fireEvent.press(getByText('Ya verifiqué mi correo'));
    });

    await waitFor(() => {
      expect(mockVerifyCode).toHaveBeenCalled();
    });

    expect(await findByText('¡Correo verificado con éxito! Ingresando a la aplicación...')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockReplace).toHaveBeenCalledWith('/');
    jest.useRealTimers();
  });

  it('shows error if verifyCode fails', async () => {
    mockVerifyCode.mockRejectedValue(new Error('Error de validación'));

    const { getByText, findByText } = render(<VerifyCodeScreen />);

    await act(async () => {
      fireEvent.press(getByText('Ya verifiqué mi correo'));
    });
    
    expect(await findByText('Error de validación')).toBeTruthy();
  });
});
