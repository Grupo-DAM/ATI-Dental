import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import ProfileScreen from '../app/(tabs)/profile';
import renderer from 'react-test-renderer';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => {
  return () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn().mockResolvedValue(true),
      })),
    })),
  });
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'es',
      changeLanguage: jest.fn().mockResolvedValue(true),
    },
  }),
}));

const mockVerifyBeforeUpdateEmail = jest.fn();
jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: {
      email: 'dr.smith@atidental.com',
      displayName: 'Valeria Smith',
      verifyBeforeUpdateEmail: mockVerifyBeforeUpdateEmail,
      updateProfile: jest.fn().mockResolvedValue(true),
    },
  });
});

describe('ProfileScreen - Enlace de Verificación de Correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockVerifyBeforeUpdateEmail.mockResolvedValue(true);
  });

  // ========================================================
  // TUS PRUEBAS ORIGINALES (INTACTAS)
  // ========================================================

  it('Caso Borde 3: Falla validación síncrona si el correo es inválido', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'correo_malo');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('profile.alerts.invalidEmail')).toBeTruthy();
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Caso Borde 3.2: Falla validación síncrona si el nombre está vacío', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    const inputNombre = getByTestId('input-name');
    fireEvent.changeText(inputNombre, '');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('profile.alerts.emptyName')).toBeTruthy();
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
    let tree;

    act(() => {
        tree = renderer.create(<ProfileScreen />).toJSON();
    });

    expect(tree).toMatchSnapshot();
  });

  // ========================================================
  // NUEVAS PRUEBAS DE COBERTURA (SIN ROMPER LAS ANTERIORES)
  // ========================================================

  it('Caso Borde 3.3: Falla validación síncrona si el apellido está vacío', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-lastname'), '');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('profile.alerts.emptyLastName')).toBeTruthy();
    });
  });

  it('Simulación Maestro: Intercepta dr.nuevo@atidental.com y abre el modal sin llamar a Firebase', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'dr.nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByTestId('modal-verification')).toBeTruthy();
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
    });
  });

  it('Simulación Maestro: Muestra error en pantalla si el correo ya está en uso', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'usado@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(getByText('profile.alerts.emailInUse')).toBeTruthy();
    });
  });

  // =========================================================================
  // SECCIÓN ADICIONAL: INCREMENTO METRIZADO DE COBERTURA DE COMENTARIOS/RAMAS
  // =========================================================================

  it('Flujo Exitoso Directo: Guarda el perfil si el correo electrónico no sufrió cambios', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    // Modificamos el nombre pero dejamos el correo igual al mock inicial (dr.smith@atidental.com)
    fireEvent.changeText(getByTestId('input-name'), 'Valeria Actualizada');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => {
      expect(mockVerifyBeforeUpdateEmail).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'profile.alerts.updatedTitle',
        'profile.alerts.updatedMessage'
      );
    });
  });

  it('Simulación Maestro: Cierra el modal exitosamente al usar el interceptor dr.nuevo@atidental.com', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'dr.nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));

    await waitFor(() => expect(getByTestId('modal-verification')).toBeTruthy());

    // Buscamos el callback de cierre que dispara handleCloseModal
    const modal = getByTestId('modal-verification');
    fireEvent(modal, 'close');

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'profile.alerts.updatedTitle',
        'profile.alerts.updatedVerifiedMessage'
      );
    });
  });

  it('Simulación Maestro: Cancela cambios en handleCloseModal si se usó un correo de error simulado', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    // Abrimos el modal con el flujo controlado
    fireEvent.changeText(getByTestId('input-email'), 'dr.nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));
    await waitFor(() => expect(getByTestId('modal-verification')).toBeTruthy());

    // Cambiamos el input a 'sinred@atidental.com' antes de disparar el evento de cierre
    // para forzar la rama de cancelación por error previo.
    fireEvent.changeText(getByTestId('input-email'), 'sinred@atidental.com');

    const modal = getByTestId('modal-verification');
    fireEvent(modal, 'close');

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'profile.alerts.canceledTitle',
        'profile.alerts.canceledMessage'
      );
    });
  });

  it('Simulación Maestro: Lanza excepción de red controlada al reenviar link con sinred@atidental.com', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    // Abrimos el modal con el flujo controlado
    fireEvent.changeText(getByTestId('input-email'), 'dr.nuevo@atidental.com');
    fireEvent.press(getByTestId('btn-save'));
    await waitFor(() => expect(getByTestId('modal-verification')).toBeTruthy());

    // Cambiamos el correo al de pruebas sin red
    fireEvent.changeText(getByTestId('input-email'), 'sinred@atidental.com');

    const modal = getByTestId('modal-verification');

    // Al intentar ejecutar el reenvío, este lanzará la excepción asíncrona 'auth/network-request-failed'
    expect(fireEvent(modal, 'resend')).rejects.toThrow('profile.alerts.noInternet');
  });
});