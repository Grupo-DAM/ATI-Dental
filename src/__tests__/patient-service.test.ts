import {
  createPatient,
  getPatients,
  getPatientById,
  PATIENTS_COLLECTION,
  PatientInput,
} from '@/services/patient-service';
import { firestore } from '@/config/firebase';

describe('Patient Service (Persistence Layer)', () => {
  const mockFirestoreInstance = firestore();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('persiste un nuevo paciente con todos los campos y retorna el ID generado', async () => {
      const mockDocId = 'paciente-doc-123';
      (mockFirestoreInstance.add as jest.Mock).mockResolvedValueOnce({ id: mockDocId });
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ size: 0, docs: [] });

      const input: PatientInput = {
        fullName: 'Mariana López',
        documentId: 'V-18765432',
        birthDate: '15/05/1992',
        gender: 'female',
        phone: '+584120001122',
        email: 'mariana@ejemplo.com',
        address: 'Caracas, Venezuela',
        bloodType: 'O+',
        allergies: 'Penicilina',
        conditions: 'Ninguna',
        notes: 'Paciente referida',
      };

      const result = await createPatient(input);

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(PATIENTS_COLLECTION);
      expect(mockFirestoreInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Mariana López',
          documentId: 'V-18765432',
          email: 'mariana@ejemplo.com',
          bloodType: 'O+',
          status: 'activo',
          createdAt: 'mock-server-timestamp',
          updatedAt: 'mock-server-timestamp',
        })
      );
      expect(result.id).toBe(mockDocId);
      expect(result.fullName).toBe('Mariana López');
    });

    it('propaga error si la conexión con Firestore falla', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ size: 0, docs: [] });
      (mockFirestoreInstance.add as jest.Mock).mockRejectedValueOnce(
        new Error('Network connection timeout')
      );

      const input: PatientInput = {
        fullName: 'Juan Perez',
      };

      await expect(createPatient(input)).rejects.toThrow('Network connection timeout');
    });
  });

  describe('getPatients', () => {
    it('recupera la lista de pacientes registrados', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'p-1',
            data: () => ({
              fullName: 'Paciente 1',
              documentId: '123',
              status: 'activo',
            }),
          },
        ],
      });

      const patients = await getPatients();
      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe('p-1');
      expect(patients[0].fullName).toBe('Paciente 1');
    });

    it('retorna array vacío si no hay pacientes', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      const result = await getPatients();
      expect(result).toEqual([]);
    });

    it('propaga error si getPatients falla', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockRejectedValueOnce(
        new Error('Firestore read error')
      );
      await expect(getPatients()).rejects.toThrow('Firestore read error');
    });
  });

  describe('getPatientById', () => {
    it('retorna el paciente cuando existe el documento', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        id: 'doc-123',
        data: () => ({
          fullName: 'Juan Pérez',
          patientCode: '#P-0001',
          documentId: 'V-123',
        }),
      });

      const result = await getPatientById('doc-123');
      expect(result?.id).toBe('doc-123');
      expect(result?.fullName).toBe('Juan Pérez');
      expect(result?.patientCode).toBe('#P-0001');
    });

    it('lanza error si el documento no existe', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(getPatientById('doc-no-existe')).rejects.toThrow('PATIENT_NOT_FOUND');
    });

    it('propaga error si falla la consulta getPatientById', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockRejectedValueOnce(
        new Error('Read error')
      );
      await expect(getPatientById('doc-error')).rejects.toThrow('Read error');
    });
  });
});