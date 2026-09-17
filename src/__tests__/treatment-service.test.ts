import {
  createTreatment,
  getTreatmentsByPatientId,
  getTreatmentById,
  TREATMENTS_COLLECTION,
  TreatmentInput,
} from '@/services/treatment-service';
import { firestore } from '@/config/firebase';

describe('Treatment Service (Persistence Layer)', () => {
  const mockFirestoreInstance = firestore();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTreatment', () => {
    it('debe persistir un nuevo tratamiento con todos los datos y retornar el ID generado', async () => {
      const mockDocId = 'treatment-doc-abc-123';
      (mockFirestoreInstance.add as jest.Mock).mockResolvedValueOnce({ id: mockDocId });

      const input: TreatmentInput = {
        patientId: 'pat-001',
        patientName: 'Mariana López Rivera',
        category: 'Endodoncia',
        treatmentName: 'Tratamiento de conducto',
        dentalPiece: 'Pieza 21',
        treatmentDate: '10/25/2023',
        responsibleDentist: 'Dr. Martínez',
        status: 'En Progreso',
        notes: 'Requiere radiografía previa',
        estimatedCost: 220.50,
        pendingExams: [
          { id: '1', name: 'Radiografía periapical', date: '2023-10-24' },
        ],
      };

      const result = await createTreatment(input);

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(TREATMENTS_COLLECTION);
      expect(mockFirestoreInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'pat-001',
          patientName: 'Mariana López Rivera',
          category: 'Endodoncia',
          treatmentName: 'Tratamiento de conducto',
          dentalPiece: 'Pieza 21',
          estimatedCost: 220.50,
          pendingExams: input.pendingExams,
          createdAt: 'mock-server-timestamp',
          updatedAt: 'mock-server-timestamp',
        })
      );

      expect(result.id).toBe(mockDocId);
      expect(result.treatmentName).toBe('Tratamiento de conducto');
      expect(result.estimatedCost).toBe(220.50);
    });

    it('debe asignar valores predeterminados cuando los campos opcionales son omitidos', async () => {
      (mockFirestoreInstance.add as jest.Mock).mockResolvedValueOnce({ id: 'treatment-default-1' });

      const input: TreatmentInput = {
        patientId: 'pat-002',
        category: 'Odontología General',
        treatmentName: 'Limpieza dental',
        treatmentDate: '10/25/2023',
        responsibleDentist: 'Dr. Smith',
        status: 'Pendiente',
        estimatedCost: 60,
        pendingExams: [],
      };

      const result = await createTreatment(input);

      expect(mockFirestoreInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'pat-002',
          patientName: '',
          dentalPiece: 'Toda la boca',
          notes: '',
        })
      );
      expect(result.dentalPiece).toBe('Toda la boca');
    });

    it('debe propagar el error si Firestore falla en la inserción', async () => {
      (mockFirestoreInstance.add as jest.Mock).mockRejectedValueOnce(
        new Error('Firestore network timeout')
      );

      const input: TreatmentInput = {
        patientId: 'pat-003',
        category: 'Cirugía Oral',
        treatmentName: 'Extracción de muela',
        treatmentDate: '10/25/2023',
        responsibleDentist: 'Dra. García',
        status: 'Pendiente',
        estimatedCost: 90,
        pendingExams: [],
      };

      await expect(createTreatment(input)).rejects.toThrow('Firestore network timeout');
    });
  });

  describe('getTreatmentsByPatientId', () => {
    it('debe consultar tratamientos asociados al paciente especificado', async () => {
      const mockTreatmentsDocs = [
        {
          id: 't-1',
          data: () => ({
            patientId: 'pat-100',
            patientName: 'Mariana López',
            category: 'Ortodoncia',
            treatmentName: 'Brackets',
            dentalPiece: 'Toda la boca',
            treatmentDate: '10/25/2023',
            responsibleDentist: 'Dr. Smith',
            status: 'En Progreso',
            estimatedCost: 350,
            pendingExams: [],
          }),
        },
      ];

      (mockFirestoreInstance.where as jest.Mock).mockReturnValueOnce(mockFirestoreInstance);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: mockTreatmentsDocs,
      });

      const list = await getTreatmentsByPatientId('pat-100');

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(TREATMENTS_COLLECTION);
      expect(mockFirestoreInstance.where).toHaveBeenCalledWith('patientId', '==', 'pat-100');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('t-1');
      expect(list[0].treatmentName).toBe('Brackets');
    });

    it('debe retornar lista vacía si el paciente no tiene tratamientos registrados', async () => {
      (mockFirestoreInstance.where as jest.Mock).mockReturnValueOnce(mockFirestoreInstance);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const list = await getTreatmentsByPatientId('pat-sin-tratamientos');
      expect(list).toEqual([]);
    });
  });

  describe('getTreatmentById', () => {
    it('debe retornar el tratamiento si el documento existe', async () => {
      (mockFirestoreInstance.doc as jest.Mock).mockReturnValueOnce(mockFirestoreInstance);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        id: 't-doc-555',
        data: () => ({
          patientId: 'pat-100',
          treatmentName: 'Profilaxis',
          category: 'Odontología General',
          estimatedCost: 40,
        }),
      });

      const treatment = await getTreatmentById('t-doc-555');
      expect(mockFirestoreInstance.doc).toHaveBeenCalledWith('t-doc-555');
      expect(treatment).not.toBeNull();
      expect(treatment?.id).toBe('t-doc-555');
      expect(treatment?.treatmentName).toBe('Profilaxis');
    });

    it('debe retornar null si el documento no existe', async () => {
      (mockFirestoreInstance.doc as jest.Mock).mockReturnValueOnce(mockFirestoreInstance);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      const treatment = await getTreatmentById('non-existent');
      expect(treatment).toBeNull();
    });
  });
});
