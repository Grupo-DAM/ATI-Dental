import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ClinicalHistoryScreen from '../app/(tabs)/patients/clinical-history';
import { useAuth } from '../hooks/use-auth';
import { fetchClinicalRecord, deleteConsultation } from '../services/clinical-record-service';
import { deleteTreatment } from '../services/treatment-service';
import { useRouter, useLocalSearchParams } from 'expo-router';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    __esModule: true,
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    useFocusEffect: jest.fn((cb) => React.useEffect(cb, [])),
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    },
  };
});

jest.mock('../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/clinical-record-service', () => ({
  fetchClinicalRecord: jest.fn(),
  deleteConsultation: jest.fn(),
}));

jest.mock('../services/treatment-service', () => ({
  deleteTreatment: jest.fn(),
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'es' },
  }),
}));

describe('ClinicalHistoryScreen', () => {
  const mockRouterPush = jest.fn();

  const mockPatient = {
    id: 'p-123',
    patientCode: '#P-0042',
    fullName: 'María González',
    documentId: 'V-12345678',
    email: 'maria.gonzalez@email.com',
    phone: '04141234567',
    birthDate: '1990-05-15',
    bloodType: 'O+',
    knownAllergies: ['penicilina'],
    medicalHistory: ['hipertensión'],
    notes: 'Paciente cuidadosa',
    status: 'activo' as const,
  };

  const mockConsultations = [
    {
      id: 'c-1',
      patientId: 'p-123',
      consultationDate: '2023-09-20T10:00:00Z',
      title: 'Limpieza dental profunda',
      motivo: 'Control y Limpieza',
      diagnostico: 'Buena salud periodontal. Se recomienda profilaxis cada 6 meses.',
      diagnosticoDetallado: [
        'Gingivitis generalizada leve',
        'Acumulación de placa bacteriana',
      ],
      proximaCita: '14 Oct 2023',
      doctor: 'Dr. Smith',
      duration: '45 minutos',
      tratamientosRealizados: 'Limpieza Dental Profunda',
      notas: 'Sensibilidad leve.',
    },
    {
      id: 'c-2',
      patientId: 'p-123',
      consultationDate: '2023-08-15T10:00:00Z',
      title: 'Obturación Resina (Pieza 46)',
      motivo: 'Dolor en pieza 46',
      diagnostico: 'Caries oclusal en pieza 46.',
      diagnosticoDetallado: ['Caries clase I'],
      proximaCita: '20 Sep 2023',
      doctor: 'Dra. Martinez',
      duration: '30 minutos',
      tratamientosRealizados: 'Resina fotocurada',
      notas: 'Sin dolor tras tratamiento.',
    },
  ];

  const mockTreatments = [
    {
      id: 't-1',
      patientId: 'p-123',
      treatmentName: 'Limpieza Dental Profunda',
      category: 'Odontología General',
      treatmentDate: '2023-09-20T10:00:00Z',
      dentalPiece: 'Toda la boca',
      responsibleDentist: 'Dr. Smith',
      duration: '45 mins',
      status: 'Completado',
      notes: 'Profilaxis completa.',
      estimatedCost: 60,
      pendingExams: [],
    },
  ];

  const mockRecord = {
    patient: mockPatient,
    consultations: mockConsultations,
    treatments: mockTreatments,
    odontogram: {
      patientId: 'p-123',
      status: 'placeholder' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ patientId: 'p-123' });
    (useAuth as jest.Mock).mockReturnValue({
      user: { rol: 'odontologo' },
      loading: false,
    });
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });
    (deleteConsultation as jest.Mock).mockResolvedValue(true);
    (deleteTreatment as jest.Mock).mockResolvedValue(true);
  });

  // ── Escenario 1: Visualización de datos personales y antecedentes clínicos ──
  it('Escenario 1: Muestra los datos personales y antecedentes médicos en la parte superior', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('María González')).toBeTruthy();
      expect(screen.getByText(/V-12345678/)).toBeTruthy();
      expect(screen.getByText(/04141234567/)).toBeTruthy();
      expect(screen.getByText('O+')).toBeTruthy();
    });

    // Expandir antecedentes médicos
    fireEvent.press(screen.getByText('patientFile.medicalBackground'));

    await waitFor(() => {
      expect(screen.getByText(/penicilina/i)).toBeTruthy();
      expect(screen.getByText(/hipertensión/i)).toBeTruthy();
    });
  });

  // ── Escenario 2: Visualización del contenedor preparado para el odontograma futuro ──
  it('Escenario 2: Muestra el contenedor preparado para el odontograma futuro con badge Próximamente', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-odontograma')).toBeTruthy();
    });

    // Cambiar a la pestaña Odontograma
    fireEvent.press(screen.getByTestId('tab-odontograma'));

    await waitFor(() => {
      expect(screen.getByTestId('odontogram-container')).toBeTruthy();
      expect(screen.getByText('Próximamente')).toBeTruthy();
      expect(screen.getByText('Odontograma Dental')).toBeTruthy();
      expect(screen.getByText(/Módulo de Odontograma Digital/i)).toBeTruthy();
    });
  });

  // ── Escenario 3: Consulta del historial de evolución y diagnósticos ──
  it('Escenario 3: Muestra las intervenciones ordenadas cronológicamente con diagnóstico y procedimiento', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza dental profunda')).toBeTruthy();
      expect(screen.getByText('Obturación Resina (Pieza 46)')).toBeTruthy();
      expect(screen.getByText(/Buena salud periodontal/i)).toBeTruthy();
      expect(screen.getByText(/Caries oclusal/i)).toBeTruthy();
    });

    // Abrir detalle de consulta
    fireEvent.press(screen.getByText('Limpieza dental profunda'));

    await waitFor(() => {
      expect(screen.getByText('Motivo de Consulta')).toBeTruthy();
      expect(screen.getByText('Gingivitis generalizada leve')).toBeTruthy();
      expect(screen.getAllByText('14 Oct 2023').length).toBeGreaterThan(0);
    });
  });

  // ── Escenario 4: Restricción de acceso a usuarios no autorizados ──
  it('Escenario 4: Bloquea la visualización cuando el usuario tiene rol no autorizado (usuario_externo)', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { rol: 'usuario_externo' },
      loading: false,
    });

    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('clinical-history-access-denied')).toBeTruthy();
      expect(screen.getByText(/Acceso Restringido a Odontólogos/i)).toBeTruthy();
    });

    expect(screen.queryByText('María González')).toBeNull();
  });

  it('Permite el acceso a administradores según requerimiento', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { rol: 'admin' },
      loading: false,
    });

    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('María González')).toBeTruthy();
    });
  });

  // ── Escenario 5: Manejo de errores de red o fallo de servicio ──
  it('Escenario 5: Muestra mensaje de error amigable y permite reintentar ante fallo de red', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Error de conexión con el servidor',
    });

    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('clinical-history-error')).toBeTruthy();
      expect(screen.getByText('Error de conexión con el servidor')).toBeTruthy();
      expect(screen.getByTestId('btn-retry-clinical-history')).toBeTruthy();
    });

    // Reintentar con éxito
    (fetchClinicalRecord as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockRecord,
    });

    fireEvent.press(screen.getByTestId('btn-retry-clinical-history'));

    await waitFor(() => {
      expect(screen.getByText('María González')).toBeTruthy();
    });
  });

  // ── Búsqueda y filtrado reactivo ──
  it('filtra consultas reactivamente mediante el input de búsqueda', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza dental profunda')).toBeTruthy();
      expect(screen.getByText('Obturación Resina (Pieza 46)')).toBeTruthy();
    });

    const searchInput = screen.getByTestId('search-consultations-input');
    fireEvent.changeText(searchInput, 'Caries');

    await waitFor(() => {
      expect(screen.queryByText('Limpieza dental profunda')).toBeNull();
      expect(screen.getByText('Obturación Resina (Pieza 46)')).toBeTruthy();
    });
  });

  // ── Pestaña de Tratamientos y navegación ──
  it('cambia a pestaña de tratamientos y navega a registrar tratamiento', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-tratamientos')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('tab-tratamientos'));

    await waitFor(() => {
      expect(screen.getByTestId('treatments-timeline')).toBeTruthy();
      expect(screen.getByTestId('btn-add-treatment')).toBeTruthy();
    });

    const { router } = require('expo-router');
    fireEvent.press(screen.getByTestId('btn-add-treatment'));

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(tabs)/patients/register-treatment',
        params: expect.objectContaining({
          patientId: 'p-123',
        }),
      })
    );
  });

  it('navega a editar paciente al presionar botón de edición en la tarjeta', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Editar paciente')).toBeTruthy();
    });

    const { router } = require('expo-router');
    fireEvent.press(screen.getByLabelText('Editar paciente'));

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(tabs)/patients/register-patient',
        params: expect.objectContaining({
          patientId: 'p-123',
        }),
      })
    );
  });

  it('navega a agenda al presionar botón Agendar Cita', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-schedule-appointment')).toBeTruthy();
    });

    const { router } = require('expo-router');
    fireEvent.press(screen.getByTestId('btn-schedule-appointment'));

    expect(router.push).toHaveBeenCalledWith('/(tabs)/agenda');
  });

  it('permite abrir modal detallado y cambiar a pestaña de odontograma', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza dental profunda')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Limpieza dental profunda'));

    await waitFor(() => {
      expect(screen.getByText('Ver Odontograma')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Ver Odontograma'));

    await waitFor(() => {
      expect(screen.getByTestId('odontogram-container')).toBeTruthy();
    });
  });

  it('permite abrir modal de confirmación y eliminar una consulta', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0);
    });

    // Presionar botón Eliminar de la primera consulta
    fireEvent.press(screen.getAllByText('Eliminar')[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminación')).toBeTruthy();
    });

    // Confirmar eliminación en el modal
    fireEvent.press(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(deleteConsultation).toHaveBeenCalledWith('c-1');
    });
  });

  it('permite modificar y eliminar tratamiento desde la pestaña de tratamientos', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-tratamientos')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('tab-tratamientos'));

    await waitFor(() => {
      expect(screen.getByText('Modificar')).toBeTruthy();
    });

    const { router } = require('expo-router');
    fireEvent.press(screen.getByText('Modificar'));

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(tabs)/patients/register-treatment',
        params: expect.objectContaining({
          treatmentId: 't-1',
        }),
      })
    );

    // Eliminar tratamiento
    fireEvent.press(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(screen.getByText('Confirmar Eliminación')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(deleteTreatment).toHaveBeenCalledWith('t-1');
    });
  });

  it('filtra tratamientos reactivamente en la pestaña de tratamientos', async () => {
    render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('tab-tratamientos')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('tab-tratamientos'));

    await waitFor(() => {
      expect(screen.getByText('Limpieza Dental Profunda')).toBeTruthy();
    });

    const searchInput = screen.getByTestId('search-treatments-input');
    fireEvent.changeText(searchInput, 'OrtodonciaInexistente');

    await waitFor(() => {
      expect(screen.queryByText('Limpieza Dental Profunda')).toBeNull();
      expect(screen.getByTestId('empty-treatments')).toBeTruthy();
    });
  });

  // ── Snapshot test ──
  it('coincide con el snapshot estructural', async () => {
    const { toJSON } = render(<ClinicalHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('María González')).toBeTruthy();
    });

    expect(toJSON()).toMatchSnapshot();
  });
});
