import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useClinicalRecord } from '@/hooks/use-clinical-record';
import {
  fetchClinicalRecord,
  deleteConsultation,
  updateConsultation,
} from '@/services/clinical-record-service';
import { Consultation, ClinicalRecord } from '@/types/clinical-record';

jest.mock('@/services/clinical-record-service', () => ({
  fetchClinicalRecord: jest.fn(),
  deleteConsultation: jest.fn(),
  updateConsultation: jest.fn(),
}));

describe('useClinicalRecord Hook', () => {
  const mockPatient = {
    id: 'p-1',
    patientCode: '#P-0042',
    fullName: 'Juan Perez',
    documentId: 'V-12345678',
    status: 'activo' as const,
  };

  const mockConsultations: Consultation[] = [
    {
      id: 'c-1',
      patientId: 'p-1',
      consultationDate: '2023-09-20T10:00:00Z',
      title: 'Limpieza dental',
      motivo: 'Control general',
      diagnostico: 'Gingivitis leve',
      doctor: 'Dr. Smith',
    },
    {
      id: 'c-2',
      patientId: 'p-1',
      consultationDate: '2023-08-15T11:30:00Z',
      title: 'Obturación',
      motivo: 'Dolor molar',
      diagnostico: 'Caries oclusal',
      doctor: 'Dra. Martinez',
    },
  ];

  const mockTreatments = [
    {
      id: 't-1',
      patientId: 'p-1',
      patientName: 'Juan Perez',
      patientCedula: 'V-12345678',
      treatmentName: 'Profilaxis dental',
      responsibleDentist: 'Dr. Smith',
      treatmentDate: '2023-09-20',
      category: 'Higiene',
      notes: 'Limpieza con ultrasonido',
      status: 'Completado',
    },
    {
      id: 't-2',
      patientId: 'p-1',
      patientName: 'Juan Perez',
      patientCedula: 'V-12345678',
      treatmentName: 'Resina compuesta',
      responsibleDentist: 'Dra. Martinez',
      treatmentDate: '2023-08-15',
      category: 'Operatoria',
      notes: 'Pieza 46',
      status: 'Completado',
    },
  ];

  const mockRecord: ClinicalRecord = {
    patient: mockPatient,
    consultations: mockConsultations,
    treatments: mockTreatments,
    odontogram: { status: 'placeholder' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carga la historia clínica exitosamente y maneja refresh', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.record?.patient.fullName).toBe('Juan Perez');
      expect(result.current.error).toBeNull();
    });

    // Probar refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchClinicalRecord).toHaveBeenCalledTimes(2);
  });

  it('maneja error cuando fetchClinicalRecord falla', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Error de servidor',
    });

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Error de servidor');
    });
  });

  it('maneja error si no se pasa patientId', async () => {
    const { result } = renderHook(() => useClinicalRecord());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('No se proporcionó un ID de paciente');
    });
  });

  it('filtra consultas reactivamente por título, motivo, diagnóstico, fecha y doctor', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Filtro por motivo
    act(() => {
      result.current.setSearchQuery('control');
    });
    expect(result.current.filteredConsultations.length).toBe(1);
    expect(result.current.filteredConsultations[0].id).toBe('c-1');

    // Filtro por diagnóstico
    act(() => {
      result.current.setSearchQuery('caries');
    });
    expect(result.current.filteredConsultations.length).toBe(1);
    expect(result.current.filteredConsultations[0].id).toBe('c-2');

    // Filtro por doctor
    act(() => {
      result.current.setSearchQuery('martinez');
    });
    expect(result.current.filteredConsultations.length).toBe(1);
    expect(result.current.filteredConsultations[0].id).toBe('c-2');

    // Filtro por fecha
    act(() => {
      result.current.setSearchQuery('2023-09');
    });
    expect(result.current.filteredConsultations.length).toBe(1);

    // Filtro sin coincidencias
    act(() => {
      result.current.setSearchQuery('inexistente');
    });
    expect(result.current.filteredConsultations.length).toBe(0);
  });

  it('filtra tratamientos reactivamente por nombre, categoría, notas, fecha y odontólogo', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Filtro por categoría
    act(() => {
      result.current.setSearchQuery('higiene');
    });
    expect(result.current.filteredTreatments.length).toBe(1);
    expect(result.current.filteredTreatments[0].treatmentName).toBe('Profilaxis dental');

    // Filtro por notas
    act(() => {
      result.current.setSearchQuery('ultrasonido');
    });
    expect(result.current.filteredTreatments.length).toBe(1);

    // Filtro por odontólogo
    act(() => {
      result.current.setSearchQuery('martinez');
    });
    expect(result.current.filteredTreatments.length).toBe(1);
  });

  it('elimina consulta y limpia selectedConsultation si corresponde', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });
    (deleteConsultation as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Seleccionar consulta c-1
    act(() => {
      result.current.setSelectedConsultation(mockConsultations[0]);
    });
    expect(result.current.selectedConsultation?.id).toBe('c-1');

    // Eliminar consulta c-1
    let ok = false;
    await act(async () => {
      ok = await result.current.deleteConsultation('c-1');
    });

    expect(ok).toBe(true);
    expect(result.current.record?.consultations.find((c) => c.id === 'c-1')).toBeUndefined();
    expect(result.current.selectedConsultation).toBeNull();
  });

  it('actualiza consulta localmente y selectedConsultation de forma optimista', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });
    (updateConsultation as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useClinicalRecord('p-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSelectedConsultation(mockConsultations[0]);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.updateConsultation('c-1', {
        title: 'Limpieza dental ultrasónica avanzada',
      });
    });

    expect(ok).toBe(true);
    expect(
      result.current.record?.consultations.find((c) => c.id === 'c-1')?.title
    ).toBe('Limpieza dental ultrasónica avanzada');
    expect(result.current.selectedConsultation?.title).toBe(
      'Limpieza dental ultrasónica avanzada'
    );
  });

  it('maneja consultas y tratamientos con campos nulos o no definidos en el filtrado', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ...mockRecord,
        consultations: [
          { id: 'c-null', patientId: 'p-1' } as any,
        ],
        treatments: [
          { id: 't-null', patientId: 'p-1' } as any,
        ],
      },
    });

    const { result } = renderHook(() => useClinicalRecord('p-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchQuery('algo');
    });
    expect(result.current.filteredConsultations.length).toBe(0);
    expect(result.current.filteredTreatments.length).toBe(0);

    // Búsqueda vacía retorna todos
    act(() => {
      result.current.setSearchQuery('   ');
    });
    expect(result.current.filteredConsultations.length).toBe(1);
    expect(result.current.filteredTreatments.length).toBe(1);
  });

  it('no actualiza estado local si deleteConsultation o updateConsultation retornan false', async () => {
    (fetchClinicalRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecord,
    });
    (deleteConsultation as jest.Mock).mockResolvedValue(false);
    (updateConsultation as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useClinicalRecord('p-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.deleteConsultation('c-1');
    });
    expect(ok).toBe(false);
    expect(result.current.record?.consultations.length).toBe(2);

    await act(async () => {
      ok = await result.current.updateConsultation('c-1', { title: 'No cambiara' });
    });
    expect(ok).toBe(false);
  });
});
