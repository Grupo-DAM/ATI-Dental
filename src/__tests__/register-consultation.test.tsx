import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterConsultationScreen from '@/app/(tabs)/patients/register-consultation';
import * as ConsultationService from '@/services/consultation-service';
import * as PatientService from '@/services/patient-service';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockAuthUser = {
  id: 'doc-1',
  nombre: 'Smith',
  email: 'smith@atidental.com',
  rol: 'odontologo',
  estado: 'activo',
};

let mockAuth = {
  user: mockAuthUser as any,
  loading: false,
};

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#F7F6F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E1E6',
    border: '#DBD4E2',
    cardSeparator: '#D1D5DB',
    text: '#141018',
    textSecondary: '#60646C',
    main: '#5B2D8B',
    overMain: '#FFFFFF',
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    fieldLabel: '#374151',
    error: '#BA1A1A',
    placeholderColor: '#9E8BAC',
    accentBackground: '#F3E8FF',
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: true }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const mockPatient = {
  id: 'paciente_cova_123',
  fullName: 'María Cova',
  patientCode: '#P-0042',
  email: 'maria.cova@email.com',
  documentId: 'V-12345678',
  birthDate: '1995-05-15',
  allergies: 'Penicilina',
  conditions: 'Hipertensión',
};

const mockAppointments: ConsultationService.LinkedAppointment[] = [
  {
    id: 'appt-1',
    patientId: 'paciente_cova_123',
    date: '2026-10-02',
    time: '10:00 AM',
    treatmentName: 'Control y Limpieza',
    status: 'en progreso',
  },
  {
    id: 'appt-2',
    patientId: 'paciente_cova_123',
    date: '2026-10-03',
    time: '02:00 PM',
    treatmentName: 'Conducto',
    status: 'en espera',
  },
];

