import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../app/(tabs)/register';
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

describe('RegisterScreen', () => {
  const mockRegister = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  it('renders correctly and matches snapshot', () => {
    const tree = renderer.create(<RegisterScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('shows error if email is invalid', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    fireEvent.changeText(getByPlaceholderText('Vuelve a escribir la contraseña'), '123456');
    
    fireEvent.press(getByText('Registrarse'));
    
    expect(await findByText('El formato de correo no es válido.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error if passwords do not match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    fireEvent.changeText(getByPlaceholderText('Vuelve a escribir la contraseña'), '654321');
    
    fireEvent.press(getByText('Registrarse'));
    
    expect(await findByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error on network instability', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    fireEvent.changeText(getByPlaceholderText('Vuelve a escribir la contraseña'), '123456');
    
    fireEvent.press(getByText('Registrarse'));
    
    expect(await findByText('No hay conexión a internet. Por favor, revisa tu red e intenta de nuevo.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register and redirects to verify-code on success', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    fireEvent.changeText(getByPlaceholderText('Vuelve a escribir la contraseña'), '123456');
    
    fireEvent.press(getByText('Registrarse'));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockPush).toHaveBeenCalledWith('/verify-code');
    });
  });

  it('handles auth/email-already-in-use error', async () => {
    mockRegister.mockRejectedValue({ code: 'auth/email-already-in-use' });
    
    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);
    
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    fireEvent.changeText(getByPlaceholderText('Vuelve a escribir la contraseña'), '123456');
    
    fireEvent.press(getByText('Registrarse'));
    
    expect(await findByText('El correo electrónico ya se encuentra registrado.')).toBeTruthy();
  });
});
