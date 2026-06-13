import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import ProfileScreen from '../profile';
import renderer from 'react-test-renderer';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

const mockVerifyBeforeUpdateEmail = jest.fn();
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: {
      email: 'dr.smith@atidental.com',
      verifyBeforeUpdateEmail: mockVerifyBeforeUpdateEmail,
    },
  });
});

describe('ProfileScreen - Enlace de Verificación de Correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockVerifyBeforeUpdateEmail.mockResolvedValue(true);
  });

  it('Caso Borde 3: Falla validación síncrona si el correo es inválido', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'correo_malo');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('Formato de correo inválido')).toBeTruthy();
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Caso Borde 3.2: Falla validación síncrona si el nombre está vacío', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    const inputNombre = getByTestId('input-name');
    fireEvent.changeText(inputNombre, '');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('El nombre no puede estar vacío')).toBeTruthy();
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Caso Borde 2: Inestabilidad de red bloquea actualización', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.changeText(getByTestId('input-email'), 'nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Abre Modal de Enlace Enviado cuando se cambia el correo', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByTestId('modal-verification')).toBeTruthy();
      expect(mockVerifyBeforeUpdateEmail).toHaveBeenCalledWith('nuevo@atidental.com');
    });
  });

  it('Permite reenviar el enlace desde el modal', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => expect(getByTestId('modal-verification')).toBeTruthy());

    fireEvent.press(getByTestId('btn-resend-link'));

    await waitFor(() => {
      expect(mockVerifyBeforeUpdateEmail).toHaveBeenCalledTimes(2);
    });
  });

    it('Coincide con la instantánea (Snapshot Test)', () => {
      const tree = renderer.create(<ProfileScreen />).toJSON();
      expect(tree).toMatchSnapshot();
    });
});