describe('RegisterConsultationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      patientId: 'paciente_cova_123',
    });
    mockAuth = {
      user: mockAuthUser,
      loading: false,
    };
    jest.spyOn(PatientService, 'getPatientById').mockResolvedValue(mockPatient as any);
    jest.spyOn(ConsultationService, 'getAppointmentsForPatient').mockResolvedValue(mockAppointments);
    jest.spyOn(ConsultationService, 'registerConsultationRecord').mockResolvedValue({
      success: true,
      data: { id: 'c-new-1', motivo: 'Control y Limpieza' } as any,
    });
  });

  it('Escenario 1: Registro exitoso de la consulta independiente', async () => {
    const { getByTestId, queryByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    // Llenar campos requeridos
    fireEvent.changeText(getByTestId('input-motivo'), 'Consulta general y profilaxis');
    fireEvent.changeText(getByTestId('input-diagnostico'), 'Salud periodontal óptima');
    fireEvent.changeText(getByTestId('input-tratamiento'), 'Limpieza dental con ultrasonido');
    fireEvent.changeText(getByTestId('input-observaciones'), 'Paciente no presenta sintomatología');

    // Presionar guardar consulta
    fireEvent.press(getByTestId('btn-submit-consultation'));

    // Debe abrir el modal de confirmación de envío
    expect(getByTestId('modal-confirm-btn')).toBeTruthy();

    // Confirmar en el modal
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(ConsultationService.registerConsultationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'paciente_cova_123',
          motivo: 'Consulta general y profilaxis',
          diagnostico: 'Salud periodontal óptima',
          tratamientoRecetado: 'Limpieza dental con ultrasonido',
          observaciones: 'Paciente no presenta sintomatología',
        }),
        undefined
      );
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/patients/clinical-history',
          params: { patientId: 'paciente_cova_123' },
        })
      );
    });
  });

  it('Escenario 1: Registro exitoso vinculado a cita en progreso', async () => {
    const { getByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    // Seleccionar cita en progreso
    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    fireEvent.press(getByTestId('appointment-option-appt-1'));

    // Llenar campos
    fireEvent.changeText(getByTestId('input-diagnostico'), 'Caries oclusal clase I');
    fireEvent.changeText(getByTestId('input-tratamiento'), 'Restauración con resina 3M');
    fireEvent.changeText(getByTestId('input-observaciones'), 'Anestesia local infiltrativa');

    fireEvent.press(getByTestId('btn-submit-consultation'));
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(ConsultationService.registerConsultationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 'appt-1',
          motivo: 'Control y Limpieza',
        }),
        'en progreso'
      );
    });
  });

  it('Escenario 2: Restringe vincular cita con estado incompatible (en espera)', async () => {
    const { getByTestId, getByText } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    // Intentar seleccionar appt-2 (en espera)
    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    fireEvent.press(getByTestId('appointment-option-appt-2'));

    // Muestra warning indicando que solo en progreso o completada son permitidas
    expect(getByTestId('incompatible-appointment-warning')).toBeTruthy();
    expect(
      getByText(
        'Solo se pueden generar registros de consulta para citas en progreso o completadas, o en su defecto de forma independiente.'
      )
    ).toBeTruthy();
  });

  it('Escenario 3: Validación de campos requeridos vacíos impide envío', async () => {
    const { getByTestId, getByText } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    // Enviar sin llenar motivo ni diagnóstico
    fireEvent.press(getByTestId('btn-submit-consultation'));

    expect(getByTestId('error-motivo')).toBeTruthy();
    expect(getByText('El motivo de consulta es obligatorio')).toBeTruthy();
    expect(getByTestId('error-diagnostico')).toBeTruthy();
    expect(getByText('El diagnóstico es obligatorio')).toBeTruthy();

    // No debe llamar al servicio
    expect(ConsultationService.registerConsultationRecord).not.toHaveBeenCalled();
  });

  it('Escenario 4: Cancelación con campos vacíos regresa directo a vista anterior', async () => {
    const { getByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-cancel-consultation'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('Escenario 4: Cancelación con campos sucios solicita confirmación de descarte', async () => {
    const { getByTestId, getByText } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    // Modificar campo
    fireEvent.changeText(getByTestId('input-motivo'), 'Evaluación de dolor');

    // Presionar cancelar
    fireEvent.press(getByTestId('btn-cancel-consultation'));

    // Modal de descarte visible
    expect(getByText('¿Descartar cambios?')).toBeTruthy();
    expect(getByText('Descartar cambios')).toBeTruthy();

    // Confirmar descarte
    fireEvent.press(getByText('Descartar cambios'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('Escenario 5: Manejo de error de red o servidor conserva datos en formulario', async () => {
    jest.spyOn(ConsultationService, 'registerConsultationRecord').mockResolvedValueOnce({
      success: false,
      error: 'Error de conexión con el servidor. No se pudo guardar el registro.',
    });

    const { getByTestId, getByDisplayValue } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('input-motivo'), 'Motivo persistente');
    fireEvent.changeText(getByTestId('input-diagnostico'), 'Diagnóstico persistente');
    fireEvent.changeText(getByTestId('input-tratamiento'), 'Tratamiento persistente');
    fireEvent.changeText(getByTestId('input-observaciones'), 'Observaciones persistentes');

    fireEvent.press(getByTestId('btn-submit-consultation'));
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      // Debe desplegar notificación de error (toast)
      expect(getByTestId('notification-toast')).toBeTruthy();
    });

    // Los datos deben conservarse intactos en los inputs para reintento
    expect(getByDisplayValue('Motivo persistente')).toBeTruthy();
    expect(getByDisplayValue('Diagnóstico persistente')).toBeTruthy();
    expect(getByDisplayValue('Tratamiento persistente')).toBeTruthy();
    expect(getByDisplayValue('Observaciones persistentes')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('permite actualizar el odontograma desde el botón dedicado', async () => {
    const { getByTestId, getByDisplayValue } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-update-odontogram'));
    expect(
      getByDisplayValue(
        'Odontograma inspeccionado y actualizado: sin lesiones cariosas activas, restauraciones intactas.'
      )
    ).toBeTruthy();
  });

  it('bloquea el acceso para usuarios no autorizados (ej. usuario_externo)', () => {
    mockAuth = {
      user: { ...mockAuthUser, rol: 'usuario_externo' } as any,
      loading: false,
    };

    const { getByTestId, queryByTestId } = render(<RegisterConsultationScreen />);

    expect(getByTestId('page-title-layout-access-denied')).toBeTruthy();
    expect(queryByTestId('btn-submit-consultation')).toBeNull();
  });

  it('permite acceso para usuario Administrador', async () => {
    mockAuth = {
      user: { ...mockAuthUser, rol: 'Administrador' } as any,
      loading: false,
    };

    const { getByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('btn-submit-consultation')).toBeTruthy();
    });
  });

  it('preselecciona cita compatible cuando appointmentId viene en route params', async () => {
    mockUseLocalSearchParams.mockReturnValueOnce({
      patientId: 'paciente_cova_123',
      appointmentId: 'appt-1',
    });

    const { getByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });
  });

  it('muestra error de cita cuando appointmentId en route params es incompatible', async () => {
    mockUseLocalSearchParams.mockReturnValueOnce({
      patientId: 'paciente_cova_123',
      appointmentId: 'appt-2',
    });

    const { getByTestId, getByText } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
      expect(getByTestId('appointment-error-text')).toBeTruthy();
    });
  });

  it('permite cancelar el modal de confirmación de envío', async () => {
    const { getByTestId, queryByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('input-motivo'), 'Consulta regular');
    fireEvent.changeText(getByTestId('input-diagnostico'), 'Diagnóstico regular');
    fireEvent.changeText(getByTestId('input-tratamiento'), 'Tratamiento regular');
    fireEvent.changeText(getByTestId('input-observaciones'), 'Observaciones regulares');

    fireEvent.press(getByTestId('btn-submit-consultation'));
    expect(getByTestId('modal-confirm-btn')).toBeTruthy();

    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(queryByTestId('modal-confirm-btn')).toBeNull();
  });

  it('limpia errores de validación al tipear en los campos', async () => {
    const { getByTestId, queryByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('input-odontograma'), '');
    fireEvent.press(getByTestId('btn-submit-consultation'));

    expect(getByTestId('error-motivo')).toBeTruthy();
    expect(getByTestId('error-tratamiento')).toBeTruthy();
    expect(getByTestId('error-observaciones')).toBeTruthy();
    expect(getByTestId('error-odontograma')).toBeTruthy();

    fireEvent.changeText(getByTestId('input-motivo'), 'Motivo corregido');
    expect(queryByTestId('error-motivo')).toBeNull();

    fireEvent.changeText(getByTestId('input-tratamiento'), 'Tratamiento corregido');
    expect(queryByTestId('error-tratamiento')).toBeNull();

    fireEvent.changeText(getByTestId('input-observaciones'), 'Observaciones corregidas');
    expect(queryByTestId('error-observaciones')).toBeNull();

    fireEvent.changeText(getByTestId('input-odontograma'), 'Odontograma corregido');
    expect(queryByTestId('error-odontograma')).toBeNull();
  });

  it('captura excepción inesperada en el submit y muestra toast de error', async () => {
    jest.spyOn(ConsultationService, 'registerConsultationRecord').mockRejectedValueOnce(
      new Error('Crash inesperado')
    );

    const { getByTestId, getByText } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('patient-summary-card')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('input-motivo'), 'Consulta de prueba');
    fireEvent.changeText(getByTestId('input-diagnostico'), 'Diagnóstico de prueba');
    fireEvent.changeText(getByTestId('input-tratamiento'), 'Tratamiento de prueba');
    fireEvent.changeText(getByTestId('input-observaciones'), 'Observaciones de prueba');

    fireEvent.press(getByTestId('btn-submit-consultation'));
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(getByTestId('notification-toast')).toBeTruthy();
      expect(getByText('Crash inesperado')).toBeTruthy();
    });

    // Dismiss toast
    fireEvent.press(getByTestId('btn-dismiss-toast'));
  });

  it('permite alternar la visualización del odontograma interactivo', async () => {
    const { getByTestId, queryByTestId } = render(<RegisterConsultationScreen />);

    await waitFor(() => {
      expect(getByTestId('btn-toggle-interactive-odontogram')).toBeTruthy();
    });

    expect(queryByTestId('interactive-odontogram-container')).toBeNull();

    // Abrir odontograma interactivo
    fireEvent.press(getByTestId('btn-toggle-interactive-odontogram'));

    await waitFor(() => {
      expect(getByTestId('interactive-odontogram-container')).toBeTruthy();
    });

    // Ocultar odontograma interactivo
    fireEvent.press(getByTestId('btn-toggle-interactive-odontogram'));
    expect(queryByTestId('interactive-odontogram-container')).toBeNull();
  });
});
