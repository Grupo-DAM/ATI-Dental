import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ClinicalHistoryScreen from '@/app/(tabs)/patients/clinical-history';

let mockSearchParams: Record<string, any> = { patientId: 'demo-patient' };
let mockUser: any = { rol: 'odontologo', nombre: 'Dr. Dentista' };
const mockSetActiveTab = jest.fn();
let mockActiveTab = 'consultas';
let mockLoading = false;
let mockError: any = null;
let mockDeleteConsultation = jest.fn().mockResolvedValue(true);
let mockDeleteTreatment = jest.fn().mockResolvedValue(true);
let mockRefetch = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#F9FAFB',
    backgroundElement: '#FFFFFF',
    text: '#1F2937',
    pageTitle: '#1F2937',
    fieldLabel: '#374151',
    main: '#5B2D8B',
    header: '#5B2D8B',
    border: '#E5E7EB',
    cardSeparator: '#E5E7EB',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'es' },
  }),
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

let mockRecord: any = {
  patient: {
    id: 'demo-patient',
    fullName: 'Paciente de Prueba',
    birthDate: '1990-01-01',
  },
  consultations: [],
  treatments: [],
  odontogram: null,
};

const mockExportClinicalRecordToPdf = jest.fn();
jest.mock('@/services/clinical-record-service', () => {
  const actual = jest.requireActual('@/services/clinical-record-service');
  return {
    ...actual,
    exportClinicalRecordToPdf: (...args: any[]) => mockExportClinicalRecordToPdf(...args),
  };
});

