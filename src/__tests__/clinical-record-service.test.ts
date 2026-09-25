import {
  fetchClinicalRecord,
  deleteConsultation,
  getConsultationsByPatientId,
} from '../services/clinical-record-service';
import { getPatientById } from '../services/patient-service';
import { getTreatmentsByPatientId } from '../services/treatment-service';
import { getSessionToken } from '../utils/secure-storage';
import { firestore } from '../config/firebase';

jest.mock('../config/firebase', () => ({
  firestore: jest.fn(),
}));

jest.mock('../services/patient-service', () => ({
  getPatientById: jest.fn(),
}));

jest.mock('../services/treatment-service', () => ({
  getTreatmentsByPatientId: jest.fn(),
}));

jest.mock('../utils/secure-storage', () => ({
  getSessionToken: jest.fn(),
}));

describe('clinical-record-service', () => {
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
    notes: 'Paciente con buena higiene',
    status: 'activo' as const,
  };

  const mockTreatments = [
    {
      id: 't-1',
      patientId: 'p-123',
      treatmentName: 'Limpieza Dental Profunda',
      category: 'Odontología General',
      treatmentDate: '2023-09-20T10:00:00Z',
      dentalPiece: 'Toda la boca',
      responsibleDentist: 'Dr. Smith',
      status: 'Completado',
      estimatedCost: 60,
      pendingExams: [],
    },
    {
      id: 't-2',
      patientId: 'p-123',
      treatmentName: 'Obturación Resina',
      category: 'Odontología General',
      treatmentDate: '2023-08-15T10:00:00Z',
      dentalPiece: 'Pieza 46',
      responsibleDentist: 'Dra. Martinez',
      status: 'Completado',
      estimatedCost: 45,
      pendingExams: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchClinicalRecord', () => {
    it('retorna error si no se pasa patientId', async () => {
      const result = await fetchClinicalRecord('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID de paciente no proporcionado');
    });

    it('consume exitosamente el endpoint serverless con Bearer Token cuando está disponible', async () => {
      (getSessionToken as jest.Mock).mockResolvedValue('mock-jwt-token');

      const serverPayload = {
        patient: mockPatient,
        consultations: [],
        treatments: mockTreatments,
        odontogram: {
          patientId: 'p-123',
          status: 'placeholder',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => serverPayload,
      });

      const result = await fetchClinicalRecord('p-123');

      expect(result.success).toBe(true);
      expect(result.data?.patient.fullName).toBe('María González');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/historias-clinicas/p-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('ejecuta fallback a Firestore cuando el endpoint serverless falla o no responde', async () => {
      (getSessionToken as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network connection failed'));

      (getPatientById as jest.Mock).mockResolvedValue(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValue(mockTreatments);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      };
      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      });

      const result = await fetchClinicalRecord('p-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.patient.id).toBe('p-123');
      expect(result.data?.treatments.length).toBe(2);
      expect(result.data?.odontogram.status).toBe('placeholder');
      // Debe haber generado consultas por defecto ordenadas cronológicamente descendente
      expect(result.data?.consultations.length).toBeGreaterThan(0);
      const dates = result.data?.consultations.map((c) => new Date(c.consultationDate).getTime()) || [];
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('retorna error si el paciente no existe en Firestore', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Server error'));
      (getPatientById as jest.Mock).mockResolvedValue(null);

      const result = await fetchClinicalRecord('p-inexistente');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Paciente no encontrado');
    });

    it('captura y propaga error si Firestore lanza excepción', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Server error'));
      (getPatientById as jest.Mock).mockRejectedValue(new Error('Firestore read failure'));

      const result = await fetchClinicalRecord('p-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firestore read failure');
    });
  });

  describe('getConsultationsByPatientId', () => {
    it('retorna lista de consultas mapeadas desde Firestore', async () => {
      const mockDoc = {
        id: 'c-100',
        data: () => ({
          patientId: 'p-123',
          consultationDate: '2023-09-20T10:00:00Z',
          title: 'Limpieza dental profunda',
          motivo: 'Control',
          diagnostico: 'Gingivitis leve',
          diagnosticoDetallado: ['Detalle 1'],
          proximaCita: '14 Oct 2023',
          doctor: 'Dr. Smith',
          duration: '45 minutos',
        }),
      };

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: false, docs: [mockDoc] }),
      };
      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
      });

      const consultations = await getConsultationsByPatientId('p-123');
      expect(consultations.length).toBe(1);
      expect(consultations[0].id).toBe('c-100');
      expect(consultations[0].diagnostico).toBe('Gingivitis leve');
    });

    it('retorna array vacío si la consulta a Firestore falla', async () => {
      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockRejectedValue(new Error('Permission denied')),
        }),
      });

      const consultations = await getConsultationsByPatientId('p-123');
      expect(consultations).toEqual([]);
    });
  });

  describe('deleteConsultation', () => {
    it('elimina documento en Firestore', async () => {
      const mockDelete = jest.fn().mockResolvedValue(true);
      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            delete: mockDelete,
          }),
        }),
      });

      const ok = await deleteConsultation('c-100');
      expect(ok).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
