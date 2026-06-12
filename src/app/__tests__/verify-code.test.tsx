import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VerifyCodeScreen from '../verify-code';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import renderer from 'react-test-renderer';

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

  it('renders correctly and matches snapshot', () => {
    const tree = renderer.create(<VerifyCodeScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('shows error if code length is not 6', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<VerifyCodeScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Ingresa el código OTP (ej. 123456)'), '123');
    fireEvent.press(getByText('Activar cuenta'));
    
    expect(await findByText('El código debe tener 6 dígitos.')).toBeTruthy();
    expect(mockVerifyCode).not.toHaveBeenCalled();
  });

  it('shows error on network instability', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const { getByPlaceholderText, getByText, findByText } = render(<VerifyCodeScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Ingresa el código OTP (ej. 123456)'), '123456');
    fireEvent.press(getByText('Activar cuenta'));
    
    expect(await findByText('No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.')).toBeTruthy();
    expect(mockVerifyCode).not.toHaveBeenCalled();
  });

  it('calls verifyCode and redirects to home on success', async () => {
    const { getByPlaceholderText, getByText } = render(<VerifyCodeScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Ingresa el código OTP (ej. 123456)'), '123456');
    fireEvent.press(getByText('Activar cuenta'));
    
    await waitFor(() => {
      expect(mockVerifyCode).toHaveBeenCalledWith('123456');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows error if verifyCode fails', async () => {
    mockVerifyCode.mockRejectedValue(new Error('Código incorrecto'));
    
    const { getByPlaceholderText, getByText, findByText } = render(<VerifyCodeScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Ingresa el código OTP (ej. 123456)'), '654321');
    fireEvent.press(getByText('Activar cuenta'));
    
    expect(await findByText('Código incorrecto')).toBeTruthy();
  });
});