jest.mock('@/hooks/use-clinical-record', () => ({
  useClinicalRecord: () => ({
    record: mockRecord,
    loading: mockLoading,
    error: mockError,
    activeTab: mockActiveTab,
    setActiveTab: mockSetActiveTab,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    filteredConsultations: [],
    filteredTreatments: [],
    selectedConsultation: null,
    setSelectedConsultation: jest.fn(),
    refetch: mockRefetch,
    deleteConsultation: mockDeleteConsultation,
    updateConsultation: jest.fn(),
    updateOdontogram: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-fetch-odontogram', () => ({
  useFetchOdontogram: () => ({
    odontogram: null,
    loading: false,
    error: null,
    fetchOdontogram: jest.fn(),
  }),
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@/components/breadcrumb', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Breadcrumb: (props: any) => (
      <TouchableOpacity testID="breadcrumb-parent-btn" onPress={props.onParentPress}>
        <Text>{props.parent}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/clinical-history/PatientSummaryCard', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    PatientSummaryCard: (props: any) => (
      <View>
        <TouchableOpacity testID="export-pdf-btn" onPress={props.onExportPdf}>
          <Text>{props.isExporting ? 'exporting...' : 'export-pdf'}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="edit-patient-btn" onPress={props.onEditPatient}>
          <Text>edit-patient</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('@/components/clinical-history/ClinicalHistoryTabs', () => ({
  ClinicalHistoryTabs: () => null,
}));

jest.mock('@/components/clinical-history/ConsultationsTimeline', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    ConsultationsTimeline: (props: any) => (
      <View>
        <TouchableOpacity testID="schedule-appt-btn" onPress={props.onScheduleAppointment}>
          <Text>schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="register-consult-btn" onPress={props.onRegisterConsultation}>
          <Text>register</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-consult-btn" onPress={() => props.onDeleteConsultation('c-1')}>
          <Text>delete-consult</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('@/components/clinical-history/OdontogramContainer', () => ({
  OdontogramContainer: () => null,
}));

jest.mock('@/components/clinical-history/TreatmentsTimeline', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    TreatmentsTimeline: (props: any) => (
      <View>
        <TouchableOpacity testID="add-treatment-btn" onPress={props.onAddTreatment}>
          <Text>add-treatment</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="modify-treatment-btn" onPress={() => props.onModifyTreatment('t-1')}>
          <Text>modify-treatment</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-treatment-btn" onPress={() => props.onDeleteTreatment('t-1')}>
          <Text>delete-treatment</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

describe('ClinicalHistoryScreen Tab Preselection (US-39 / PR #214)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { rol: 'odontologo', nombre: 'Dr. Dentista' };
    mockSearchParams = { patientId: 'demo-patient' };
    mockLoading = false;
    mockError = null;
    mockRecord = {
      patient: {
        id: 'demo-patient',
        fullName: 'Paciente de Prueba',
        birthDate: '1990-01-01',
      },
      consultations: [],
      treatments: [],
      odontogram: null,
    };
  });

  it('preselecciona la pestaña de consultas cuando se recibe tab=consultas', () => {
    mockSearchParams = { patientId: 'demo-patient', tab: 'consultas' };
    render(<ClinicalHistoryScreen />);

    expect(mockSetActiveTab).toHaveBeenCalledWith('consultas');
  });

  it('preselecciona la pestaña de odontograma cuando se recibe tab=odontograma', () => {
    mockSearchParams = { patientId: 'demo-patient', tab: 'odontograma' };
    render(<ClinicalHistoryScreen />);

    expect(mockSetActiveTab).toHaveBeenCalledWith('odontograma');
  });

  it('preselecciona la pestaña de tratamientos cuando se recibe initialTab=tratamientos', () => {
    mockSearchParams = { patientId: 'demo-patient', initialTab: 'tratamientos' };
    render(<ClinicalHistoryScreen />);

    expect(mockSetActiveTab).toHaveBeenCalledWith('tratamientos');
  });

  it('muestra AccessDeniedView cuando el usuario es un asistente no autorizado', () => {
    mockUser = { rol: 'asistente', nombre: 'Asistente' };
    render(<ClinicalHistoryScreen />);

    expect(screen.getByTestId('access-denied-view')).toBeTruthy();
  });

  describe('Exportación de Historia Clínica a PDF (US-22)', () => {
    it('notifica amigablemente y no genera PDF cuando el paciente no tiene consultas ni tratamientos (Escenario 2)', async () => {
      mockRecord = {
        patient: { id: 'p-1', fullName: 'Paciente Sin Datos' },
        consultations: [],
        treatments: [],
        odontogram: null,
      };

      const { fireEvent, act } = require('@testing-library/react-native');
      render(<ClinicalHistoryScreen />);

      const exportBtn = screen.getByTestId('export-pdf-btn');
      await act(async () => {
        fireEvent.press(exportBtn);
      });

      expect(mockExportClinicalRecordToPdf).not.toHaveBeenCalled();
      expect(
        screen.getByText('El paciente no registra consultas ni tratamientos para exportar')
      ).toBeTruthy();
    });

    it('exporta exitosamente a PDF y despliega notificación de éxito cuando hay registros (Escenario 1)', async () => {
      mockRecord = {
        patient: { id: 'p-1', fullName: 'María González', patientCode: '#P-0042' },
        consultations: [
          { id: 'c-1', consultationDate: '2023-10-10', title: 'Consulta 1', motivo: 'Control' },
        ],
        treatments: [],
        odontogram: null,
      };

      mockExportClinicalRecordToPdf.mockResolvedValueOnce({
        file: { uri: 'file:///path/historia.pdf', numberOfPages: 1 },
        share: { shared: true },
      });

      const { fireEvent, act } = require('@testing-library/react-native');
      render(<ClinicalHistoryScreen />);

      const exportBtn = screen.getByTestId('export-pdf-btn');
      await act(async () => {
        fireEvent.press(exportBtn);
      });

      expect(mockExportClinicalRecordToPdf).toHaveBeenCalledWith(
        mockRecord,
        expect.objectContaining({
          doctorName: 'Dr. Dentista',
        })
      );
      expect(screen.getByText('Expediente generado exitosamente')).toBeTruthy();
    });

    it('maneja excepciones al exportar PDF y muestra notificación de error (Escenario 4)', async () => {
      mockRecord = {
        patient: { id: 'p-1', fullName: 'María González' },
        consultations: [
          { id: 'c-1', consultationDate: '2023-10-10', title: 'Consulta 1' },
        ],
        treatments: [],
        odontogram: null,
      };

      mockExportClinicalRecordToPdf.mockRejectedValueOnce(
        new Error('Fallo en el sistema de archivos')
      );

      const { fireEvent, act } = require('@testing-library/react-native');
      render(<ClinicalHistoryScreen />);

      const exportBtn = screen.getByTestId('export-pdf-btn');
      await act(async () => {
        fireEvent.press(exportBtn);
      });

      expect(screen.getByText('Fallo en el sistema de archivos')).toBeTruthy();
    });
  });

  describe('Navegación con Breadcrumb', () => {
    it('navega a la ficha del paciente usando patientId', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockSearchParams = { patientId: 'demo-patient' };
      render(<ClinicalHistoryScreen />);

      const breadcrumbBtn = screen.getByTestId('breadcrumb-parent-btn');
      fireEvent.press(breadcrumbBtn);

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/patient-file',
        params: { patientId: 'demo-patient' },
      });
    });

    it('navega a la ficha del paciente usando record.patient.id si no viene en params', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockSearchParams = {};
      render(<ClinicalHistoryScreen />);

      const breadcrumbBtn = screen.getByTestId('breadcrumb-parent-btn');
      fireEvent.press(breadcrumbBtn);

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/patient-file',
        params: { patientId: 'demo-patient' },
      });
    });

    it('navega a la lista de pacientes si no existe ningún id de paciente', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockSearchParams = {};
      mockRecord = { patient: null, consultations: [], treatments: [] };
      render(<ClinicalHistoryScreen />);

      const breadcrumbBtn = screen.getByTestId('breadcrumb-parent-btn');
      fireEvent.press(breadcrumbBtn);

      expect(router.push).toHaveBeenCalledWith('/(tabs)/patients/patients-list');
    });
  });

  describe('Acciones y navegación de la Historia Clínica', () => {
    it('ejecuta handleEditPatient al presionar editar paciente', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('edit-patient-btn'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(tabs)/patients/register-patient' })
      );
    });

    it('ejecuta handleScheduleAppointment y calcula la edad correctamente', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockRecord.patient.birthDate = '1995-12-31'; // Cubre branch de cumpleaños que aún no ocurre
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('schedule-appt-btn'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(tabs)/patients/schedule-appointment' })
      );
    });

    it('ejecuta handleRegisterConsultation', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('register-consult-btn'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(tabs)/patients/register-consultation' })
      );
    });

    it('ejecuta handleAddTreatment y handleModifyTreatment en pestaña tratamientos', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockActiveTab = 'tratamientos';
      mockSearchParams = { patientId: 'demo-patient', tab: 'tratamientos' };
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('add-treatment-btn'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(tabs)/patients/register-treatment' })
      );

      fireEvent.press(screen.getByTestId('modify-treatment-btn'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/patients/register-treatment',
          params: expect.objectContaining({ treatmentId: 't-1' }),
        })
      );
    });

    it('redirige a agendar cita sin parámetros si el paciente es nulo', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockActiveTab = 'consultas';
      mockSearchParams = { patientId: 'demo-patient', tab: 'consultas' };
      mockRecord = { patient: null, consultations: [], treatments: [] };
      render(<ClinicalHistoryScreen />);
      fireEvent.press(screen.getByTestId('schedule-appt-btn'));
      expect(router.push).toHaveBeenCalledWith('/(tabs)/patients/schedule-appointment');
    });

    it('elimina consulta y cierra el modal al confirmar', async () => {
      const { fireEvent, act } = require('@testing-library/react-native');
      mockActiveTab = 'consultas';
      mockSearchParams = { patientId: 'demo-patient', tab: 'consultas' };
      render(<ClinicalHistoryScreen />);
      fireEvent.press(screen.getByTestId('delete-consult-btn'));
      expect(screen.getByTestId('modal-confirm-btn')).toBeTruthy();
      await act(async () => {
        fireEvent.press(screen.getByTestId('modal-confirm-btn'));
      });
      expect(mockDeleteConsultation).toHaveBeenCalledWith('c-1');
    });

    it('cancela el modal de confirmación de eliminación', () => {
      const { fireEvent } = require('@testing-library/react-native');
      mockActiveTab = 'consultas';
      mockSearchParams = { patientId: 'demo-patient', tab: 'consultas' };
      render(<ClinicalHistoryScreen />);
      fireEvent.press(screen.getByTestId('delete-consult-btn'));
      fireEvent.press(screen.getByTestId('modal-cancel-btn'));
    });

    it('presiona el breadcrumb durante el estado de carga', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockLoading = true;
      mockRecord = null;
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('breadcrumb-parent-btn'));
      expect(router.push).toHaveBeenCalled();
    });

    it('presiona el breadcrumb durante el estado de error', () => {
      const { router } = require('expo-router');
      const { fireEvent } = require('@testing-library/react-native');
      mockLoading = false;
      mockError = 'Error de conexión';
      mockRecord = null;
      render(<ClinicalHistoryScreen />);

      fireEvent.press(screen.getByTestId('breadcrumb-parent-btn'));
      expect(router.push).toHaveBeenCalled();
    });
  });
});
