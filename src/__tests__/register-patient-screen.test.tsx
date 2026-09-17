import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterPatientScreen from '@/app/(tabs)/register-patient';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

const mockLaunchLibrary = jest.fn();
const mockRequestPermission = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestPermission(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const DateTimePicker = (props: { testID?: string }) => (
    <View testID={props.testID ?? 'birth-date-picker'} />
  );
  return { __esModule: true, default: DateTimePicker };
});

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
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

describe('RegisterPatientScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null });
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
    fireEvent.changeText(screen.getByTestId('input-document'), '123456789');
    fireEvent.changeText(screen.getByTestId('input-phone'), '5550000000');

    expect(screen.getByTestId('input-full-name').props.value).toBe('Juan Pérez');
    expect(screen.getByTestId('input-document').props.value).toBe('123456789');
    expect(screen.getByTestId('input-phone').props.value).toBe('5550000000');
  });

  it('muestra error de correo inválido', () => {
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
    fireEvent.changeText(screen.getByTestId('input-email'), 'correo-malo');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(screen.getByText('registerPatient.alerts.invalidEmail')).toBeTruthy();
  });

  it('registra cuando hay nombre', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<RegisterPatientScreen />);
    fireEvent.changeText(screen.getByTestId('input-full-name'), 'Juan Pérez');
    fireEvent.press(screen.getByTestId('btn-submit-patient'));
    expect(alertSpy).toHaveBeenCalledWith(
      'registerPatient.alerts.successTitle',
      'registerPatient.alerts.successMessage',
      expect.any(Array),
    );
    expect(screen.getByTestId('btn-submit-patient-loading')).toBeTruthy();
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
});
