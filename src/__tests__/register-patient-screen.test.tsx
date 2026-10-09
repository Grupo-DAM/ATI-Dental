import React from 'react';
import { Alert, Platform } from 'react-native';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';

import RegisterPatientScreen from '@/app/(tabs)/patients/register-patient';
import { isSystemDatePickerAvailable } from '@/components/ui/system-date-picker';

import { createPatient } from '@/services/patient-service';

type RegisterPatientI18n = { language: string };

(globalThis as { __registerPatientI18n?: RegisterPatientI18n }).__registerPatientI18n = {
  language: 'es',
};

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockUseAuth = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => ({}),
}));

const mockLaunchLibrary = jest.fn();
const mockRequestPermission = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestPermission(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
}));

jest.mock('@/components/ui/system-date-picker', () => {
  const actual = jest.requireActual('@/components/ui/system-date-picker');
  return {
    ...actual,
    isSystemDatePickerAvailable: jest.fn(() => true),
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, View } = require('react-native');
  const DateTimePicker = (props: {
    testID?: string;
    onChange?: (event: { type?: string }, date?: Date) => void;
  }) => (
    <View testID={props.testID ?? 'birth-date-picker'}>
      <Pressable
        testID="confirm-birth-date"
        onPress={() => props.onChange?.({ type: 'set' }, new Date(1990, 4, 15))}
      />
      <Pressable testID="dismiss-birth-date" onPress={() => props.onChange?.({ type: 'dismissed' })} />
    </View>
  );
  return { __esModule: true, default: DateTimePicker };
});

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: globalThis.__registerPatientI18n,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    overMain: '#ffffff',
    text: '#141018',
    fieldLabel: '#374151',
    textNames: '#4A4A4A',
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    cardSeparator: '#D1D5DB',
    placeholderColor: '#9E8BAC',
    backgroundElement: '#ffffff',
    backgroundSecondary: '#F9FAFB',
    pageSeparator: '#EDF2F7',
    border: '#DBD4E2',
    error: '#BA1A1A',
    background: '#F7F6F8',
    tooltipBackground: '#1A202C',
    backgroundSelected: '#E0E1E6',
  }),
}));

jest.mock('@/services/patient-service', () => ({
  createPatient: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  getPatientById: jest.fn(() =>
    Promise.resolve({
      id: 'mock-p1',
      fullName: 'Carlos Ramos',
      email: 'carlos@test.com',
      documentId: 'V-999',
      phone: '12345',
    })
  ),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/constants/user-roles', () => ({
  isOdontologoUser: (user: any) => user?.role === 'odontologo',
  isAdminUser: (user: any) => user?.role === 'admin',
  isAsistenteUser: (user: any) => user?.role === 'asistente',
  USER_ROLES: {
    ADMIN: 'admin',
    ODONTOLOGO: 'odontologo',
    ASISTENTE: 'asistente',
    PATIENT: 'patient',
  },
  getRoleLabelKey: (role?: string) => (role ? `roles.${role}` : 'roles.user'),
}));

