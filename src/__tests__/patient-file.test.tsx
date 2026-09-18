import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PatientFileScreen from '../app/(tabs)/patient-file';
import { useAuth } from '../hooks/use-auth';
import { getPatientById } from '../services/patient-service';
import { getTreatmentsByPatientId } from '../services/treatment-service';
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
    }
  };
});

jest.mock('../hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/patient-service', () => ({
  getPatientById: jest.fn(),
  getPatientByEmail: jest.fn(),
}));

jest.mock('../services/treatment-service', () => ({
  getTreatmentsByPatientId: jest.fn(),
  deleteTreatment: jest.fn(),
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props)
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es' },
  }),
}));

describe('PatientFileScreen', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Consider adding an error boundary')) return;
      console.log('REACT ERROR:', ...args);
    });
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ patientId: '123' });
    (useAuth as jest.Mock).mockReturnValue({ user: { rol: 'odontologo' } });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const mockPatient = {
    id: '123',
    fullName: 'Juan Perez',
    documentId: 'V-12345678',
    phone: '04141234567',
    medicalHistory: [],
    knownAllergies: [],
    patientCode: '#P-0001',
    status: 'activo' as const,
  };

  const mockTreatments = [
    {
      id: 't1',
      treatmentName: 'Limpieza',
      treatmentDate: '2023-09-20T12:00:00',
      cost: '50',
      status: 'Completado',
      category: 'General',
    }
  ];

  it('renders loading state initially and then success state with treatments', async () => {
    (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
    (getTreatmentsByPatientId as jest.Mock).mockResolvedValue(mockTreatments);

    render(<PatientFileScreen />);
    
    // Initial loading
    expect(screen.getByText('patientFile.loading')).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByText('patientFile.loading')).toBeNull();
    });

    // Check if patient info is rendered
    expect(screen.getByText('Juan Perez')).toBeTruthy();
    expect(screen.getByText(/V-12345678/)).toBeTruthy();
    
    // Check if treatments are rendered
    expect(screen.getByText('Limpieza')).toBeTruthy();
  });

  it('renders empty state when no treatments exist', async () => {
    (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
    (getTreatmentsByPatientId as jest.Mock).mockResolvedValue([]);

    render(<PatientFileScreen />);

    await waitFor(() => {
      expect(screen.getByText('patientFile.noTreatments')).toBeTruthy();
    });
  });

  it('renders error state on fetch failure', async () => {
    (getPatientById as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<PatientFileScreen />);

    await waitFor(() => {
      expect(screen.getByText('patientFile.errors.loadFailed')).toBeTruthy();
    });

    expect(screen.getByText('patientFile.retry')).toBeTruthy();
  });

  it('navigates to register treatment screen when Add Treatment is clicked', async () => {
    (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
    (getTreatmentsByPatientId as jest.Mock).mockResolvedValue([]);

    render(<PatientFileScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-treatment-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-treatment-btn'));

    const { router } = require('expo-router');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/register-treatment',
      params: {
        patientId: '123',
        patientName: 'Juan Perez',
        patientCedula: 'V-12345678',
        patientPhone: '04141234567',
      },
    });
  });

  it('matches snapshot', async () => {
    (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
    (getTreatmentsByPatientId as jest.Mock).mockResolvedValue(mockTreatments);

    const { toJSON } = render(<PatientFileScreen />);
    
    await waitFor(() => {
      expect(screen.queryByText('patientFile.loading')).toBeNull();
    });

    expect(toJSON()).toMatchSnapshot();
  });

  describe('Formatting and Edge Cases', () => {
    it('handles various date formats and fallbacks gracefully', async () => {
      const edgeCasePatient = {
        ...mockPatient,
        birthDate: '1990-05-15', // string date
        gender: undefined, // missing gender
        phone: '', // missing phone
        nextAppointment: { toDate: () => new Date('2024-10-12T10:00:00Z') }, // firebase timestamp
        photoUri: 'https://example.com/photo.jpg',
      };

      const edgeCaseTreatments = [
        { id: 't1', status: 'En Progreso', category: 'General', treatmentDate: 'invalid-date' },
        { id: 't2', status: 'Pendiente', category: '', treatmentDate: '10/05/2023' },
        { id: 't3', status: 'Cancelado', category: 'Ortodoncia', treatmentDate: '2023-01-01T00:00:00Z' },
        { id: 't4', status: 'Preventivo', category: 'Limpieza', treatmentDate: null },
        { id: 't5', status: 'Desconocido', category: 'Cirugía', treatmentDate: undefined },
      ];

      (getPatientById as jest.Mock).mockResolvedValue(edgeCasePatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValue(edgeCaseTreatments);

      render(<PatientFileScreen />);

      await waitFor(() => {
        expect(screen.queryByText('patientFile.loading')).toBeNull();
      });

      // Verify PatientCard missing values handling
      expect(screen.getAllByText(/—/)).toBeTruthy(); // fallback for gender

      // Verify AppointmentBadges (Next Appointment format)
      expect(screen.getByText(/Oct/)).toBeTruthy();

      // Verify treatments status badges and date formats
      expect(screen.getByText('En Progreso')).toBeTruthy();
      expect(screen.getByText('Pendiente')).toBeTruthy();
      expect(screen.getByText('Cancelado')).toBeTruthy();
      expect(screen.getByText('Preventivo')).toBeTruthy();
      expect(screen.getByText('Desconocido')).toBeTruthy();

      expect(screen.getByText('invalid-date')).toBeTruthy(); // fallback on invalid date
    });

    it('renders medical history properly formatted', async () => {
      const patientWithMedical = {
        ...mockPatient,
        medicalHistory: ['hipertension_arterial', 'diabetes_tipo_2'],
        knownAllergies: ['penicilina'],
      };

      (getPatientById as jest.Mock).mockResolvedValue(patientWithMedical);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValue([]);

      render(<PatientFileScreen />);

      await waitFor(() => {
        expect(screen.queryByText('patientFile.loading')).toBeNull();
      });

      // Expand the medical background accordion
      fireEvent.press(screen.getByText('patientFile.medicalBackground'));

      // FormatAntecedente should remove underscores and capitalize
      // Verify text exists in the document somewhere
      await waitFor(() => {
        expect(screen.getByText(/Hipertension Arterial/i)).toBeTruthy();
      });
      expect(screen.getByText(/Diabetes Tipo 2/i)).toBeTruthy();
      expect(screen.getByText(/Penicilina/i)).toBeTruthy();
    });

    it('handles ActionBar rendering', async () => {
      (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValue(mockTreatments);

      render(<PatientFileScreen />);

      await waitFor(() => {
        expect(screen.queryByText('patientFile.loading')).toBeNull();
      });

      // Check for elements rendered by ActionBar / PatientCard
      expect(screen.getByTestId('patient-info-card')).toBeTruthy();
    });
  });
});
