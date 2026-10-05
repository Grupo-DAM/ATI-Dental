import {
  isAppointmentStatusCompatible,
  validateConsultationForm,
  registerConsultationRecord,
  updateAppointmentStatusToCompleted,
  getAppointmentsForPatient,
  ConsultationFormData,
} from '@/services/consultation-service';

// Mock secure storage
const mockGetSessionToken = jest.fn();
jest.mock('@/utils/secure-storage', () => ({
  getSessionToken: () => mockGetSessionToken(),
}));

// Mock firestore
const mockDocSet = jest.fn(() => Promise.resolve());
const mockDoc = jest.fn(() => ({
  set: mockDocSet,
}));
const mockAdd = jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }));
const mockWhere = jest.fn();
const mockCollection = jest.fn(() => ({
  add: mockAdd,
  doc: mockDoc,
  where: mockWhere,
}));

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: mockCollection,
  }),
}));

describe('consultation-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
    mockGetSessionToken.mockResolvedValue('test-jwt-bearer-token');
  });

  describe('isAppointmentStatusCompatible', () => {
    it('returns true for compatible statuses (en progreso, completada)', () => {
      expect(isAppointmentStatusCompatible('en progreso')).toBe(true);
      expect(isAppointmentStatusCompatible('EN PROGRESO')).toBe(true);
      expect(isAppointmentStatusCompatible('en_progreso')).toBe(true);
      expect(isAppointmentStatusCompatible('completada')).toBe(true);
      expect(isAppointmentStatusCompatible('COMPLETADA')).toBe(true);
    });

    it('returns false for incompatible statuses and falsy values', () => {
      expect(isAppointmentStatusCompatible('en espera')).toBe(false);
      expect(isAppointmentStatusCompatible('cancelado')).toBe(false);
      expect(isAppointmentStatusCompatible('confirmado')).toBe(false);
      expect(isAppointmentStatusCompatible('')).toBe(false);
      expect(isAppointmentStatusCompatible(undefined)).toBe(false);
    });
  });

  describe('validateConsultationForm', () => {
    const validData: ConsultationFormData = {
      patientId: 'p-1',
      motivo: 'Limpieza dental',
      diagnostico: 'Gingivitis leve',
      tratamientoRecetado: 'Profilaxis y flúor',
      observaciones: 'Paciente refiere sensibilidad leve',
      odontograma: 'Sin caries activas',
    };

    it('passes validation when all required fields are provided', () => {
      const result = validateConsultationForm(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('fails when motivo is missing or whitespace', () => {
      const result = validateConsultationForm({ ...validData, motivo: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.errors.motivo).toBe('El motivo de consulta es obligatorio');
    });

    it('fails when diagnostico is missing', () => {
      const result = validateConsultationForm({ ...validData, diagnostico: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.diagnostico).toBe('El diagnóstico es obligatorio');
    });

    it('fails when tratamientoRecetado is missing', () => {
      const result = validateConsultationForm({ ...validData, tratamientoRecetado: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.tratamientoRecetado).toBe('El tratamiento recetado es obligatorio');
    });

    it('fails when observaciones is missing', () => {
      const result = validateConsultationForm({ ...validData, observaciones: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.observaciones).toBe('Las observaciones son obligatorias');
    });

    it('fails when odontograma is missing', () => {
      const result = validateConsultationForm({ ...validData, odontograma: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.odontograma).toBe('El estado o notas del odontograma son obligatorios');
    });

    it('fails when appointmentId is provided with incompatible appointment status', () => {
      const result = validateConsultationForm(
        { ...validData, appointmentId: 'appt-1' },
        'en espera'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.appointmentId).toContain(
        'Solo se pueden generar registros de consulta para citas en progreso o completadas'
      );
    });

    it('passes when appointmentId is provided with compatible status', () => {
      const result = validateConsultationForm(
        { ...validData, appointmentId: 'appt-1' },
        'en progreso'
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('registerConsultationRecord', () => {
    const validData: ConsultationFormData = {
      patientId: 'p-1',
      motivo: 'Limpieza dental',
      diagnostico: 'Gingivitis leve',
      tratamientoRecetado: 'Profilaxis y flúor',
      observaciones: 'Sin novedades',
      odontograma: 'Sin caries activas',
    };

    it('returns error when validation fails', async () => {
      const result = await registerConsultationRecord({ ...validData, motivo: '' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('El motivo de consulta es obligatorio');
    });

    it('returns forced failure for testing error scenarios (Escenario 5)', async () => {
      const result = await registerConsultationRecord(validData, undefined, true);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error de conexión con el servidor');
    });

    it('successfully posts to WebAPI with Bearer token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'api-consultation-123' } }),
      });

      const result = await registerConsultationRecord(validData);
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/historias-clinicas/p-1/consultas'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-bearer-token',
          }),
        })
      );
    });

    it('updates linked appointment to completada when appointment was in progress', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'api-123' } }),
      });

      const result = await registerConsultationRecord(
        { ...validData, appointmentId: 'appt-99' },
        'en progreso'
      );

      expect(result.success).toBe(true);
      expect(mockDoc).toHaveBeenCalledWith('appt-99');
      expect(mockDocSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completada' }),
        { merge: true }
      );
    });

    it('falls back to Firestore when WebAPI throws network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      mockAdd.mockResolvedValueOnce({ id: 'firestore-doc-456' });

      const result = await registerConsultationRecord(validData);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('firestore-doc-456');
      expect(mockAdd).toHaveBeenCalled();
    });

    it('returns error when both WebAPI and Firestore fail', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      mockAdd.mockRejectedValueOnce(new Error('Firestore write timeout'));

      const result = await registerConsultationRecord(validData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore write timeout');
    });

    it('handles token read error gracefully and continues', async () => {
      mockGetSessionToken.mockRejectedValueOnce(new Error('KeyStore failure'));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'api-123' } }),
      });

      const result = await registerConsultationRecord(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateAppointmentStatusToCompleted', () => {
    it('updates appointment doc and returns true', async () => {
      const res = await updateAppointmentStatusToCompleted('appt-1');
      expect(res).toBe(true);
      expect(mockDoc).toHaveBeenCalledWith('appt-1');
      expect(mockDocSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completada' }),
        { merge: true }
      );
    });

    it('returns false when doc update throws', async () => {
      mockDocSet.mockRejectedValueOnce(new Error('Permission denied'));
      const res = await updateAppointmentStatusToCompleted('appt-1');
      expect(res).toBe(false);
    });
  });

  describe('getAppointmentsForPatient', () => {
    it('returns mapped appointments when firestore returns documents', async () => {
      const mockDocs = [
        {
          id: 'c-1',
          data: () => ({
            patientId: 'p-1',
            date: '2026-10-02',
            time: '09:00 AM',
            treatmentName: 'Limpieza',
            status: 'en progreso',
          }),
        },
      ];

      mockWhere.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          empty: false,
          docs: mockDocs,
        }),
      });

      const result = await getAppointmentsForPatient('p-1');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('c-1');
      expect(result[0].status).toBe('en progreso');
    });

    it('returns fallback appointments when firestore snapshot is empty', async () => {
      mockWhere.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          empty: true,
          docs: [],
        }),
      });

      const result = await getAppointmentsForPatient('p-1');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].patientId).toBe('p-1');
    });

    it('returns fallback appointments when firestore query throws error', async () => {
      mockWhere.mockReturnValueOnce({
        get: jest.fn().mockRejectedValueOnce(new Error('Network error')),
      });

      const result = await getAppointmentsForPatient('p-1');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
