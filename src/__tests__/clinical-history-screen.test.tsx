import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ClinicalHistoryScreen from '@/app/(tabs)/patients/clinical-history';

let mockSearchParams: Record<string, any> = { patientId: 'demo-patient' };
let mockUser: any = { rol: 'odontologo', nombre: 'Dr. Dentista' };
const mockSetActiveTab = jest.fn();

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
    loading: false,
    error: null,
    activeTab: 'consultas',
    setActiveTab: mockSetActiveTab,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    filteredConsultations: [],
    filteredTreatments: [],
    selectedConsultation: null,
    setSelectedConsultation: jest.fn(),
    refetch: jest.fn(),
    deleteConsultation: jest.fn(),
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

jest.mock('@/components/breadcrumb', () => ({
  Breadcrumb: () => null,
}));

jest.mock('@/components/clinical-history/PatientSummaryCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    PatientSummaryCard: (props: any) => (
      <TouchableOpacity
        testID="export-pdf-btn"
        onPress={props.onExportPdf}
        accessibilityLabel="export-pdf-btn"
      >
        <Text>{props.isExporting ? 'exporting...' : 'export-pdf'}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/clinical-history/ClinicalHistoryTabs', () => ({
  ClinicalHistoryTabs: () => null,
}));

jest.mock('@/components/clinical-history/ConsultationsTimeline', () => ({
  ConsultationsTimeline: () => null,
}));

jest.mock('@/components/clinical-history/OdontogramContainer', () => ({
  OdontogramContainer: () => null,
}));

jest.mock('@/components/clinical-history/TreatmentsTimeline', () => ({
  TreatmentsTimeline: () => null,
}));

describe('ClinicalHistoryScreen Tab Preselection (US-39 / PR #214)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { rol: 'odontologo', nombre: 'Dr. Dentista' };
    mockSearchParams = { patientId: 'demo-patient' };
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
});