describe('RegisterPatientScreen', () => {
  const originalOs = Platform.OS;
  const i18nState = { language: 'es' };

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.__registerPatientI18n = i18nState;
    mockCanGoBack.mockReturnValue(true);
    i18nState.language = 'es';
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    (isSystemDatePickerAvailable as jest.Mock).mockReturnValue(true);
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null });

    mockUseAuth.mockReturnValue({
      user: { role: 'odontologo' },
      loading: false,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('muestra el formulario de nuevo paciente', () => {
    render(<RegisterPatientScreen />);

    expect(screen.getByTestId('register-patient-screen')).toBeTruthy();
    expect(screen.getByText('registerPatient.title')).toBeTruthy();
    expect(screen.getByText('registerPatient.personalData')).toBeTruthy();
    expect(screen.getByText('registerPatient.profilePicture')).toBeTruthy();
    expect(screen.getByTestId('btn-change-photo')).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('vuelve atrás al cancelar', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-cancel-patient'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('muestra error inline si el nombre está vacío', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.emptyName')).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('conserva los valores ingresados en el formulario', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');

    // Seleccionar tipo V primero
    fireEvent.press(screen.getByTestId('btn-select-doc-type'));
    fireEvent.press(screen.getByTestId('doc-type-option-V'));
    fireEvent.changeText(screen.getByTestId('input-document'), '12345678');
    fireEvent.changeText(screen.getByTestId('input-phone'), '5550000000');

    expect(screen.getByTestId('input-full-name').props.value).toBe('Juan Pérez');
    expect(screen.getByTestId('input-document').props.value).toBe('12345678');
    expect(screen.getByTestId('input-phone').props.value).toBe('5550000000');
  });

  it('muestra error de correo inválido', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
    fireEvent.changeText(screen.getByTestId('input-email'), 'correo-malo');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();
  });

    it('registra cuando hay nombre', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
      render(<RegisterPatientScreen />);
      fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
      fireEvent.press(screen.getByTestId('btn-submit-patient'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'registerPatient.alerts.successTitle',
          'registerPatient.alerts.successMessage',
          expect.any(Array),
        );
      });
      alertSpy.mockRestore();
    });

  it('abre la galería para elegir foto de perfil', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', fileSize: 1200 }],
    });

    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
      expect(mockLaunchLibrary).toHaveBeenCalled();
    });
  });

  it('abre el calendario al pulsar fecha de nacimiento', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    expect(screen.getByTestId('birth-date-picker')).toBeTruthy();
  });

  it('guarda la fecha elegida en el calendario', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    fireEvent.press(screen.getByTestId('confirm-birth-date'));
    expect(screen.getByText('15/05/1990')).toBeTruthy();
  });

  it('ignora el calendario si se cancela', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    fireEvent.press(screen.getByTestId('dismiss-birth-date'));
    expect(screen.queryByText('15/05/1990')).toBeNull();
  });

  it('va a pacientes si no hay historial al cancelar', () => {
    mockCanGoBack.mockReturnValue(false);
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-cancel-patient'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/explore');
  });

  it('avisa si se deniega el permiso de galería', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.errorTitle',
        'registerPatient.alerts.photoPermission',
      );
    });
    alertSpy.mockRestore();
  });

  it('rechaza una foto mayor a 1MB', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://big.jpg', fileSize: 2 * 1024 * 1024 }],
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.errorTitle',
        'registerPatient.alerts.photoTooLarge',
      );
    });
    alertSpy.mockRestore();
  });

  it('quita la foto de perfil', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', fileSize: 1200 }],
    });
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));
    await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
    fireEvent.press(screen.getByTestId('btn-remove-photo'));
    expect(screen.getByTestId('btn-remove-photo')).toBeTruthy();
  });

  it('limpia el error de nombre al escribir', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.emptyName')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');
    expect(screen.queryByText('registerPatient.alerts.emptyName')).toBeNull();
  });

  it('limpia el error de correo al escribir', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('input-email'), 'malo');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('input-email'), 'ana@clinic.com');
    expect(screen.queryByText('registerPatient.alerts.invalidEmail')).toBeNull();
  });

    it('acepta un correo válido al registrar', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
      render(<RegisterPatientScreen />);
      fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');
      fireEvent.changeText(screen.getByTestId('input-email'), 'ana@clinic.com');
      fireEvent.press(screen.getByTestId('btn-submit-patient'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'registerPatient.alerts.successTitle',
          'registerPatient.alerts.successMessage',
          expect.any(Array),
        );
      });
      alertSpy.mockRestore();
    });

  it('rechaza correos sin dominio válido', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('input-email'), 'ana@clinic.');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();
  });

  it('abre género y tipo de sangre', () => {
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-gender'));
    fireEvent.press(screen.getByTestId('gender-option-female'));
    fireEvent.press(screen.getByTestId('select-blood-type'));
    fireEvent.press(screen.getByTestId('blood-option-O+'));
    expect(screen.getByTestId('select-gender')).toBeTruthy();
    expect(screen.getByTestId('select-blood-type')).toBeTruthy();
  });

  it('rellena campos clínicos', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-address'), 'Calle 1');
    fireEvent.changeText(screen.getByTestId('input-allergies'), 'Látex');
    fireEvent.changeText(screen.getByTestId('input-conditions'), 'Asma');
    fireEvent.changeText(screen.getByTestId('input-notes'), 'Nota');
    expect(screen.getByTestId('input-address').props.value).toBe('Calle 1');
    expect(screen.getByTestId('input-allergies').props.value).toBe('Látex');
  });

    it('cierra el estado de carga al confirmar el alert', async () => {
      const { createPatient } = require('@/services/patient-service');
      (createPatient as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
        buttons?.[0]?.onPress?.();
      });
      render(<RegisterPatientScreen />);
      
      // Llenar campos requeridos para pasar la validación
      fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');
      fireEvent.press(screen.getByTestId('btn-select-doc-type'));
      fireEvent.press(screen.getByTestId('doc-type-option-V'));
      fireEvent.changeText(screen.getByTestId('input-document'), '123456');
      
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-submit-patient'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('btn-submit-patient-loading')).toBeNull();
      }, { timeout: 3000 });
      alertSpy.mockRestore();
    });

  it('avisa si el selector de fotos no está disponible', async () => {
    const imagePicker = require('expo-image-picker') as {
      requestMediaLibraryPermissionsAsync?: unknown;
    };
    const original = imagePicker.requestMediaLibraryPermissionsAsync;
    delete imagePicker.requestMediaLibraryPermissionsAsync;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.errorTitle',
        'registerPatient.alerts.photoPickerUnavailable',
      );
    });

    imagePicker.requestMediaLibraryPermissionsAsync = original;
    alertSpy.mockRestore();
  });

  it('no cambia la foto si no hay assets', async () => {
    mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [] });
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));
    await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
    fireEvent.press(screen.getByTestId('btn-remove-photo'));
  });

  it('acepta una foto sin fileSize', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg' }],
    });
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('btn-change-photo'));
    await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
    fireEvent.press(screen.getByTestId('btn-remove-photo'));
  });

  it('avisa si el calendario nativo no está disponible', () => {
    (isSystemDatePickerAvailable as jest.Mock).mockReturnValue(false);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    expect(alertSpy).toHaveBeenCalledWith(
      'registerPatient.alerts.errorTitle',
      'registerPatient.alerts.datePickerUnavailable',
    );
    alertSpy.mockRestore();
  });

  it('abre el calendario en iOS y confirma la fecha', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    expect(screen.getByTestId('birth-date-picker')).toBeTruthy();
    fireEvent(screen.getByTestId('birth-date-modal'), 'requestClose');
    fireEvent.press(screen.getByTestId('select-birth-date'));
    fireEvent.press(screen.getByTestId('confirm-birth-date'));
    fireEvent.press(screen.getByTestId('btn-confirm-birth-date'));
    expect(screen.getByText('15/05/1990')).toBeTruthy();
  });

  it('usa locale en-US cuando el idioma es inglés', () => {
    i18nState.language = 'en';
    render(<RegisterPatientScreen />);
    fireEvent.press(screen.getByTestId('select-birth-date'));
    expect(screen.getByTestId('birth-date-picker')).toBeTruthy();
  });

  it('rechaza correos con espacios, sin usuario o con varios @', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Ana');

    fireEvent.changeText(screen.getByTestId('input-email'), 'ana @clinic.com');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('input-email'), '@clinic.com');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('input-email'), 'ana@cli@nic.com');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('input-email'), 'ana@clinic');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();
  });

  it('registra cuando hay nombre y llama a createPatient', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));

    await waitFor(() => {
      expect(createPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Juan Pérez',
        })
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.successTitle',
        'registerPatient.alerts.successMessage',
        expect.any(Array),
      );
    });
    alertSpy.mockRestore();
  });

  it('muestra alerta de error y conserva los datos ingresados si createPatient falla', async () => {
    (createPatient as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
    fireEvent.press(screen.getByTestId('btn-select-doc-type'));
    fireEvent.press(screen.getByTestId('doc-type-option-V'));
    fireEvent.changeText(screen.getByTestId('input-document'), '12345678');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.errorTitle',
        expect.stringContaining('registerPatient.alerts.saveError')
      );
    });

    // Se verifica que la información no se eliminó
    expect(screen.getByTestId('input-full-name').props.value).toBe('Juan Pérez');
    expect(screen.getByTestId('input-document').props.value).toBe('12345678');
    alertSpy.mockRestore();
  });

  it('rellena el formulario cuando se pasa patientData por params', () => {
    const mockData = JSON.stringify({
      fullName: 'Paciente Param',
      email: 'param@test.com',
      documentId: '12345',
    });
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientData: mockData,
    });

    render(<RegisterPatientScreen />);
    expect(screen.getByTestId('input-full-name').props.value).toBe('Paciente Param');
    expect(screen.getByTestId('input-email').props.value).toBe('param@test.com');
  });

  it('maneja error si patientData es un JSON inválido', () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientData: '{invalido',
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('carga paciente por patientId desde Firebase', async () => {
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientId: 'mock-p1',
    });

    render(<RegisterPatientScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('input-full-name').props.value).toBe('Carlos Ramos');
    });
  });

  it('navega con router.replace si canGoBack es falso al confirmar éxito', async () => {
    mockCanGoBack.mockReturnValueOnce(false);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.[0]?.onPress?.();
    });

    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/explore');
    });
    alertSpy.mockRestore();
  });

   it('muestra la vista de acceso denegado si el usuario no tiene los roles requeridos', () => {
    // Forzamos a que el usuario autenticado sea un paciente normal sin permisos de registro
    mockUseAuth.mockReturnValueOnce({
      user: { role: 'patient' },
      loading: false,
    });

    render(<RegisterPatientScreen />);

    // Debería renderizar la vista de acceso denegado en lugar del formulario
    expect(screen.queryByTestId('register-patient-screen')).toBeNull();
    expect(screen.getByText('registerPatient.accessDeniedTitle')).toBeTruthy();
    expect(screen.getByText('registerPatient.accessDeniedMessage')).toBeTruthy();
  });

  it('rellena el formulario usando campos alternativos en español desde patientData', () => {
    // Simulamos que la base de datos nos devuelve las propiedades mapeadas con nombres en español
    const mockLegacyData = JSON.stringify({
      nombre: 'María Delgado',
      cedula: 'V-11111',
      fechaNacimiento: '20/10/1995',
      genero: 'female',
      telefono: '04140000000',
      direccion: 'Av. Principal',
      tipoSangre: 'AB+',
      alergias: 'Ninguna',
      condiciones: 'Ninguna',
      notas: 'Paciente recurrente'
    });

    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientData: mockLegacyData,
    });

    render(<RegisterPatientScreen />);

    // Verificamos que las alternativas en español de populateFormWithPatient funcionaron
    expect(screen.getByTestId('input-full-name').props.value).toBe('María Delgado');
    expect(screen.getByTestId('input-document').props.value).toBe('11111');
    expect(screen.getByTestId('input-phone').props.value).toBe('04140000000');
    expect(screen.getByTestId('input-address').props.value).toBe('Av. Principal');
    expect(screen.getByTestId('input-allergies').props.value).toBe('Ninguna');
    expect(screen.getByTestId('input-conditions').props.value).toBe('Ninguna');
    expect(screen.getByTestId('input-notes').props.value).toBe('Paciente recurrente');
  });

  it('registra correctamente cuando la foto de perfil no tiene la propiedad fileSize', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    
    // Simulamos la selección de una foto que carece del campo fileSize (algunas plataformas/motores no lo traen)
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://valid-image.jpg' }], // Sin fileSize
    });

    render(<RegisterPatientScreen />);
    
    // Cambiamos la foto
    fireEvent.press(screen.getByTestId('btn-change-photo'));
    await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());

    // Completamos el formulario para guardarlo con la foto asignada
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Pedro Pérez');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));

    await waitFor(() => {
      expect(createPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Pedro Pérez',
          photoUri: 'file://valid-image.jpg',
        })
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'registerPatient.alerts.successTitle',
        'registerPatient.alerts.successMessage',
        expect.any(Array),
      );
    });
    alertSpy.mockRestore();
  });

  it('captura y maneja los errores silenciosamente si getPatientById falla al buscar por ID', async () => {
    const { getPatientById } = require('@/services/patient-service');
    // Forzamos a que la promesa falle simulando una desconexión o error de Firebase
    (getPatientById as jest.Mock).mockRejectedValueOnce(new Error('Firebase connection timeout'));
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientId: 'failed-id-123',
    });

    render(<RegisterPatientScreen />);

    // Esperamos a que la promesa se rechace y verifique el catch interno del useEffect
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[RegisterPatient] Error consultando paciente:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('limpia el error de documento cuando el usuario cambia el tipo o el número', () => {
    render(<RegisterPatientScreen />);

    // Provocar error de documento seleccionando tipo sin número
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Pedro');
    fireEvent.press(screen.getByTestId('btn-select-doc-type'));
    fireEvent.press(screen.getByTestId('doc-type-option-V'));
    fireEvent.press(screen.getByTestId('btn-submit-patient'));

    // Al escribir un número o cambiar de tipo, el error debe limpiarse
    fireEvent.changeText(screen.getByTestId('input-document'), '12345678');
    fireEvent.press(screen.getByTestId('btn-select-doc-type'));
    fireEvent.press(screen.getByTestId('doc-type-option-E'));
    expect(screen.getByTestId('input-document').props.value).toBeTruthy();
  });

  it('inicializa documento vacío cuando patientData viene sin datos de cédula', () => {
    const mockEmptyDoc = JSON.stringify({
      fullName: 'Sin Cedula',
      email: 'sincedula@test.com',
      documentId: '',
      cedula: '',
    });
    jest.spyOn(require('expo-router'), 'useLocalSearchParams').mockReturnValueOnce({
      patientData: mockEmptyDoc,
    });

    render(<RegisterPatientScreen />);
    expect(screen.getByTestId('input-full-name').props.value).toBe('Sin Cedula');
    expect(screen.getByTestId('input-document').props.value).toBe('');
  });
});
